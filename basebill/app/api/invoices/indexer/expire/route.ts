import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function isAuthorized(req: NextRequest) {
  const secret = process.env.INDEXER_SECRET
  const header = req.headers.get('authorization')

  return Boolean(secret && header === `Bearer ${secret}`)
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { invoice_id } = body

  if (!invoice_id || typeof invoice_id !== 'string') {
    return NextResponse.json({ error: 'invoice_id required' }, { status: 400 })
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoice_id)
    .single()

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  if (invoice.status === 'paid') {
    return NextResponse.json({ status: 'skipped', reason: 'already_paid' })
  }

  if (invoice.status === 'expired') {
    return NextResponse.json({ status: 'skipped', reason: 'already_expired' })
  }

  if (!invoice.due_date || new Date(invoice.due_date) >= new Date()) {
    return NextResponse.json(
      { error: 'Invoice is not expired yet.' },
      { status: 422 }
    )
  }

  const { data: updatedInvoice, error: updateError } = await supabase
    .from('invoices')
    .update({ status: 'expired' })
    .eq('id', invoice_id)
    .eq('status', 'pending')
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    status: 'expired',
    invoice: updatedInvoice
  })
}
