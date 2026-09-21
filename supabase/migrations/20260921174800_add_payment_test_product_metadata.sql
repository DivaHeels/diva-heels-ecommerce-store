BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shipping_free boolean NOT NULL DEFAULT true;

COMMIT;
