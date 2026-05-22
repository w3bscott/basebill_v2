import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  return NextResponse.json({ invoice: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ invoice: data })
}