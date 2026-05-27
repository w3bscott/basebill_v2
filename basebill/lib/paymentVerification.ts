import {
  createPublicClient,
  decodeEventLog,
  getAddress,
  http,
  parseUnits
} from 'viem'
import { baseSepolia } from 'viem/chains'

import { supabase } from '@/lib/supabase'

const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'

const erc20Abi = [
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ]
  }
] as const

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
})

function normalizeAddress(address: string | null | undefined) {
  if (!address) return null

  try {
    return getAddress(address)
  } catch {
    return null
  }
}

function normalizeTxHash(txHash: unknown) {
  if (
    typeof txHash !== 'string' ||
    !/^0x[a-fA-F0-9]{64}$/.test(txHash)
  ) {
    return null
  }

  return txHash.toLowerCase() as `0x${string}`
}

export async function verifyAndMarkInvoicePaid(
  invoiceId: unknown,
  txHash: unknown
) {
  if (!invoiceId || typeof invoiceId !== 'string') {
    return {
      ok: false as const,
      error: 'invoice_id required',
      status: 400
    }
  }

  const normalizedTxHash = normalizeTxHash(txHash)
  if (!normalizedTxHash) {
    return {
      ok: false as const,
      error: 'Valid tx_hash required',
      status: 400
    }
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (invoiceError || !invoice) {
    return {
      ok: false as const,
      error: 'Invoice not found',
      status: 404
    }
  }

  if (
    invoice.status === 'paid' &&
    invoice.tx_hash?.toLowerCase() === normalizedTxHash
  ) {
    return {
      ok: true as const,
      status: 'already_paid' as const,
      invoice
    }
  }

  if (invoice.status !== 'pending') {
    return {
      ok: false as const,
      error: 'Only pending invoices can be marked paid.',
      status: 409
    }
  }

  if (
    invoice.tx_hash &&
    invoice.tx_hash.toLowerCase() !== normalizedTxHash
  ) {
    return {
      ok: false as const,
      error: 'Invoice already has a different tx_hash.',
      status: 409
    }
  }

  const { data: duplicateTxInvoice, error: duplicateTxError } = await supabase
    .from('invoices')
    .select('id,status')
    .ilike('tx_hash', normalizedTxHash)
    .neq('id', invoiceId)
    .maybeSingle()

  if (duplicateTxError) {
    return {
      ok: false as const,
      error: duplicateTxError.message,
      status: 500
    }
  }

  if (duplicateTxInvoice) {
    return {
      ok: false as const,
      error: 'tx_hash already belongs to another invoice.',
      status: 409
    }
  }

  let receipt
  try {
    receipt = await publicClient.getTransactionReceipt({
      hash: normalizedTxHash
    })
  } catch {
    return {
      ok: false as const,
      error: 'Transaction receipt not found on Base Sepolia.',
      status: 422
    }
  }

  if (receipt.status !== 'success') {
    return {
      ok: false as const,
      error: 'Transaction was not successful.',
      status: 422
    }
  }

  const usdcAddress = getAddress(USDC_BASE_SEPOLIA)
  if (normalizeAddress(receipt.to) !== usdcAddress) {
    return {
      ok: false as const,
      error: 'Transaction does not target Base Sepolia USDC.',
      status: 422
    }
  }

  const creatorWallet = normalizeAddress(invoice.creator_wallet)
  const forwardTo = normalizeAddress(invoice.forward_to)
  const allowedRecipients = new Set(
    [creatorWallet, forwardTo].filter(
      (address): address is `0x${string}` => Boolean(address)
    )
  )

  if (allowedRecipients.size === 0) {
    return {
      ok: false as const,
      error: 'Invoice has no valid recipient wallet.',
      status: 422
    }
  }

  const expectedAmount = parseUnits(String(invoice.amount_usdc), 6)

  const matchedLog = receipt.logs.find(log => {
    if (getAddress(log.address) !== usdcAddress) {
      return false
    }

    try {
      const event = decodeEventLog({
        abi: erc20Abi,
        data: log.data,
        topics: log.topics
      })

      if (event.eventName !== 'Transfer') return false

      const recipient = normalizeAddress(event.args.to)
      return (
        recipient !== null &&
        allowedRecipients.has(recipient) &&
        event.args.value === expectedAmount
      )
    } catch {
      return false
    }
  })

  if (!matchedLog) {
    return {
      ok: false as const,
      error: 'Transaction does not exactly match invoice.',
      status: 422
    }
  }

  const { data: updatedInvoice, error: updateError } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      tx_hash: normalizedTxHash
    })
    .eq('id', invoiceId)
    .eq('status', 'pending')
    .select()
    .single()

  if (updateError) {
    return {
      ok: false as const,
      error: updateError.message,
      status: 500
    }
  }

  return {
    ok: true as const,
    status: 'paid' as const,
    invoice: updatedInvoice
  }
}
