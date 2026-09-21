-- Diva Heels production catalog: only Atelier, Noir and Signature are active.
-- Safe to run repeatedly: slug is the stable conflict key. No rows are deleted.

UPDATE public.products
SET active = false, updated_at = now()
WHERE slug IN ('divaheels-обувки-с-висок-ток', 'нови-дамски-обувки-с-висок-ток-14-см');

INSERT INTO public.products (
  slug,
  title,
  description,
  price_eur_minor,
  price_gbp_minor,
  images,
  sizes,
  color,
  material,
  stock,
  active
)
VALUES
(
  'diva-heels-atelier',
  'Diva Heels Atelier',
  'Diva Heels Atelier е изчистен черен модел от естествена кожа, създаден за елегантна визия и уверен силует. Балансираната форма го прави подходящ за специални поводи и за моменти, в които детайлът има значение. Безплатна доставка до България в срок до 2 работни дни след потвърждение на поръчката. Връщане в срок от 14 дни след получаване.',
  9800,
  NULL,
  '["/diva-heels-product.png", "/diva-heels-hero.png"]'::jsonb,
  '["36", "37", "38", "39", "40", "41"]'::jsonb,
  'черен',
  'естествена кожа',
  10,
  true
),
(
  'diva-heels-noir',
  'Diva Heels Noir',
  'Diva Heels Noir е черен модел от естествена кожа с минималистично присъствие и силен вечерен характер. Създаден е за изчистени комбинации, официални поводи и стил, който остава запомнящ се. Безплатна доставка до България в срок до 2 работни дни след потвърждение на поръчката. Връщане в срок от 14 дни след получаване.',
  9800,
  NULL,
  '["/diva-heels-product.png", "/diva-heels-hero.png"]'::jsonb,
  '["36", "37", "38", "39", "40", "41"]'::jsonb,
  'черен',
  'естествена кожа',
  10,
  true
),
(
  'diva-heels-signature',
  'Diva Heels Signature',
  'Diva Heels Signature е характерният черен модел на Diva Heels, изработен от естествена кожа. Елегантният силует е създаден да допълни специалните моменти с увереност и ненатрапчив лукс. Безплатна доставка до България в срок до 2 работни дни след потвърждение на поръчката. Връщане в срок от 14 дни след получаване.',
  9800,
  NULL,
  '["/diva-heels-product.png", "/diva-heels-hero.png"]'::jsonb,
  '["36", "37", "38", "39", "40", "41"]'::jsonb,
  'черен',
  'естествена кожа',
  10,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price_eur_minor = EXCLUDED.price_eur_minor,
  price_gbp_minor = EXCLUDED.price_gbp_minor,
  images = EXCLUDED.images,
  sizes = EXCLUDED.sizes,
  color = EXCLUDED.color,
  material = EXCLUDED.material,
  stock = EXCLUDED.stock,
  active = EXCLUDED.active,
  updated_at = now();
