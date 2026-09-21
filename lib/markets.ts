export type Market = 'BG' | 'EU' | 'UK'
export type Language = 'bg' | 'en'
export const EU_COUNTRIES = ['AT','BE','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'] as const
export const markets = { BG: { currency: 'EUR', locale: 'bg-BG', language: 'bg' as Language, countries: ['BG'] }, EU: { currency: 'EUR', locale: 'en-GB', language: 'en' as Language, countries: [...EU_COUNTRIES] }, UK: { currency: 'GBP', locale: 'en-GB', language: 'en' as Language, countries: ['GB'] } } as const
export function isMarket(value: unknown): value is Market { return value === 'BG' || value === 'EU' || value === 'UK' }
export function getMarket(value: unknown): Market { return isMarket(value) ? value : 'BG' }
export function isCountryAllowed(market: Market, country: string) { return (markets[market].countries as readonly string[]).includes(country) }
export function formatMinor(minor: number, market: Market) { return new Intl.NumberFormat(markets[market].locale, { style: 'currency', currency: markets[market].currency }).format(minor / 100) }
export function getProductMinorPrice(product: { price_eur_minor?: number | null; price_gbp_minor?: number | null }, market: Market) { return market === 'UK' ? product.price_gbp_minor ?? null : product.price_eur_minor ?? null }
export const marketOptions = [{ value: 'BG' as Market, label: 'България' }, { value: 'EU' as Market, label: 'Europe' }, { value: 'UK' as Market, label: 'United Kingdom' }]
