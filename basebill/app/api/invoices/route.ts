import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { label, amount_usdc, description, due_date, forward_to, creator_wallet } = body

  if (!creator_wallet || typeof creator_wallet !== 'string') {
    return NextResponse.json({ error: 'Valid creator_wallet required' }, { status: 400 })
  }
  if (!amount_usdc || Number(amount_usdc) <= 0) {
    return NextResponse.json({ error: 'amount_usdc must be positive' }, { status: 400 })
  }
  if (!label || typeof label !== 'string') {
    return NextResponse.json({ error: 'label required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      label,
      amount_usdc: Number(amount_usdc),
      description,
      due_date,
      forward_to,
      creator_wallet
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ invoice: data }, { status: 201 })
}