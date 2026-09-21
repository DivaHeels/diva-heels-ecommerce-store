import { notFound } from 'next/navigation'
import { readActiveProductsBySlugs } from '@/lib/supabase-server'
import { mapSupabaseProduct } from '@/lib/products'
import { ProductView } from '@/components/product-view'

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const rows = await readActiveProductsBySlugs([slug])
  const product = rows[0] ? mapSupabaseProduct(rows[0]) : null
  if (!product) notFound()
  return <ProductView product={product} />
}
