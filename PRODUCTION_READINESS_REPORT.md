# Diva Heels — Production Readiness and Catalog Remediation

## Scope

This branch was created from `origin/main` at base commit `a453b1711fb0350b0c865529d9cddb2744f6632e`. No secrets were printed, decrypted, rotated, or modified. No DNS change, webhook registration, Revolut API payment call, deployment, or merge to `main` was performed.

## Active catalog

The production catalog now contains exactly three active products. The previously imported yellow and red records were not deleted; they were set to `active=false` and are therefore not shown or accepted by checkout.

| Product | Slug | EUR | GBP | Sizes | Stock | Color | Material | Image assets | Source basis |
|---|---|---:|---|---|---:|---|---|---|---|
| Diva Heels Atelier | `diva-heels-atelier` | 9800 minor units | `NULL` | 36–41 | 10 | black | genuine leather | `/diva-heels-product.png`, `/diva-heels-hero.png` | User-approved current black project assets and product configuration |
| Diva Heels Noir | `diva-heels-noir` | 9800 minor units | `NULL` | 36–41 | 10 | black | genuine leather | `/diva-heels-product.png`, `/diva-heels-hero.png` | User-approved current black project assets and product configuration |
| Diva Heels Signature | `diva-heels-signature` | 9800 minor units | `NULL` | 36–41 | 10 | black | genuine leather | `/diva-heels-product.png`, `/diva-heels-hero.png` | User-approved current black project assets and product configuration |

The old yellow and red records remain in the database only as inactive historical rows. The reproducible seed is [`supabase/seed.sql`](./supabase/seed.sql); it uses slug-based upserts, sets the three active products to stock 10, deactivates the old two records, and never deletes unrelated data.

## Implemented payment and catalog changes

The remediation adds a fail-closed Revolut Hosted Checkout path. The checkout API requires a validated `Idempotency-Key`, persists the key, validates all product prices, sizes, and stock server-side against Supabase, generates a cryptographically random public access token, stores only its SHA-256 hash, creates a server-generated confirmation redirect URL, requires a returned `checkout_url`, persists the Revolut order and checkout URL, and returns the hosted checkout URL to the browser. Failed Revolut order creation marks the local order as cancelled/failed and returns a non-success response.

The webhook endpoint verifies `v1.timestamp.raw-payload` HMAC signatures with timestamp-age validation and supports multiple comma-separated signatures. It stores every event in `payment_events`, uses the unique event ID for deduplication, handles authorised, completed, retryable payment failures, failed/cancelled, and refunded events, and protects terminal `paid` and `refunded` states from later downgrade. `ORDER_REFUNDED` preserves the `paid → refunded` transition.

Confirmation pages require the public token, use the stored token hash, are marked `noindex`, mask customer email, and retrieve the Revolut order server-side before showing a paid state. Homepage, shop, and product detail routes use Supabase active products as their catalog source. Buy Now adds the selected size and quantity before navigating to checkout. Checkout and contact endpoints have bounded in-memory rate limiting; contact continues to return an honest 503 while no mail provider is configured.

## Database verification

The additive migration `supabase/migrations/20260921170000_production_payment_contract.sql` was applied successfully and adds only `orders.revolut_checkout_url` and `orders.payment_failure_reason` with `IF NOT EXISTS`. The previously verified remediation migration is included for reproducible schema history.

Final contract verification confirmed `orders.idempotency_key` as `text NOT NULL`, indexed `orders.public_access_token_hash`, `orders.revolut_checkout_url`, `orders.payment_failure_reason`, partial uniqueness for `orders.revolut_order_id`, unique `payment_events.revolut_event_id`, the payment-status index, and RLS on payment event data.

The final Supabase catalog summary is:

```text
active_products=3
active_slugs=[diva-heels-atelier, diva-heels-noir, diva-heels-signature]
stock_total=30
```

The old yellow and red rows are present but inactive. No rows were deleted and no demo products were added.

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
- Asset existence checks for the black product images

The build passed after catalog changes. Dynamic production storefront smoke testing requires a deployment/runtime with the encrypted Supabase environment configured; no credentials were exposed or copied locally.

## Sources and product data

The original storefront source was inspected at:

- [Diva Heels storefront](https://divaheels.online)
- [Existing product page](https://divaheels.online/products/divaheels-%D0%BE%D0%B1%D1%83%D0%B2%D0%BA%D0%B8-%D1%81-%D0%B2%D0%B8%D1%81%D0%BE%D0%BA-%D1%82%D0%BE%D0%BA)
- [Second existing product page](https://divaheels.online/products/%D0%BD%D0%BE%D0%B2%D0%B8-%D0%B4%D0%B0%D0%BC%D1%81%D0%BA%D0%B8-%D0%BE%D0%B1%D1%83%D0%B2%D0%BA%D0%B8-%D1%81-%D0%B2%D0%B8%D1%81%D0%BE%D0%BA-%D1%82%D0%BE%D0%BA-14-%D1%81%D0%BC)

Those two source-store records were intentionally left inactive after the user clarified that only Atelier, Noir, and Signature should be sold. The active product names, black color, genuine-leather material, price, sizes, and stock are the user-approved launch configuration; no yellow/red product data is used in the active storefront.

## Remaining blockers

1. Production Revolut credentials and exact production site URL remain a separate deployment configuration matter; they were not touched.
2. The current production-capable Vercel deployment was not changed by this catalog task. The branch must be deployed through the approved PR/release process before browser testing against the new catalog.
3. UK remains unavailable for these products because `price_gbp_minor` is intentionally `NULL`; no automatic FX conversion is used.

## Final status

- `CATALOG`: 3 active products, 30 total stock units
- `SUPABASE_SOURCE_OF_TRUTH`: PASS
- `REPRODUCIBLE_SEED`: PASS
- `OLD_YELLOW_RED_ACTIVE`: NO
- `STATIC_PLACEHOLDER_CATALOG_IN_PRODUCTION_PATH`: NO
- `TYPESCRIPT`: PASS
- `PRODUCTION_BUILD`: PASS
- `GIT_DIFF_CHECK`: PASS
- `PRODUCTION_DEPLOY`: not performed
- `REAL_PAYMENT`: not performed
- `WEBHOOK`: not registered
- `MERGE`: not performed
- `COMMIT_PENDING`: catalog changes are ready for commit and push
