import { NextRequest, NextResponse } from 'next/server'

import { verifyAndMarkInvoicePaid } from '@/lib/paymentVerification'

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
