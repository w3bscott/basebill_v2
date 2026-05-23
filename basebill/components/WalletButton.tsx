'use client'

import { Button } from '@/components/ui/button'

interface WalletButtonProps {
  isConnected?: boolean;
  address?: string;
  onClick?: () => void;
  className?: string;
}

export function WalletButton({ isConnected, address, onClick, className }: WalletButtonProps) {
  // This is a placeholder for Stage 3 Wagmi ConnectButton
  return (
    <Button 
      variant={isConnected ? "outline" : "secondary"} 
      onClick={onClick}
      className={className}
    >
      {isConnected && address 
        ? `${address.slice(0, 6)}...${address.slice(-4)}` 
        : 'Connect Wallet'}
    </Button>
  )
}
