import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('creator_wallet', params.address)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ invoices: data })
}