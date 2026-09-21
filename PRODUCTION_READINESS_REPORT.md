# Diva Heels — Production Readiness Remediation

## Scope

This branch was created from `origin/main` at base commit `a453b1711fb0350b0c865529d9cddb2744f6632e`. No secrets were printed, decrypted, rotated, or modified. No DNS change, webhook registration, Revolut API payment call, deployment, or merge to `main` was performed.

## Implemented changes

The remediation adds a fail-closed Revolut Hosted Checkout path. The checkout API requires a validated `Idempotency-Key`, persists the key, validates all product prices and sizes server-side against Supabase, generates a cryptographically random public access token, stores only its SHA-256 hash, creates a server-generated confirmation redirect URL, requires a returned `checkout_url`, persists the Revolut order and checkout URL, and returns the hosted checkout URL to the browser. Failed Revolut order creation marks the local order as cancelled/failed and returns a non-success response.

The webhook endpoint verifies `v1.timestamp.raw-payload` HMAC signatures with timestamp-age validation and supports multiple comma-separated signatures. It stores every event in `payment_events`, uses the unique event ID for deduplication, handles authorised, completed, retryable payment failures, failed/cancelled, and refunded events, and protects terminal `paid` and `refunded` states from later downgrade. `ORDER_REFUNDED` preserves the `paid → refunded` transition.

Confirmation pages now require the public token, use the stored token hash, are marked `noindex`, mask customer email, and retrieve the Revolut order server-side before showing a paid state. Homepage, shop, and product detail routes use Supabase active products as their catalog source. Buy Now adds the selected size and quantity before navigating to checkout. Checkout and contact endpoints have bounded in-memory rate limiting; contact continues to return an honest 503 while no mail provider is configured.

## Database

The connected Supabase project was checked read-only before the additive migration. The required existing fields and indexes were confirmed. The additive migration `supabase/migrations/20260921170000_production_payment_contract.sql` was applied successfully and adds only `orders.revolut_checkout_url` and `orders.payment_failure_reason` with `IF NOT EXISTS`. The previously verified remediation migration is also included in the branch for reproducible schema history.

Final schema verification confirmed:

| Contract | Result |
|---|---|
| `orders.idempotency_key` | `text NOT NULL` |
| `orders.public_access_token_hash` | `text`, indexed |
| `orders.revolut_checkout_url` | `text` |
| `orders.payment_failure_reason` | `text` |
| `orders.revolut_order_id` | `text`, partial unique index |
| `payment_events.revolut_event_id` | `text NOT NULL`, unique index |
| payment status index | Present |
| RLS on payment events | Enabled |

Final row counts were `products=0`, `orders=0`, `order_items=0`, and `payment_events=0`. No rows were deleted and no demo products were inserted.

## Validation

The following checks passed:

- `pnpm install --frozen-lockfile`
- `pnpm exec tsc --noEmit`
- `NODE_ENV=production pnpm run build`
- `git diff --check`
- Static evidence for hosted `checkoutUrl` redirect
- Static evidence for required `Idempotency-Key`
- Static evidence for webhook failure/refund handling and event deduplication
- Static secret scan of the diff
- Safe local production smoke test: `/about` returned HTTP 200; missing checkout idempotency returned HTTP 400; invalid contact payload returned HTTP 400

No Revolut sandbox or production credentials were used in smoke tests.

## Blockers before production

1. The expected source branch and commit from the initial launch brief (`codex/production-readiness-remediation`, `4e0e5e7`) did not exist. This branch was created from the actual latest `origin/main` instead.
2. Vercel production environment inspection showed `REVOLUT_MERCHANT_SECRET_KEY` present but empty, `REVOLUT_WEBHOOK_SIGNING_SECRET` missing, and `REVOLUT_MERCHANT_PUBLIC_KEY` empty. The exact production site URL environment variable required for redirect generation was not configured in the inspected environment.
3. The Supabase production catalog currently contains zero products. The application correctly does not invent or seed products, but checkout cannot be meaningfully tested until authorized catalog data exists.
4. The requested full BG/EN content localization is not complete in this remediation branch; the existing static legal/content copy remains primarily Bulgarian. This must be completed before claiming the localization requirement is satisfied.
5. README states that merges to `main` automatically deploy. Because production credentials and the exact production redirect domain are not ready, pushing this branch to `main` would be unsafe and was not done.

## Final status

- `PRODUCTION_DEPLOY`: not performed
- `REAL_PAYMENT`: not performed
- `WEBHOOK`: not registered
- `RETRIEVE_ORDER`: implemented, not called against Revolut
- `IDEMPOTENCY`: implemented and statically verified
- `DATABASE`: additive migration applied and schema verified
- `REFUND`: lifecycle implemented and statically verified
- `BUILD`: passed
- `MERGE`: not performed
- `FINAL_MAIN_SHA`: `a453b1711fb0350b0c865529d9cddb2744f6632e`
- `BLOCKERS`: production Revolut secrets/domain, empty catalog, incomplete BG/EN copy, and automatic production deployment on `main`
