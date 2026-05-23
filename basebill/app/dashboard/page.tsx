'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import type { Invoice } from '@/types/invoice'

const WALLET_STORAGE_KEY = 'basebill:creator-wallet'

function getStoredWallet() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(WALLET_STORAGE_KEY) ?? ''
}

const statusClass: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-gray-100 text-gray-600'
}

export default function DashboardPage() {
  const [storedWallet] = useState(getStoredWallet)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [wallet, setWallet] = useState(storedWallet)
  const [loading, setLoading] = useState(Boolean(storedWallet))

  useEffect(() => {
    if (storedWallet) {
      void fetchInvoices(storedWallet)
    }
  }, [storedWallet])

  async function fetchInvoices(address: string) {
    setLoading(true)

    try {
      const response = await fetch(`/api/invoices/wallet/${encodeURIComponent(address)}`)
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error ?? 'Unable to load invoices.')
        setInvoices([])
        return
      }

      setInvoices(data.invoices ?? [])
    } catch {
      toast.error('Unable to load invoices.')
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  async function handleWalletSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedWallet = wallet.trim()
    if (!trimmedWallet) {
      toast.error('Enter a wallet address to view invoices.')
      return
    }

    window.localStorage.setItem(WALLET_STORAGE_KEY, trimmedWallet)
    await fetchInvoices(trimmedWallet)
  }

  function copyLink(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/pay/${id}`)
    toast.success('Link copied!')
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Invoices</h1>
        <Link href="/create">
          <Button>+ New Invoice</Button>
        </Link>
      </div>

      {!wallet && !loading ? (
        <Card>
          <CardHeader>
            <CardTitle>Load your invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWalletSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="wallet">Creator Wallet</Label>
                <Input
                  id="wallet"
                  placeholder="0x..."
                  value={wallet}
                  onChange={e => setWallet(e.target.value)}
                />
              </div>
              <Button type="submit">View Invoices</Button>
            </form>
          </CardContent>
        </Card>
      ) : loading ? (
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
              <CardContent className="flex items-center justify-between pb-4 pt-4">
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{inv.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {Number(inv.amount_usdc).toFixed(2)} USDC - {new Date(inv.created_at).toLocaleDateString()}
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
