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