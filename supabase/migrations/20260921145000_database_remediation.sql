BEGIN;

-- This migration intentionally does not seed or delete business data.
-- It fails before tightening constraints if existing orders cannot receive a key.

ALTER TABLE public.products
  ALTER COLUMN active SET DEFAULT true,
  ALTER COLUMN active SET NOT NULL,
  ALTER COLUMN price_eur_minor SET NOT NULL;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_price_eur_minor_non_negative,
  DROP CONSTRAINT IF EXISTS products_price_gbp_minor_non_negative;
ALTER TABLE public.products
  ADD CONSTRAINT products_price_eur_minor_non_negative CHECK (price_eur_minor >= 0),
  ADD CONSTRAINT products_price_gbp_minor_non_negative CHECK (price_gbp_minor IS NULL OR price_gbp_minor >= 0);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS public_access_token_hash text;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.orders WHERE idempotency_key IS NULL) THEN
    RAISE EXCEPTION 'database_remediation_blocked: existing orders require idempotency_key values before NOT NULL can be applied';
  END IF;
END $$;

ALTER TABLE public.orders
  ALTER COLUMN idempotency_key SET NOT NULL;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_market_check,
  DROP CONSTRAINT IF EXISTS orders_currency_check,
  DROP CONSTRAINT IF EXISTS orders_status_check,
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_market_check CHECK (market IN ('BG', 'EU', 'UK')),
  ADD CONSTRAINT orders_currency_check CHECK (currency IN ('EUR', 'GBP')),
  ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('unpaid', 'processing', 'paid', 'failed', 'refunded'));

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_revolut_order_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS orders_public_order_number_uidx
  ON public.orders (public_order_number);
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_uidx
  ON public.orders (idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS orders_revolut_order_id_uidx
  ON public.orders (revolut_order_id)
  WHERE revolut_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_public_access_token_hash_idx
  ON public.orders (public_access_token_hash);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx
  ON public.orders (payment_status);

ALTER TABLE public.order_items
  ALTER COLUMN order_id SET NOT NULL,
  ALTER COLUMN product_id SET NOT NULL,
  ALTER COLUMN unit_price_minor SET NOT NULL,
  ALTER COLUMN quantity SET NOT NULL,
  ALTER COLUMN total_minor SET NOT NULL;

ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_quantity_positive,
  DROP CONSTRAINT IF EXISTS order_items_unit_price_minor_non_negative,
  DROP CONSTRAINT IF EXISTS order_items_total_minor_non_negative;
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
  ADD CONSTRAINT order_items_unit_price_minor_non_negative CHECK (unit_price_minor >= 0),
  ADD CONSTRAINT order_items_total_minor_non_negative CHECK (total_minor >= 0);

CREATE INDEX IF NOT EXISTS order_items_product_id_idx
  ON public.order_items (product_id);

CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revolut_event_id text NOT NULL,
  order_id uuid NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_events
  ADD COLUMN IF NOT EXISTS revolut_event_id text,
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS payload jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS received_at timestamptz DEFAULT now();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.payment_events WHERE revolut_event_id IS NULL OR event_type IS NULL OR payload IS NULL OR received_at IS NULL) THEN
    RAISE EXCEPTION 'database_remediation_blocked: payment_events contains incomplete rows';
  END IF;
END $$;

ALTER TABLE public.payment_events
  ALTER COLUMN revolut_event_id SET NOT NULL,
  ALTER COLUMN event_type SET NOT NULL,
  ALTER COLUMN payload SET NOT NULL,
  ALTER COLUMN received_at SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payment_events_revolut_event_id_uidx
  ON public.payment_events (revolut_event_id);
CREATE INDEX IF NOT EXISTS payment_events_order_id_idx
  ON public.payment_events (order_id);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

COMMIT;
