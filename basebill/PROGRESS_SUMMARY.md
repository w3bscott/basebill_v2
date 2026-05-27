Stage 1 — Scaffold + UI
Complete
Next.js 15, TypeScript, Tailwind CSS
shadcn/ui initialised — default style, slate base
Components added: button, input, card, badge, label, separator, skeleton, sonner
Four page shells: /, /dashboard, /create, /pay/[id]
Smoke test passed — shadcn Card + Button render correctly


Stage 2 — Supabase + Invoice CRUD
In progress
lib/supabase.ts + types/invoice.ts
API routes: POST /invoices, GET /invoices/[id], PATCH /invoices/[id], GET /invoices/wallet/[address]
Create page: form → POST → QR code + shareable link
Pay page: fetch invoice by ID, status states
Dashboard: list invoices by wallet, status badges
Fix applied: API rejects '0xPLACEHOLDER' as creator_wallet
Fix applied: amount_usdc normalised to Number() before insert
Fix applied: RLS verified enabled in Supabase (3 policies)
Deferred to Stage 3: real wallet address replaces PLACEHOLDER_WALLET
Deferred to Stage 3: wallet-based dashboard fetch


What was fixed - from stage 2: 'claude feature update' commit
Vercel Build Failure ("npm run build" exited with 1): The project is using Next.js 15+ (specifically 16.2.6), which introduces a breaking change where params in Route Handlers and Client/Server Pages are now Promises. The build was failing the TypeScript checks because it was trying to read properties from params synchronously without unwrapping them.

I updated app/api/invoices/[id]/route.ts and app/api/invoices/wallet/[address]/route.ts to await params.
I updated the client component app/pay/[id]/page.tsx to unwrap the params using React.use(params).
Create CTA Triggering No Action locally: In app/create/page.tsx, the form was submitting a placeholder wallet (0xPLACEHOLDER) as the creator_wallet. However, the API route app/api/invoices/route.ts had a strict validation check preventing 0xPLACEHOLDER from being used, which resulted in a 400 Bad Request error. Because of this, the process stopped and the frontend threw an error toast silently (or it appeared to do nothing).

I relaxed the validation in app/api/invoices/route.ts so that it accepts the placeholder wallet for now, allowing you to successfully create and test invoices locally before the actual Web3 wallet integration (Wagmi) is fully implemented in Stage 3.


Stage 2b — UI Theming & Navigation (this session — 23 May 2026)

Custom shadcn Theme Applied:
- Replaced the default oklch slate theme in app/globals.css with a custom theme.
- Primary color: #0000FF (vibrant blue), used across buttons, accents, links, rings, charts.
- Font: Geist (loaded via Google Fonts @import).
- Full light + dark mode variable sets defined in :root and .dark.
- Radius: 10px base with calculated sm/md/lg/xl variants.
- Custom shadow scale defined (sm through 2xl).

CSS Plugin Fix:
- The custom theme used @plugin "tailwindcss-animate" which failed to resolve under Turbopack.
- Root cause: Turbopack resolves @plugin relative to the app/ directory, not node_modules/.
- Fix: Replaced with @import "tw-animate-css" (the package already installed from Stage 1 scaffold).
- The tailwindcss-animate npm package was also installed but is unused; tw-animate-css is the working one.

Navigation Bar Added:
- Created components/NavigationBar.tsx — fixed top nav with glassmorphism (bg-background/80 backdrop-blur-md).
- Logo: ReceiptText icon in a primary-colored rounded-lg box + "BaseBill" wordmark.
- Desktop links: Dashboard, Invoices — rendered using shadcn buttonVariants for uniform sizing/radius.
- "Create Invoice" CTA button in primary color using buttonVariants.
- Active page state highlighted via pathname matching (secondary variant vs ghost).
- Mobile: hamburger menu with dropdown containing all links.
- All styling uses standard shadcn tokens — no hardcoded colors or arbitrary border-radius values.

Wallet Button Placeholder:
- Created components/WalletButton.tsx — placeholder shadcn Button showing "Connect Wallet".
- Will be replaced by wagmi useAccount + OnchainKit ConnectWallet in Stage 3.

Dark Mode Toggle:
- Created components/ThemeProvider.tsx — wraps next-themes ThemeProvider.
- Created components/ThemeToggle.tsx — shadcn ghost Button with animated Sun/Moon icons.
- Added ThemeProvider to app/layout.tsx wrapping all children, attribute="class", defaultTheme="system".
- Added suppressHydrationWarning to <html> tag.
- ThemeToggle placed in NavigationBar (desktop + mobile).
- Known issue: toggle button may not be visible — needs dev server restart to pick up changes.

Layout Changes:
- app/layout.tsx updated: NavigationBar rendered globally, body content wrapped in pt-16 div.
- Metadata updated to title="BaseBill", description="Pay any invoice on Base with crypto".

Files Created This Session:
- components/NavigationBar.tsx
- components/WalletButton.tsx
- components/ThemeProvider.tsx
- components/ThemeToggle.tsx

Files Modified This Session:
- app/globals.css (full theme replacement)
- app/layout.tsx (added NavigationBar, ThemeProvider, pt-16 wrapper, suppressHydrationWarning)

Next Steps:
- Verify ThemeToggle renders after dev server restart.
- Stage 3: Install wagmi, viem, @coinbase/onchainkit, @tanstack/react-query.
- Stage 3: Create lib/wagmi.ts, providers/Web3Provider.tsx, replace WalletButton with real wallet connect.
- Stage 3: Wire create/dashboard/pay pages to use connected wallet address instead of placeholder.


