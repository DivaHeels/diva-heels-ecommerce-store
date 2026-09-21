'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Market } from '@/lib/markets'

export type Language = 'bg' | 'en'
const translations = {
  bg: {
    home: 'Начало', shop: 'Магазин', about: 'За нас', contact: 'Контакти', cart: 'Количка', menu: 'Меню', market: 'Пазар', language: 'Език', close: 'Затвори', remove: 'Премахни', emptyCart: 'Количката ви е празна.', toShop: 'Към магазина', summary: 'Обобщение', subtotal: 'Междинна сума', shipping: 'Доставка', free: 'Безплатно', checkout: 'Продължи към плащане', send: 'Изпрати', sending: 'Изпращане...', unavailable: 'Покупката във Великобритания е временно недостъпна', unavailableShort: 'UK покупка недостъпна', available: 'Налични', size: 'Размер', quantity: 'Количество', details: 'Детайли', returns: 'Връщане', payment: 'Плащане', delivery: 'Доставка', shopCollection: 'Разгледай колекцията', buyNow: 'Купи сега', freeShipping: 'Безплатна доставка до България, Европа и Великобритания • До 2 работни дни', stockError: 'Избраният продукт няма достатъчна наличност.'
  },
  en: {
    home: 'Home', shop: 'Shop', about: 'About', contact: 'Contact', cart: 'Cart', menu: 'Menu', market: 'Market', language: 'Language', close: 'Close', remove: 'Remove', emptyCart: 'Your cart is empty.', toShop: 'Continue shopping', summary: 'Summary', subtotal: 'Subtotal', shipping: 'Shipping', free: 'Free', checkout: 'Proceed to checkout', send: 'Send', sending: 'Sending...', unavailable: 'UK checkout is currently unavailable', unavailableShort: 'UK purchase unavailable', available: 'Available', size: 'Size', quantity: 'Quantity', details: 'Details', returns: 'Returns', payment: 'Payment', delivery: 'Delivery', shopCollection: 'Explore collection', buyNow: 'Buy now', freeShipping: 'Free shipping to Bulgaria, Europe and the UK • Up to 2 business days', stockError: 'The selected product does not have enough stock.'
  }
} as const

type TranslationKey = keyof typeof translations.bg
type LanguageContext = { language: Language; setLanguage: (language: Language) => void; t: (key: TranslationKey) => string }
const Context = createContext<LanguageContext | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('bg')
  useEffect(() => { const stored = localStorage.getItem('diva-language') as Language | null; if (stored === 'bg' || stored === 'en') setLanguageState(stored) }, [])
  const setLanguage = (value: Language) => { setLanguageState(value); localStorage.setItem('diva-language', value) }
  const value = useMemo(() => ({ language, setLanguage, t: (key: TranslationKey) => translations[language][key] }), [language])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useLanguage() { return useContext(Context) ?? { language: 'bg' as Language, setLanguage: () => undefined, t: (key: TranslationKey) => translations.bg[key] } }
export function defaultLanguageForMarket(market: Market): Language { return market === 'BG' ? 'bg' : 'en' }
