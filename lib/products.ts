export type Product = {
  id: string
  slug: string
  title: string
  description: string
  price: number
  currency: 'EUR'
  images: string[]
  sizes: string[]
  color: string
  material: string
  category: 'Pumps'
  featured: boolean
  active: boolean
}

export const products: Product[] = [
  { id: 'signature', slug: 'diva-heels-signature', title: 'Diva Heels Signature', description: 'Елегантен силует, висок ток и изчистена женствена визия.', price: 98, currency: 'EUR', images: ['/diva-heels-product.png', '/diva-heels-hero.png'], sizes: ['36', '37', '38', '39', '40', '41'], color: 'Черен', material: 'Еко кожа', category: 'Pumps', featured: true, active: true },
  { id: 'noir', slug: 'diva-heels-noir', title: 'Diva Heels Noir', description: 'Класическа линия с модерен характер за специални моменти.', price: 98, currency: 'EUR', images: ['/diva-heels-hero.png', '/diva-heels-product.png'], sizes: ['36', '37', '38', '39', '40'], color: 'Черно', material: 'Еко кожа', category: 'Pumps', featured: true, active: true },
  { id: 'atelier', slug: 'diva-heels-atelier', title: 'Diva Heels Atelier', description: 'Минималистична форма, създадена да остане във времето.', price: 98, currency: 'EUR', images: ['/diva-heels-product.png', '/diva-heels-hero.png'], sizes: ['37', '38', '39', '40', '41'], color: 'Черно', material: 'Еко кожа', category: 'Pumps', featured: false, active: true },
]

export const activeProducts = products.filter((product) => product.active)
export const featuredProducts = activeProducts.filter((product) => product.featured)
export const getProduct = (slug: string) => activeProducts.find((product) => product.slug === slug)
export const formatPrice = (price: number) => `${price.toFixed(0)} €`
