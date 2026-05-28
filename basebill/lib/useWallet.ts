'use client'

import { useCallback, useEffect, useState } from 'react'

type EthereumRequest = {
  method: string
  params?: unknown[] | Record<string, unknown>
}

type EthereumProvider = {
  request: (request: EthereumRequest) => Promise<unknown>
  on?: (event: 'accountsChanged', listener: (accounts: string[]) => void) => void
  removeListener?: (
    event: 'accountsChanged',
    listener: (accounts: string[]) => void
  ) => void
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

const WALLET_CHANGED_EVENT = 'basebill:wallet-changed'

function getEthereum() {
  if (typeof window === 'undefined') return undefined
  return window.ethereum
}

function emitWalletChanged(address: string) {
  window.dispatchEvent(
    new CustomEvent(WALLET_CHANGED_EVENT, {
      detail: { address }
    })
  )
}

export function useWallet() {
  const [address, setAddress] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    const ethereum = getEthereum()
    if (!ethereum) return

    let active = true
    const provider = ethereum

    async function loadAccounts() {
      const accounts = await provider.request({
        method: 'eth_accounts'
      })

      if (active && Array.isArray(accounts)) {
        setAddress(String(accounts[0] ?? '').toLowerCase())
      }
    }

    function handleAccountsChanged(accounts: string[]) {
      setAddress(String(accounts[0] ?? '').toLowerCase())
    }

    function handleWalletChanged(event: Event) {
      const detail = (event as CustomEvent<{ address?: string }>).detail
      setAddress(String(detail?.address ?? '').toLowerCase())
    }

    void loadAccounts()
    provider.on?.('accountsChanged', handleAccountsChanged)
    window.addEventListener(WALLET_CHANGED_EVENT, handleWalletChanged)

    return () => {
      active = false
      provider.removeListener?.('accountsChanged', handleAccountsChanged)
      window.removeEventListener(WALLET_CHANGED_EVENT, handleWalletChanged)
    }
  }, [])

  const connect = useCallback(async () => {
    const ethereum = getEthereum()
    if (!ethereum) {
      throw new Error('No injected wallet found.')
    }

    setIsConnecting(true)

    try {
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      })
      const nextAddress = Array.isArray(accounts)
        ? String(accounts[0] ?? '').toLowerCase()
        : ''

      setAddress(nextAddress)
      emitWalletChanged(nextAddress)
      return nextAddress
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress('')
    emitWalletChanged('')
  }, [])

  return {
    address,
    connect,
    disconnect,
    isConnected: Boolean(address),
    isConnecting
  }
}
