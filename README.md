# diva-heels-ecommerce-store

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_wNIrx1oqAD4bjbLPObWvTLD6x7JN)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

## Production readiness remediation

The current production-readiness work is documented in [`PRODUCTION_READINESS_REPORT.md`](./PRODUCTION_READINESS_REPORT.md). It does not commit secrets, register Revolut webhooks, change DNS, deploy to production, or execute payments.

### Database migrations

Apply migrations only through the linked Supabase project and review the SQL before applying:

```bash
supabase link --project-ref asjrbzvrblknxekmyhum
supabase db push
```

The additive contract migration is `supabase/migrations/20260921170000_production_payment_contract.sql`. It adds `orders.revolut_checkout_url` and `orders.payment_failure_reason` with `IF NOT EXISTS`; it does not delete rows or seed products.

### Local validation

```bash
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
NODE_ENV=production pnpm run build
git diff --check
```

Do not run payment smoke tests without explicitly configured authorized credentials and a confirmed production procedure. The current Supabase catalog has no products, so no demo data is included by design.

### Recovery

Before applying migrations to a non-empty environment, create a Supabase backup or point-in-time recovery checkpoint. If an application compatibility issue is detected, restore from that checkpoint rather than running an ad-hoc destructive rollback. Never commit service-role keys or Revolut secrets.
