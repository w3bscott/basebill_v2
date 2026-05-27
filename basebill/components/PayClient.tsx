'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  decodeFunctionResult,
  encodeFunctionData,
  formatUnits,
  isAddress,
  parseUnits
} from 'viem'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import ConnectButton from '@/components/ConnectButton'
import { useWallet } from '@/lib/useWallet'
import type { Invoice } from '@/types/invoice'

const USDC_SEPOLIA: `0x${string}` =
  '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
const BASE_SEPOLIA_CHAIN_ID = '0x14a34'

const statusClass: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-gray-100 text-gray-600'
}

const statusLabel: Record<string, string> = {
  paid: 'Paid',
  pending: 'Awaiting Payment',
  expired: 'Expired'
}

const erc20Abi = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

function bigintToHex(value: bigint) {
  return `0x${value.toString(16)}`
}

async function ensureBaseSepoliaChain() {
  const ethereum = window.ethereum
  if (!ethereum) return

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }]
    })
  } catch (error) {
    // If the chain isn't added in the wallet yet, try adding it then switching.
    try {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: BASE_SEPOLIA_CHAIN_ID,
            chainName: 'Base Sepolia',
            nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org']
          }
        ]
      })

      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }]
      })
    } catch {
      throw error
    }
  }
}

async function estimateGas(params: Record<string, unknown>) {
  const ethereum = window.ethereum
  if (!ethereum) return null

  const gasHex = await ethereum.request({
    method: 'eth_estimateGas',
    params: [params]
  })

  if (typeof gasHex !== 'string') return null
  return gasHex
}

async function getUsdcBalance(account: `0x${string}`) {
  const ethereum = window.ethereum
  if (!ethereum) return null

  const result = await ethereum.request({
    method: 'eth_call',
    params: [
      {
        to: USDC_SEPOLIA,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [account]
        })
      },
      'latest'
    ]
  })

  if (typeof result !== 'string') return null

  return decodeFunctionResult({
    abi: erc20Abi,
    functionName: 'balanceOf',
    data: result as `0x${string}`
  })
}

async function waitForReceipt(txHash: string) {
  const ethereum = window.ethereum
  if (!ethereum) return

  for (let i = 0; i < 30; i++) {
    const receipt = await ethereum.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash]
    })

    if (receipt && typeof receipt === 'object' && 'status' in receipt) {
      if (receipt.status === '0x1') return 'success' as const
      if (receipt.status === '0x0') return 'failed' as const
    }

    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  return 'timeout' as const
}

