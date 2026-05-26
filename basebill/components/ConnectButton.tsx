'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/lib/useWallet'

export default function ConnectButton() {
  const {
    address,
    connect,
    disconnect,
    isConnected,
    isConnecting
  } = useWallet()

  async function handleClick() {
    if (isConnected) {
      disconnect()
      return
    }

    try {
      await connect()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to connect wallet.'
      )
    }
  }

  return (
    <Button
      type="button"
      variant={isConnected ? 'outline' : 'secondary'}
      onClick={handleClick}
      disabled={isConnecting}
    >
      {isConnected && address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : isConnecting
          ? 'Connecting...'
          : 'Connect Wallet'}
    </Button>
  )
}
