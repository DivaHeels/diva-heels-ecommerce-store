'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/products'
import { useStore } from './store-provider'

export function ProductCard({ product }: { product: Product }) {
  const { formatPrice } = useStore()
  return <Link href={`/product/${product.slug}`} className="group block"><div className="relative aspect-[4/5] overflow-hidden bg-[#f7f4f0]"><Image src={product.images[0]} alt={product.title} fill className="object-cover transition duration-700 group-hover:scale-105" /><span className="absolute bottom-4 left-4 bg-white/90 px-3 py-2 text-[10px] uppercase tracking-widest opacity-0 transition group-hover:opacity-100">Разгледай</span></div><div className="mt-4 flex justify-between gap-4"><div><h3 className="text-sm">{product.title}</h3><p className="mt-1 text-xs text-[#666]">{product.color}</p></div><p className="text-sm">{formatPrice(product)}</p></div></Link>
}
