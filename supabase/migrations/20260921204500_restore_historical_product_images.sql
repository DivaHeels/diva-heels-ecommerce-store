BEGIN;

-- Restore the two product images removed in commit a31ebc18 and reconnect
-- them to the two historical product rows they were imported with.
UPDATE public.products
SET images = '["/products/divaheels-elegant-red/1.jpg"]'::jsonb,
    updated_at = now()
WHERE slug = 'divaheels-обувки-с-висок-ток';

UPDATE public.products
SET images = '["/products/divaheels-elegant-yellow/1.png"]'::jsonb,
    updated_at = now()
WHERE slug = 'нови-дамски-обувки-с-висок-ток-14-см';

COMMIT;