export function PayClient({ id }: { id: string }) {
  const { address, isConnected } = useWallet()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [txHash, setTxHash] = useState('')

  useEffect(() => {
    let active = true

    fetch(`/api/invoices/${id}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => {
        if (active) {
          setInvoice(d.invoice)
        }
      })
      .catch(() => {
        if (active) {
          setNotFound(true)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  async function handlePay() {
    try {
      if (!invoice || submitting) return

      const isExpired =
        invoice.due_date &&
        new Date(invoice.due_date) < new Date()

      if (isExpired) {
        toast.error('This invoice has expired.')
        return
      }

      if (!isConnected || !address) {
        toast.error('Connect your wallet first.')
        return
      }

      if (!window.ethereum) {
        toast.error('No injected wallet found.')
        return
      }

      if (!isAddress(USDC_SEPOLIA)) {
        toast.error('Invalid USDC contract address.')
        return
      }

      const recipient = invoice.forward_to?.trim() || invoice.creator_wallet

      if (!isAddress(recipient)) {
        toast.error('Invalid recipient address.')
        return
      }

      setSubmitting(true)

      await ensureBaseSepoliaChain()

      if (!isAddress(address)) {
        toast.error('Invalid connected wallet address.')
        return
      }

      const transferAmount = parseUnits(String(invoice.amount_usdc), 6)
      const currentBalance = await getUsdcBalance(address)

      if (currentBalance !== null && currentBalance < transferAmount) {
        toast.error(
          `Insufficient Base Sepolia USDC. Balance: ${formatUnits(
            currentBalance,
            6
          )} USDC`
        )
        return
      }

      const transferData = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [
          recipient,
          transferAmount
        ]
      })

      const txForWallet: Record<string, unknown> = {
        from: address,
        to: USDC_SEPOLIA,
        data: transferData,
        value: '0x0'
      }

      // Estimate gas and set a cap. Some wallets/RPCs will otherwise submit an
      // absurdly high gas value and get rejected ("exceeds max transaction gas limit").
      try {
        const estimatedGasHex = await estimateGas(txForWallet)
        if (estimatedGasHex) {
          const estimatedGas = BigInt(estimatedGasHex)
          const paddedGas =
            (estimatedGas * BigInt('120')) / BigInt('100')
          const cappedGas =
            paddedGas > BigInt('500000')
              ? BigInt('500000')
              : paddedGas
          txForWallet.gas = bigintToHex(cappedGas)
        } else {
          txForWallet.gas = '0x249f0' // 150,000
        }
      } catch {
        txForWallet.gas = '0x249f0' // 150,000
      }

      console.info('BaseBill USDC transfer request', {
        chainId: BASE_SEPOLIA_CHAIN_ID,
        contract: USDC_SEPOLIA,
        from: address,
        recipient,
        amountUsdc: invoice.amount_usdc,
        amountBaseUnits: transferAmount.toString(),
        request: txForWallet
      })

      const hash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txForWallet]
      })

      if (typeof hash !== 'string') {
        throw new Error('Wallet did not return a transaction hash.')
      }

      setTxHash(hash)
      toast.success('Transaction submitted. Waiting for confirmation...')

      // Store tx_hash early so the payer can still see it even if confirmation is slow.
      try {
        await fetch(`/api/invoices/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tx_hash: hash
          })
        })
      } catch {
        // non-fatal
      }

      const outcome = await waitForReceipt(hash)
      if (outcome === 'failed') {
        toast.error('Transaction reverted.')
        return
      }
      if (outcome === 'timeout') {
        toast.message('Transaction pending confirmation in wallet/RPC.')
        return
      }

      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          tx_hash: hash
        })
      })
      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error ?? 'Unable to update invoice.')
      }

      setInvoice(responseData.invoice)
      toast.success('Payment confirmed and invoice marked as paid.')
    } catch (err) {
      console.error(err)
      toast.error('Payment failed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center text-muted-foreground">
            Invoice not found.
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!invoice) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </main>
    )
  }

  const isExpired =
    invoice.due_date &&
    new Date(invoice.due_date) < new Date()

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{invoice.label}</CardTitle>
          <Badge
            className={`w-fit mt-1 ${
              statusClass[invoice.status] ??
              statusClass.pending
            }`}
          >
            {statusLabel[invoice.status] ?? 'Pending'}
          </Badge>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <p className="text-4xl font-bold">
            {Number(invoice.amount_usdc).toFixed(2)}{' '}
            <span className="text-lg font-normal text-muted-foreground">
              USDC
            </span>
          </p>

          {invoice.description && (
            <p className="text-sm text-muted-foreground">
              {invoice.description}
            </p>
          )}

          {invoice.due_date && (
            <p className="text-xs text-muted-foreground">
              Due: {new Date(invoice.due_date).toLocaleDateString()}
            </p>
          )}

          {invoice.status === 'paid' &&
            invoice.tx_hash && (
              <a
                href={`https://sepolia.basescan.org/tx/${invoice.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 underline"
              >
                View on Basescan
              </a>
            )}

          {(invoice.status === 'expired' || isExpired) && (
            <p className="text-sm text-muted-foreground">
              This invoice has expired.
            </p>
          )}

          {invoice.status === 'pending' &&
            !isExpired && (
              <>
                <div className="pt-1">
                  <ConnectButton />
                </div>
                <Button
                  onClick={handlePay}
                  disabled={!isConnected || submitting}
                >
                  {submitting
                    ? 'Processing...'
                    : `Pay ${Number(invoice.amount_usdc).toFixed(2)} USDC`}
                </Button>

                {txHash && (
                  <p className="text-sm text-green-600 text-center">
                    Payment sent. Invoice will confirm shortly.
                  </p>
                )}
              </>
            )}
        </CardContent>
      </Card>
    </main>
  )
}
