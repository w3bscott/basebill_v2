'use client'

import { useEffect, useState, use } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Invoice } from '@/types/invoice'

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/invoices/${resolvedParams.id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setInvoice(d.invoice))
      .catch(() => setNotFound(true))
  }, [resolvedParams.id])

  if (notFound) return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center text-muted-foreground">
          Invoice not found.
        </CardContent>
      </Card>
    </main>
  )

  if (!invoice) return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </main>
  )

  const statusLabel = {
    paid: '✅ Paid',
    pending: 'Awaiting Payment',
    expired: 'Expired'
  }[invoice.status]

  const statusClass = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    expired: 'bg-gray-100 text-gray-600'
  }[invoice.status]

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{invoice.label}</CardTitle>
          <Badge className={`w-fit mt-1 ${statusClass}`}>{statusLabel}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-4xl font-bold">
            {Number(invoice.amount_usdc).toFixed(2)}{' '}
            <span className="text-lg font-normal text-muted-foreground">USDC</span>
          </p>
          {invoice.description && (
            <p className="text-sm text-muted-foreground">{invoice.description}</p>
          )}
          {invoice.due_date && (
            <p className="text-xs text-muted-foreground">
              Due: {new Date(invoice.due_date).toLocaleDateString()}
            </p>
          )}
          <Button disabled>
            Pay Now {/* enabled in Stage 3 */}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}