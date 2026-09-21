'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Product } from '@/lib/products'
import { formatMinor, getMarket, marketOptions, type Market } from '@/lib/markets'
import { useLanguage } from './language-provider'

export type CartItem = { product: Product; size: string; quantity: number }
type Store = { items: CartItem[]; add: (p: Product, s: string) => void; update: (slug: string, s: string, q: number) => void; remove: (slug: string, s: string) => void; open: boolean; setOpen: (v: boolean) => void; total: number; market: Market; setMarket: (m: Market) => void; formatPrice: (p: Product) => string }
const C = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [open, setOpen] = useState(false)
  const [market, setMarketState] = useState<Market>('BG')
  useEffect(() => {
    const raw = localStorage.getItem('diva-cart')
    if (raw) try { setItems(JSON.parse(raw)) } catch { /* ignore corrupt client state */ }
    setMarketState(getMarket(localStorage.getItem('diva-market')))
  }, [])
  useEffect(() => { localStorage.setItem('diva-cart', JSON.stringify(items)) }, [items])
  const setMarket = (m: Market) => { setMarketState(m); localStorage.setItem('diva-market', m) }
  const formatPrice = (p: Product) => {
    const minor = market === 'UK' ? p.priceGbpMinor : p.priceEurMinor
    return minor == null && market === 'UK' ? 'UK purchase unavailable' : formatMinor(minor ?? p.price * 100, market)
  }
  const value = useMemo(() => ({
    items, open, setOpen, market, setMarket, formatPrice,
    add: (p: Product, s: string) => { setItems((a) => { const found = a.find((i) => i.product.slug === p.slug && i.size === s); return found ? a.map((i) => i === found ? { ...i, quantity: Math.min(i.quantity + 1, Math.max(1, p.stock)) } : i) : [...a, { product: p, size: s, quantity: Math.min(1, Math.max(0, p.stock)) }] }); setOpen(true) },
    update: (slug: string, s: string, q: number) => setItems((a) => a.map((i) => i.product.slug === slug && i.size === s ? { ...i, quantity: Math.max(1, Math.min(q, Math.max(1, i.product.stock))) } : i)),
    remove: (slug: string, s: string) => setItems((a) => a.filter((i) => !(i.product.slug === slug && i.size === s))),
    total: items.reduce((sum, i) => sum + ((market === 'UK' ? i.product.priceGbpMinor : i.product.priceEurMinor) ?? 0) * i.quantity, 0),
  }), [items, open, market])
  return <C.Provider value={value}>{children}<CartDrawer /></C.Provider>
}

const EMPTY_STORE: Store = {
  items: [],
  add: () => undefined,
  update: () => undefined,
  remove: () => undefined,
  open: false,
  setOpen: () => undefined,
  total: 0,
  market: 'BG',
  setMarket: () => undefined,
  formatPrice: (product) => formatMinor(product.priceEurMinor ?? product.price * 100, 'BG'),
}

export const useStore = () => useContext(C) ?? EMPTY_STORE

function CartDrawer() {
  const { items, open, setOpen, update, remove, total, formatPrice, market } = useStore()
  const { t } = useLanguage()
  return open ? <div className="fixed inset-0 z-50 bg-black/25" onClick={() => setOpen(false)}><aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between border-b border-[#e8e5e1] pb-5"><h2 className="font-editorial text-3xl">{t('cart')}</h2><button aria-label={t('close')} onClick={() => setOpen(false)} className="text-2xl">×</button></div>{items.length === 0 ? <p className="py-12 text-center text-sm text-[#666]">{t('emptyCart')}</p> : <><div className="divide-y divide-[#e8e5e1]">{items.map((i) => <div className="flex gap-4 py-5" key={i.product.slug + i.size}>{i.product.images[0] ? <img src={i.product.images[0]} alt={i.product.title} className="h-24 w-20 object-cover" /> : <div className="flex h-24 w-20 shrink-0 items-center justify-center bg-[#f7f4f0] px-2 text-center text-[9px] uppercase tracking-wider text-[#777]">{t('imageSoon')}</div>}<div className="flex-1"><div className="flex justify-between gap-2"><p className="text-sm">{i.product.title}</p><button onClick={() => remove(i.product.slug, i.size)} className="text-xs underline">{t('remove')}</button></div><p className="mt-1 text-xs text-[#666]">{t('size')} {i.size}</p><div className="mt-4 flex items-center justify-between"><div className="flex items-center border border-[#e8e5e1]"><button className="px-3 py-1" onClick={() => update(i.product.slug, i.size, Math.max(1, i.quantity - 1))}>−</button><span className="px-2 text-sm">{i.quantity}</span><button className="px-3 py-1" onClick={() => update(i.product.slug, i.size, i.quantity + 1)}>+</button></div><b className="text-sm">{formatPrice(i.product)}</b></div></div></div>)}</div><div className="mt-auto border-t border-[#e8e5e1] pt-5"><div className="flex justify-between text-sm"><span>{t('subtotal')}</span><b>{formatMinor(total, market)}</b></div><p className="mt-2 text-xs text-[#666]">{t('shipping')}: {t('free')}</p><a href="/checkout" className="mt-5 block bg-[#111] py-4 text-center text-sm text-white">{t('checkout')}</a></div></>}</aside></div> : null
}

export { marketOptions }
