BEGIN;

-- Keep the permanent payment verification product active and directly reachable,
-- but do not expose it in the normal storefront catalog.
UPDATE public.products
SET featured = true, updated_at = now()
WHERE slug IN ('diva-heels-atelier', 'diva-heels-noir', 'diva-heels-signature');

UPDATE public.products
SET featured = false, updated_at = now()
WHERE slug = 'diva-heels-payment-test-10';

-- Manus seeded the same product gallery onto all three launch products.
-- If those three galleries are still identical at migration time, clear the
-- misleading mappings rather than presenting one shoe as three different models.
-- If distinct galleries have already been supplied manually, this block does nothing.
WITH launch_catalog AS (
  SELECT count(*) AS product_count,
         count(DISTINCT images::text) AS distinct_gallery_count
  FROM public.products
  WHERE slug IN ('diva-heels-atelier', 'diva-heels-noir', 'diva-heels-signature')
),
should_clear AS (
  SELECT product_count = 3 AND distinct_gallery_count = 1 AS value
  FROM launch_catalog
)
UPDATE public.products
SET images = '[]'::jsonb, updated_at = now()
WHERE slug IN ('diva-heels-atelier', 'diva-heels-noir', 'diva-heels-signature')
  AND (SELECT value FROM should_clear);

COMMIT;