Stage 3 - Wallet Payments + Startup Stabilization (26 May 2026)

Status:
- In progress, with the main local startup blocker resolved.
- Invoice create/dashboard routes now use a real connected wallet address instead of the old placeholder/manual wallet flow.
- Payment route now has a functional wallet-payment path using injected wallet RPC calls.

Packages / Web3 Setup:
- Installed wallet/payment dependencies:
  - wagmi
  - viem
  - @coinbase/onchainkit
  - @tanstack/react-query
- Added initial Web3 setup files:
  - lib/wagmi.ts
  - providers/Web3Provider.tsx
- Important implementation note: wagmi/OnchainKit are currently not in the startup-critical render path because importing them directly into the active app routes caused dev-server compile hangs on this Windows/Turbopack setup.

Wallet Connection:
- Created components/ConnectButton.tsx.
- Created lib/useWallet.ts as a lightweight injected-wallet helper built on window.ethereum.
- ConnectButton now:
  - requests wallet accounts with eth_requestAccounts
  - reads existing accounts with eth_accounts
  - tracks account changes with accountsChanged
  - displays shortened connected wallet addresses
  - supports clearing local connected state

Create Invoice:
- app/create/page.tsx now uses the connected wallet address as creator_wallet.
- Removed the active placeholder/manual wallet field from the current functional UI.
- Create submission now blocks until a wallet is connected.
- Existing commented preferred UI block was preserved.

Dashboard:
- app/dashboard/page.tsx now loads invoices for the connected wallet address.
- Dashboard shows ConnectButton and only reveals the New Invoice CTA once connected.
- Fetching uses the lowercase connected wallet address.
- Existing commented preferred UI block was preserved.

Pay Flow:
- app/pay/[id]/page.tsx was changed into a small server wrapper that unwraps async params and passes a plain id string down.
- Payment UI and logic moved to components/PayClient.tsx.
- This split fixed the dev-server hang that occurred when the client payment component lived inside app/pay/[id].
- PayClient:
  - fetches invoice details by id
  - shows loading/not-found/status states
  - validates expiry
  - validates recipient wallet address
  - pays creator_wallet by default, or forward_to when present
  - switches wallet to Base Sepolia using wallet_switchEthereumChain
  - falls back to wallet_addEthereumChain if Base Sepolia is missing in the wallet
  - sends USDC transfer through eth_sendTransaction
  - encodes ERC-20 transfer calldata using viem encodeFunctionData + parseUnits
  - estimates gas via eth_estimateGas, applies a buffer, and caps to avoid "exceeds max transaction gas limit"
  - writes tx_hash to Supabase immediately after submission
  - waits for the transaction receipt and only marks invoice paid on success
  - does not mark paid on revert/timeout (shows a pending confirmation message instead)

USDC / Chain Details:
- Base Sepolia chain id: 0x14a34
- Base Sepolia USDC address used:
  - 0x036CbD53842c5426634e7929541eC2318f3dCF7e

Startup / Build Fixes:
- Root layout no longer wraps the entire app in Web3Provider.
- External Google font loading was removed from app/layout.tsx and app/globals.css because it caused dev-time font fetch timeouts in this environment.
- app/globals.css now uses system fonts:
  - Arial, Helvetica, sans-serif
- next.config.ts now sets turbopack.root to the project directory to avoid workspace-root confusion from parent lockfiles.
- .gitignore now ignores generated next-dev*.log and next-start*.log files.
- Removed the direct active use of @coinbase/onchainkit/wallet from app routes because it caused route compilation to hang.

Verification:
- npm run lint passes.
- npm run build passes.
- Dev server starts on http://localhost:3000.
- Local route checks passed:
  - / returns 200
  - /create returns 200
  - /dashboard returns 200
  - /pay/test-id returns 200

Known Tradeoffs / Follow-up:
- wagmi/OnchainKit files and dependencies remain installed, but the app currently uses the lightweight injected-wallet helper for stability.
- The current payment flow assumes an injected wallet like MetaMask/Coinbase Wallet browser extension.
- wallet_switchEthereumChain may fail if the wallet does not already know Base Sepolia; add wallet_addEthereumChain fallback later.
- Direct ERC-20 calldata encoding works, but replacing it with viem once the dev-server issue is fully understood would be cleaner.
- Pay flow should be tested end-to-end with real Base Sepolia USDC before marking Stage 3 complete.

Stage 3b - Dev Server Hang Fix & Wagmi Re-integration (26 May 2026)

Status:
- Complete

Root Cause Analysis:
- The app hung on startup when importing wagmi/OnchainKit because Next.js 16 uses Turbopack by default for the dev server.
- Turbopack on the slow Windows filesystem struggled to resolve the massive dependency graph of `wagmi` and its connectors in a reasonable time, causing the server to permanently hang without throwing an error.

Fixes Applied:
- Disabled Turbopack by switching the dev script in `package.json` to `next dev --webpack`.
- Removed the now-unnecessary `turbopack` configuration block from `next.config.ts`.
- Re-integrated `<Web3Provider>` back into `app/layout.tsx`. It now successfully wraps the entire application.
- Verified that Webpack successfully compiles the large wagmi dependency tree and serves the application routes without hanging.

Next Steps:
- The application is now fully unblocked to use `wagmi` hooks (`useAccount`, `useConnect`, `useDisconnect`) and OnchainKit UI components natively across all routes.
- Optional: Migrate the custom `lib/useWallet.ts` to `wagmi`'s standard hooks.

Turbopack dev server hang and the steps taken to fix it.

You're now fully set up to proceed using wagmi and OnchainKit without the compilation hangs!
--but not migrated at this stage
