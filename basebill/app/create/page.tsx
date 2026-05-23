'use client'

import Link from 'next/link'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Invoice } from '@/types/invoice'

const WALLET_STORAGE_KEY = 'basebill:creator-wallet'

function getStoredWallet() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(WALLET_STORAGE_KEY) ?? ''
}

export default function CreatePage() {
  const [form, setForm] = useState(() => ({
    creator_wallet: getStoredWallet(),
    label: '',
    amount_usdc: '',
    description: '',
    due_date: '',
    forward_to: ''
  }))
  const [loading, setLoading] = useState(false)
  const [invoice, setInvoice] = useState<Invoice | null>(null)

  const sharePath = invoice ? `/pay/${invoice.id}` : ''
  const shareUrl = invoice ? `${window.location.origin}${sharePath}` : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount_usdc: Number(form.amount_usdc),
          creator_wallet: form.creator_wallet.trim()
        })
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? 'Unable to create invoice.')
        return
      }

      window.localStorage.setItem(WALLET_STORAGE_KEY, form.creator_wallet.trim())
      setInvoice(json.invoice)
      await navigator.clipboard.writeText(`${window.location.origin}/pay/${json.invoice.id}`)
      toast.success('Invoice created! Link copied.')
    } catch {
      toast.error('Something went wrong while creating the invoice.')
    } finally {
      setLoading(false)
    }
  }

  if (invoice) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Invoice Created</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm break-all text-muted-foreground">{shareUrl}</p>
            <Link href={sharePath}>
              <Button>Open Payment Page</Button>
            </Link>
            <Button
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl)
                toast.success('Link copied!')
              }}
            >
              Copy Link
            </Button>
            <div className="flex justify-center pt-2">
              <QRCodeSVG value={shareUrl} size={180} />
            </div>
            <Button variant="ghost" onClick={() => setInvoice(null)}>
              Create another
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>New Invoice</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="creator-wallet">Creator Wallet *</Label>
              <Input
                id="creator-wallet"
                required
                placeholder="0x..."
                value={form.creator_wallet}
                onChange={e => setForm(f => ({ ...f, creator_wallet: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="label">Invoice Label *</Label>
              <Input
                id="label"
                required
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="amount">Amount (USDC) *</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.amount_usdc}
                onChange={e => setForm(f => ({ ...f, amount_usdc: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="due">Due Date</Label>
              <Input
                id="due"
                type="date"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="fwd">Treasury Forward Address</Label>
              <Input
                id="fwd"
                placeholder="0x..."
                value={form.forward_to}
                onChange={e => setForm(f => ({ ...f, forward_to: e.target.value }))}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
