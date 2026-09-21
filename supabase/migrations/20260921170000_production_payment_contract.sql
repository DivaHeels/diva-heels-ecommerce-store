BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS revolut_checkout_url text,
  ADD COLUMN IF NOT EXISTS payment_failure_reason text;

COMMIT;
