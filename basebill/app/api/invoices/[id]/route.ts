import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
  const resolvedParams = await params
  const body = await req.json()
  const { status, tx_hash } = body

  const validStatuses = ['pending', 'paid', 'expired']
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('invoices')
    .update({
      ...(status && { status }),
      ...(tx_hash && { tx_hash })
    })
    .eq('id', resolvedParams.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ invoice: data })
}