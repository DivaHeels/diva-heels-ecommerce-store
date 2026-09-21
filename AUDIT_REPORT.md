# Diva Heels — Vercel / Supabase / Revolut Audit

**Repository:** `DivaHeels/diva-heels-ecommerce-store`  
**Branch audited:** `v0/revolut-checkout-audit`  
**Audited commit:** `23accfd`  
**Vercel project:** `diva`  
**Preview checked:** `https://diva-2yg2i4j8f-didothewhite-8941s-projects.vercel.app`

## Executive decision

**Do not merge or enable production payments yet.** The storefront is visually coherent and the main routes render, but production readiness is blocked by missing Revolut production configuration, an unconfigured contact delivery service, incomplete English localization, and a catalog source-of-truth mismatch. The deterministic code defects found during the audit were fixed on the audit branch; payment activation still requires merchant-side configuration and sandbox verification.

## What was verified

The deployed preview was opened on `/`, `/shop`, `/product/diva-heels-signature`, `/checkout`, and `/contact`. The routes rendered without a visible runtime error, the market selector exposed BG/EU/UK options, and the product detail interaction exposed size and quantity controls. The empty-checkout state was also verified.

The repository was checked against the current Revolut Merchant API documentation. The documented API version is `2026-08-17`; webhook signing uses `v1.{timestamp}.{raw-payload}` with a millisecond timestamp, and the signature header may contain multiple comma-separated `v1=` signatures. The audited branch now follows those rules.

The Vercel project metadata reported a `READY` latest deployment, no password protection, and SSO protection for non-custom domains. Environment variable names were inspected without decrypting values. No secret values are included in this report.

## Fixed in the audit branch

| Finding | Severity | Resolution |
|---|---:|---|
| `next.config.mjs` ignored TypeScript errors | P0 | Removed `ignoreBuildErrors`; production builds must fail on type regressions. |
| Checkout API had 8 TypeScript errors and unsafe `any` indexing | P0 | Added typed market/product/request handling and validated the server-side product snapshot before order creation. |
| Cart drawer referenced an out-of-scope `market` variable | P1 | Wired the active market into the drawer and total formatter. |
| Cart and product views displayed hardcoded EUR prices | P1 | Connected displayed prices to the selected market formatter. UK products without a GBP price are shown as unavailable instead of silently mispriced. |
| Revolut webhook signing omitted the `v1.` version prefix and assumed seconds | P0 | Implemented the documented `v1.timestamp.raw` HMAC input, millisecond timestamp validation, and multiple-signature rotation support. |
| Revolut order creation used a stale API version and legacy reference field | P1 | Updated to API version `2026-08-17` and sends `merchant_order_data.reference`. |
| Public order confirmation exposed the full customer email | P1 | Masked the email in the public confirmation view. |
| Local production build failed when `NODE_ENV=development` was inherited | P1 | Confirmed clean `NODE_ENV=production pnpm run build`; the development-mode failure is retained as a visible environment/configuration warning rather than hidden. |
| Next global error prerender path was fragile | P1 | Added an explicit accessible `app/global-error.tsx` fallback. |

## Remaining blockers

### Production payment configuration is incomplete

The Vercel project has the Supabase integration variables across production, preview, and development, but the Revolut public and secret key entries inspected for production have no configured value, and no `REVOLUT_WEBHOOK_SIGNING_SECRET` variable was present in the inspected environment list. The payment API therefore cannot be treated as production-ready. Configure sandbox keys first, register the webhook endpoint, verify signed events, then configure production keys and rotate/verify the webhook secret.

### Contact form is intentionally non-functional

`POST /api/contact` validates input and returns HTTP 503 with an explicit “email service is not configured” response. This is honest behavior for the current state, but it is not a usable production contact form. Connect an approved transactional email provider or an existing project mail integration before launch.

### English localization is incomplete

The market model declares English for EU and UK, but the actual storefront copy, form labels, footer, legal pages, and document language remain Bulgarian (`<html lang="bg">`). The selector changes market/currency state, not language. This fails the stated BG/EN requirement and should be resolved with an explicit locale strategy before marketing to EU/UK customers.

### Catalog is not using a single source of truth

The checkout API validates against Supabase products and prices, while the storefront and cart use the static `lib/products.ts` fallback dataset. This can produce a product/price mismatch between what the customer sees and what the server accepts. Move storefront reads to the same Supabase-backed model, or explicitly document and enforce a single synchronized catalog source.

### Checkout UX still has incomplete payment behavior

The product “Купи сега” control has no handler. The checkout route creates a local order even when Revolut is unavailable and then shows an activation message rather than a payment redirect. This is acceptable for a scaffold, but it must be replaced by a tested hosted checkout/SDK flow before accepting real orders. Add idempotency protection and a clear failed-payment path as part of the final payment implementation.

## Validation results

- `pnpm install --frozen-lockfile`: passed.
- `pnpm exec tsc --noEmit`: passed after fixes.
- `NODE_ENV=production pnpm run build`: passed; 16 routes generated.
- `git diff --check`: passed.
- Browser route smoke checks on preview: passed for the routes listed above.
- Live payment transaction: **not attempted**; production credentials are incomplete and no purchase was authorized.

## Merge recommendation

Keep the audit branch for review. Merge the code fixes only after the remaining blockers are addressed, especially the Revolut sandbox flow and webhook verification. Do not enable live capture or advertise EU/UK availability until the catalog, localization, contact delivery, and production environment checklist are complete.

## References

- [Revolut webhook signature verification](https://developer.revolut.com/docs/guides/merchant/monitor-and-observe/webhooks/verify-the-payload-signature)
- [Revolut Merchant API](https://developer.revolut.com/docs/api/merchant)
- [Revolut hosted checkout API](https://developer.revolut.com/docs/guides/merchant/accept-payments/online-payments/hosted-checkout-page/api)
