export type InvoiceStatus = 'pending' | 'paid' | 'expired'

export type Invoice = {
  id: string
  creator_wallet: string
  label: string
  amount_usdc: number
  description?: string
  due_date?: string
  status: InvoiceStatus
  tx_hash?: string
  forward_to?: string
  created_at: string
}