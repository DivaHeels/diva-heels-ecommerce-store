BEGIN;

-- Owner-approved GBP price: GBP 84.00 (8400 pence) for every size of each retail model.
-- Product prices are shared by all sizes. Preserve EUR prices, stock and activity.
UPDATE public.products
SET price_gbp_minor = 8400,
    updated_at = now()
WHERE slug IN ('diva-heels-atelier', 'diva-heels-noir', 'diva-heels-signature')
  AND price_gbp_minor IS DISTINCT FROM 8400;

COMMIT;
