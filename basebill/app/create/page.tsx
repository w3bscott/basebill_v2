'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Invoice } from '@/types/invoice'

const PLACEHOLDER_WALLET = '0xPLACEHOLDER' // replaced with wagmi address in Stage 3

export default function CreatePage() {
  const [form, setForm] = useState({
    label: '',
    amount_usdc: '',
    description: '',
    due_date: '',
    forward_to: ''
  })
  const [loading, setLoading] = useState(false)
  const [invoice, setInvoice] = useState<Invoice | null>(null)

  const shareUrl = invoice
    ? `${window.location.origin}/pay/${invoice.id}`
    : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount_usdc: Number(form.amount_usdc),
        creator_wallet: PLACEHOLDER_WALLET
      })
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) { toast.error(json.error); return }

    setInvoice(json.invoice)
    navigator.clipboard.writeText(`${window.location.origin}/pay/${json.invoice.id}`)
    toast.success('Invoice created! Link copied.')
  }

  if (invoice) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Invoice Created</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground break-all">{shareUrl}</p>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl)
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