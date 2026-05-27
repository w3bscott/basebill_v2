import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function isAuthorized(req: NextRequest) {
  const secret = process.env.INDEXER_SECRET
  const header = req.headers.get('authorization')

  return Boolean(secret && header === `Bearer ${secret}`)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  return NextResponse.json({ invoice: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = await params
  const body = await req.json()
  const { status, tx_hash } = body

  if (status) {
    return NextResponse.json(
      { error: 'Status updates are handled by the payment indexer.' },
      { status: 403 }
    )
  }

  if (!tx_hash || typeof tx_hash !== 'string') {
    return NextResponse.json({ error: 'tx_hash required' }, { status: 400 })
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(tx_hash)) {
    return NextResponse.json({ error: 'Invalid tx_hash' }, { status: 400 })
  }

  const normalizedTxHash = tx_hash.toLowerCase()

  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (fetchError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  if (invoice.status !== 'pending') {
    return NextResponse.json(
      { error: 'Finalized invoices cannot be updated.' },
      { status: 409 }
    )
  }

  if (
    invoice.tx_hash &&
    invoice.tx_hash.toLowerCase() !== normalizedTxHash
  ) {
    return NextResponse.json(
      { error: 'Invoice already has a different tx_hash.' },
      { status: 409 }
    )
  }

  if (invoice.tx_hash?.toLowerCase() === normalizedTxHash) {
    return NextResponse.json({
      status: 'skipped',
      reason: 'tx_hash_already_attached',
      invoice
    })
  }

  const { data: duplicateTxInvoice, error: duplicateTxError } = await supabase
    .from('invoices')
    .select('id,status')
    .ilike('tx_hash', normalizedTxHash)
    .neq('id', resolvedParams.id)
    .maybeSingle()

  if (duplicateTxError) {
    return NextResponse.json({ error: duplicateTxError.message }, { status: 500 })
  }

  if (duplicateTxInvoice) {
    return NextResponse.json(
      { error: 'tx_hash already belongs to another invoice.' },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from('invoices')
    .update({
      tx_hash: normalizedTxHash
    })
    .eq('id', resolvedParams.id)
    .eq('status', 'pending')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ invoice: data })
}
