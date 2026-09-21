import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { insertOrder, readActiveProductsBySlugs, updateOrder } from '@/lib/supabase-server'
import { getProductMinorPrice, isCountryAllowed, isMarket, markets, type Market } from '@/lib/markets'
import { createRevolutOrder } from '@/lib/revolut'

type CheckoutItem = { product?: { slug?: unknown }; size?: unknown; quantity?: unknown }
type DbProduct = {
  id: string
  slug: string
  title: string
  sizes?: unknown
  price_eur_minor?: number | null
  price_gbp_minor?: number | null
}

const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'city', 'postalCode', 'address'] as const
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^[+0-9()\s-]{7,24}$/

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!isMarket(body?.market)) return NextResponse.json({ error: 'Невалиден пазар.' }, { status: 400 })
    const market: Market = body.market
    const country = typeof body.country === 'string' ? body.country : ''
    const missing = requiredFields.filter((field) => typeof body[field] !== 'string' || !body[field].trim())
    if (missing.length || !emailPattern.test(String(body.email).trim()) || !phonePattern.test(String(body.phone).trim())) {
      return NextResponse.json({ error: 'Моля, попълнете коректно всички задължителни полета.' }, { status: 400 })
    }
    if (!isCountryAllowed(market, country)) return NextResponse.json({ error: 'Избраната държава не е налична за този пазар.' }, { status: 400 })
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) return NextResponse.json({ error: 'Количката е празна или невалидна.' }, { status: 400 })

    const requested = (body.items as CheckoutItem[]).map((item) => ({
      slug: typeof item?.product?.slug === 'string' ? item.product.slug : '',
      size: typeof item?.size === 'string' ? item.size : '',
      quantity: Number(item?.quantity),
    }))
    if (requested.some((item) => !item.slug || !item.size || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) || requested.reduce((sum, item) => sum + item.quantity, 0) > 50) {
      return NextResponse.json({ error: 'Количката съдържа невалидно количество.' }, { status: 400 })
    }

    const products = await readActiveProductsBySlugs([...new Set(requested.map((item) => item.slug))]) as DbProduct[]
    const bySlug = new Map(products.map((product) => [product.slug, product]))
    if (requested.some((item) => !bySlug.has(item.slug))) return NextResponse.json({ error: 'Един от продуктите вече не е наличен.' }, { status: 409 })

    const orderItems: Record<string, unknown>[] = []
    for (const item of requested) {
      const product = bySlug.get(item.slug)
      if (!product) return NextResponse.json({ error: 'Един от продуктите вече не е наличен.' }, { status: 409 })
      const sizes = Array.isArray(product.sizes) ? product.sizes.map(String) : []
      const price = getProductMinorPrice(product, market)
      if (!sizes.includes(item.size)) return NextResponse.json({ error: 'Избраният размер не е наличен.' }, { status: 400 })
      if (price == null) return NextResponse.json({ error: 'Този продукт няма цена за избрания пазар.' }, { status: 409 })
      orderItems.push({ product_id: product.id, product_title_snapshot: product.title, size: item.size, unit_price_minor: price, quantity: item.quantity, total_minor: price * item.quantity })
    }

    const subtotal = orderItems.reduce((sum, item) => sum + Number(item.total_minor), 0)
    const publicOrderNumber = `DH-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
    const order = await insertOrder({ public_order_number: publicOrderNumber, market, currency: markets[market].currency, status: 'pending', payment_status: 'unpaid', customer_first_name: body.firstName.trim(), customer_last_name: body.lastName.trim(), customer_email: body.email.trim().toLowerCase(), customer_phone: body.phone.trim(), shipping_country: country, shipping_city: body.city.trim(), shipping_postal_code: body.postalCode.trim(), shipping_address_line_1: body.address.trim(), shipping_address_line_2: typeof body.address2 === 'string' ? body.address2.trim() || null : null, subtotal_minor: subtotal, shipping_minor: 0, total_minor: subtotal }, orderItems)

    let payment: Awaited<ReturnType<typeof createRevolutOrder>> = null
    try {
      payment = await createRevolutOrder(subtotal, markets[market].currency, publicOrderNumber)
      if (payment?.id) await updateOrder(order.id, { revolut_order_id: payment.id, status: 'processing' })
    } catch (error) {
      console.error('[v0] Revolut order creation failed', error instanceof Error ? error.message : 'unknown error')
    }

    return NextResponse.json({ orderId: order.id, orderNumber: publicOrderNumber, checkoutToken: payment?.token ?? null, revolutOrderId: payment?.id ?? null, paymentAvailable: Boolean(payment?.token) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown checkout error'
    console.error('[v0] Checkout failed', message)
    return NextResponse.json({ error: message.includes('Supabase') ? message : 'Поръчката не може да бъде създадена в момента.' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
