import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, metaMask } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    coinbaseWallet({ appName: 'InvoiceLink' }),
    metaMask()
  ],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http()
  }
})