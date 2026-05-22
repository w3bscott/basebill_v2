'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Invoice } from '@/types/invoice'

const PLACEHOLDER_WALLET = '0xPLACEHOLDER' // replaced with wagmi address in Stage 3

const statusClass: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-gray-100 text-gray-600'
}

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/invoices/wallet/${PLACEHOLDER_WALLET}`)
      .then(r => r.json())
      .then(d => setInvoices(d.invoices ?? []))
      .finally(() => setLoading(false))
  }, [])

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/pay/${id}`)
    toast.success('Link copied!')
  }

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Invoices</h1>
        <Link href="/create">
          <Button>+ New Invoice</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No invoices yet.{' '}
            <Link href="/create" className="underline">Create one.</Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {invoices.map(inv => (
            <Card key={inv.id}>
              <CardContent className="flex items-center justify-between pt-4 pb-4">
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{inv.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {Number(inv.amount_usdc).toFixed(2)} USDC · {new Date(inv.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusClass[inv.status]}>{inv.status}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => copyLink(inv.id)}>
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}