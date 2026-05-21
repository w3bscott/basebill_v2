import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>InvoiceLink</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button>Create Invoice</Button>
          <Badge variant="outline">Awaiting Payment</Badge>
        </CardContent>
      </Card>
    </main>
  )
}