BEGIN;

-- The owner confirmed that the closed black shoe with the gold-tone heel is Atelier.
-- Assign only its second-store product photo; the hero shows a different shoe model.
UPDATE public.products
SET images = '["/diva-heels-product.png"]'::jsonb,
    updated_at = now()
WHERE slug = 'diva-heels-atelier'
  AND images IS DISTINCT FROM '["/diva-heels-product.png"]'::jsonb;

COMMIT;
