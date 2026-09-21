'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ChevronDown, Minus, Plus } from 'lucide-react'
import type { Product } from '@/lib/products'
import { useStore } from './store-provider'
import { useLanguage } from './language-provider'

export function ProductView({ product }: { product: Product }) {
  const router = useRouter()
  const { add, formatPrice } = useStore()
  const { language } = useLanguage()
  const images = useMemo(() => product.images.filter(Boolean), [product.images])
  const [image, setImage] = useState(0)
  const [size, setSize] = useState(product.sizes[0] ?? '')
  const [qty, setQty] = useState(1)
  const [open, setOpen] = useState('details')
  const maxQty = Math.max(1, product.stock || 1)

  const addSelected = () => {
    const safeQty = Math.min(qty, maxQty)
    for (let i = 0; i < safeQty; i++) add(product, size)
  }

  const labels = language === 'en'
    ? {
        available: 'Available',
        pairs: 'pairs',
        size: 'Size',
        sizeGuide: 'Size guide',
        quantity: 'Quantity',
        add: 'Add to cart',
        buy: 'Buy now',
        freeShipping: 'Free shipping to Bulgaria and supported EU countries',
        delivery: 'Expected delivery: up to 2 business days',
        returns: 'Returns: within 14 days after delivery',
        details: 'Details',
        shipping: 'Shipping',
        returnLabel: 'Returns',
        payment: 'Payment',
        material: 'Material',
        color: 'Color',
        imageSoon: 'Product image coming soon',
        shippingText: 'Free shipping to Bulgaria and supported EU countries. Expected delivery: up to 2 business days.',
        returnsText: 'Returns are accepted within 14 days after delivery. Return shipping is paid by the customer, except for defective, damaged or incorrectly sent products.',
        paymentText: 'Secure online payment through Revolut Merchant.',
      }
    : {
        available: 'Налични',
        pairs: 'чифта',
        size: 'Размер',
        sizeGuide: 'Таблица с размери',
        quantity: 'Количество',
        add: 'Добави в количката',
        buy: 'Купи сега',
        freeShipping: 'Безплатна доставка до България и поддържаните държави от ЕС',
        delivery: 'Очаквана доставка: до 2 работни дни',
        returns: 'Връщане: до 14 дни след получаване',
        details: 'Детайли',
        shipping: 'Доставка',
        returnLabel: 'Връщане',
        payment: 'Плащане',
        material: 'Материал',
        color: 'Цвят',
        imageSoon: 'Снимка на продукта предстои',
        shippingText: 'Безплатна доставка до България и поддържаните държави от ЕС. Очакван срок: до 2 работни дни.',
        returnsText: 'Връщане до 14 дни след получаване. Обратната доставка е за сметка на клиента, освен при дефектен, повреден или погрешно изпратен продукт.',
        paymentText: 'Сигурно онлайн плащане чрез Revolut Merchant.',
      }

  const sections = [
    { key: 'details', label: labels.details, text: `${labels.material}: ${product.material}. ${labels.color}: ${product.color}.` },
    { key: 'shipping', label: labels.shipping, text: labels.shippingText },
    { key: 'returns', label: labels.returnLabel, text: labels.returnsText },
    { key: 'payment', label: labels.payment, text: labels.paymentText },
  ]

  return <main className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-16">
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
      <div>
        <div className="relative aspect-[4/5] bg-[#f7f4f0]">
          {images[image]
            ? <Image src={images[image]} alt={product.title} fill className="object-cover" />
            : <div className="flex h-full items-center justify-center px-8 text-center text-xs uppercase tracking-[.16em] text-[#777]">{labels.imageSoon}</div>}
        </div>
        {images.length > 1 && <div className="mt-4 flex gap-3">{images.map((src, i) => <button key={src} aria-label={`${language === 'en' ? 'Show image' : 'Покажи изображение'} ${i + 1}`} onClick={() => setImage(i)} className={`relative h-20 w-16 overflow-hidden ${i === image ? 'ring-1 ring-[#111]' : ''}`}><Image src={src} alt="" fill className="object-cover" /></button>)}</div>}
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-[10px] uppercase tracking-[.25em] text-[#b79a66]">Diva Heels</p>
        <h1 className="mt-4 font-editorial text-6xl leading-none">{product.title}</h1>
        <p className="mt-5 text-xl">{formatPrice(product)}</p>
        <p className="mt-2 text-xs text-[#666]">{labels.available}: {product.stock} {labels.pairs}</p>
        <p className="mt-6 max-w-md text-sm leading-7 text-[#666]">{product.description}</p>

        <div className="mt-9">
          <div className="flex justify-between text-xs"><span>{labels.size}</span><Link href="#size" className="underline">{labels.sizeGuide}</Link></div>
          <div className="mt-3 grid grid-cols-6 gap-2">{product.sizes.map((s) => <button key={s} onClick={() => setSize(s)} className={`border py-3 text-sm ${s === size ? 'border-[#111] bg-[#111] text-white' : 'border-[#e8e5e1]'}`}>{s}</button>)}</div>
        </div>

        <div className="mt-7 flex items-center gap-4">
          <span className="text-xs">{labels.quantity}</span>
          <div className="flex border border-[#e8e5e1]">
            <button aria-label={language === 'en' ? 'Decrease quantity' : 'Намали количеството'} className="px-3 py-2" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-3 w-3" /></button>
            <span className="px-3 py-2 text-sm">{qty}</span>
            <button aria-label={language === 'en' ? 'Increase quantity' : 'Увеличи количеството'} className="px-3 py-2" onClick={() => setQty(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty}><Plus className="h-3 w-3" /></button>
          </div>
        </div>

        <button disabled={!size || product.stock < 1} onClick={addSelected} className="mt-7 w-full bg-[#111] py-4 text-xs uppercase tracking-[.18em] text-white hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-50">{labels.add}</button>
        <button disabled={!size || product.stock < 1} onClick={() => { addSelected(); router.push('/checkout') }} className="mt-3 w-full border border-[#111] py-4 text-xs uppercase tracking-[.18em] disabled:cursor-not-allowed disabled:opacity-50">{labels.buy}</button>

        <div className="mt-7 grid gap-2 text-xs text-[#666]"><p>✓ {labels.freeShipping}</p><p>✓ {labels.delivery}</p><p>✓ {labels.returns}</p></div>

        <div className="mt-10 border-t border-[#e8e5e1]">{sections.map((section) => <div key={section.key} className="border-b border-[#e8e5e1]"><button onClick={() => setOpen(open === section.key ? '' : section.key)} className="flex w-full items-center justify-between py-5 text-sm">{section.label}<ChevronDown className={`h-4 w-4 transition ${open === section.key ? 'rotate-180' : ''}`} /></button>{open === section.key && <p className="pb-5 text-xs leading-6 text-[#666]">{section.text}</p>}</div>)}</div>
      </div>
    </div>
  </main>
}
