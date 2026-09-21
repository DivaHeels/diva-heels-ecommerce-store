import type { Market } from '@/lib/markets'

export type Product = { id: string; slug: string; title: string; description: string; price: number; priceEurMinor?: number | null; priceGbpMinor?: number | null; currency: 'EUR'; images: string[]; sizes: string[]; color: string; material: string; stock: number; category: 'Pumps'; featured: boolean; active: boolean }

export type SupabaseProduct = { id: string; slug: string; title: string; description?: string | null; price_eur_minor: number; price_gbp_minor?: number | null; images?: unknown; sizes?: unknown; color?: string | null; material?: string | null; stock?: number | null; active: boolean }

function stringArray(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [] }

export function mapSupabaseProduct(product: SupabaseProduct): Product {
  return { id: product.id, slug: product.slug, title: product.title, description: product.description ?? '', price: product.price_eur_minor / 100, priceEurMinor: product.price_eur_minor, priceGbpMinor: product.price_gbp_minor ?? null, currency: 'EUR', images: stringArray(product.images), sizes: stringArray(product.sizes), color: product.color ?? '', material: product.material ?? '', stock: product.stock ?? 0, category: 'Pumps', featured: false, active: product.active }
}

export function productMinorPrice(product: Product, market: Market) { return market === 'UK' ? product.priceGbpMinor ?? null : product.priceEurMinor ?? Math.round(product.price * 100) }
