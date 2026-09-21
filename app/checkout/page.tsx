'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useStore } from '@/components/store-provider'
import { formatMinor, markets } from '@/lib/markets'

export default function Checkout() {
  const { items, total, market } = useStore()
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/checkout/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify({ ...Object.fromEntries(form.entries()), market, items }) })
      const result = await response.json()
      if (!response.ok || result.error) setMessage(result.error || 'Поръчката не може да бъде създадена.')
      else if (result.checkoutUrl) window.location.href = result.checkoutUrl
      else setMessage('Платежната страница не е налична в момента.')
    } catch { setMessage('Възникна грешка. Моля, опитайте отново.') } finally { setLoading(false) }
  }

  return <main className="mx-auto max-w-6xl px-5 py-16 lg:py-24"><div className="mb-12"><p className="text-[10px] uppercase tracking-[.25em] text-[#b79a66]">Diva Heels · {market} · {markets[market].currency}</p><h1 className="mt-3 font-editorial text-6xl">Плащане</h1></div>{items.length === 0 ? <div className="border border-[#e8e5e1] p-8 text-sm">Количката ви е празна. <Link href="/shop" className="underline">Разгледайте колекцията.</Link></div> : <div className="grid gap-14 lg:grid-cols-[1fr_380px]"><form className="space-y-10" onSubmit={submit}><section><h2 className="font-editorial text-3xl">Вашите данни</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{[['Име','firstName'],['Фамилия','lastName'],['Имейл','email'],['Телефон','phone']].map(([label, id]) => <label className="text-xs" key={id}>{label}<input name={id} type={id === 'email' ? 'email' : 'text'} required className="mt-2 w-full border border-[#e8e5e1] bg-white px-4 py-3 text-sm" /></label>)}</div></section><section><h2 className="font-editorial text-3xl">Адрес за доставка</h2><div className="mt-6 grid gap-4 md:grid-cols-2"><label className="text-xs">Държава<select name="country" defaultValue={markets[market].countries[0]} className="mt-2 w-full border border-[#e8e5e1] bg-white px-4 py-3 text-sm">{markets[market].countries.map((country) => <option key={country} value={country}>{country}</option>)}</select></label><label className="text-xs">Град<input name="city" required className="mt-2 w-full border border-[#e8e5e1] px-4 py-3 text-sm" /></label><label className="text-xs">Пощенски код<input name="postalCode" required className="mt-2 w-full border border-[#e8e5e1] px-4 py-3 text-sm" /></label><label className="text-xs md:col-span-2">Адрес<input name="address" required className="mt-2 w-full border border-[#e8e5e1] px-4 py-3 text-sm" /></label><label className="text-xs md:col-span-2">Допълнителен адрес<input name="address2" className="mt-2 w-full border border-[#e8e5e1] px-4 py-3 text-sm" /></label></div></section><section className="border-t border-[#e8e5e1] pt-7"><h2 className="font-editorial text-3xl">Сигурно плащане</h2><p className="mt-5 border border-[#e8e5e1] p-5 text-sm text-[#666]">Ще бъдете пренасочени към защитената платежна страница на Revolut.</p>{message && <p role="alert" className="mt-4 text-sm text-[#9a5f39]">{message}</p>}<button disabled={loading} className="mt-6 w-full bg-[#111] px-7 py-4 text-xs uppercase tracking-widest text-white disabled:opacity-50">{loading ? 'Обработване...' : 'Продължи към плащане'}</button></section></form><aside className="h-fit border-t border-[#e8e5e1] pt-6"><h2 className="font-editorial text-3xl">Обобщение</h2>{items.map((item) => <div className="flex justify-between gap-4 border-b border-[#e8e5e1] py-4 text-sm" key={item.product.slug + item.size}><span>{item.product.title} · {item.size} × {item.quantity}</span><b>{formatMinor(((market === 'UK' ? item.product.priceGbpMinor : item.product.priceEurMinor) ?? 0) * item.quantity, market)}</b></div>)}<div className="mt-6 flex justify-between text-sm"><span>Общо</span><b>{formatMinor(total, market)}</b></div><p className="mt-2 text-xs text-[#666]">Доставка: Безплатно</p></aside></div>}</main>
}
