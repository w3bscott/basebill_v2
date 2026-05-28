import { NextRequest, NextResponse } from 'next/server'

import { verifyAndMarkInvoicePaid } from '@/lib/paymentVerification'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const result = await verifyAndMarkInvoicePaid(body.invoice_id, body.tx_hash)

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    )
  }

  return NextResponse.json({
    status: result.status,
    invoice: result.invoice
  })
}
