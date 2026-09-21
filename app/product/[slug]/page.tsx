import { notFound } from 'next/navigation'; import { getProduct } from '@/lib/products'; import { ProductView } from '@/components/product-view'
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const product=getProduct(slug);if(!product) notFound();return <ProductView product={product}/>}
