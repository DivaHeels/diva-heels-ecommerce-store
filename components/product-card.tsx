'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/products'
import { useStore } from './store-provider'
import { useLanguage } from './language-provider'

export function ProductCard({ product }: { product: Product }) {
  const { formatPrice } = useStore()
  const { language } = useLanguage()
  const image = product.images[0]

  return <Link href={`/product/${product.slug}`} className="group block">
    <div className="relative aspect-[4/5] overflow-hidden bg-[#f7f4f0]">
      {image
        ? <Image src={image} alt={product.title} fill className="object-cover transition duration-700 group-hover:scale-105" />
        : <div className="flex h-full items-center justify-center px-6 text-center text-[11px] uppercase tracking-[.16em] text-[#777]">{language === 'en' ? 'Product image coming soon' : 'Снимка на продукта предстои'}</div>}
      <span className="absolute bottom-4 left-4 bg-white/90 px-3 py-2 text-[10px] uppercase tracking-widest opacity-0 transition group-hover:opacity-100">{language === 'en' ? 'View' : 'Разгледай'}</span>
    </div>
    <div className="mt-4 flex justify-between gap-4">
      <div><h3 className="text-sm">{product.title}</h3><p className="mt-1 text-xs text-[#666]">{product.color}</p></div>
      <p className="text-sm">{formatPrice(product)}</p>
    </div>
  </Link>
}
