import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Basebill</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Link href="/create">
            <Button>Create Invoice</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">View Dashboard</Button>
          </Link>
          <Badge variant="outline">Awaiting Payment</Badge>
        </CardContent>
      </Card>
    </main>
  )
}
