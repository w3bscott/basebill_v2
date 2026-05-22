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