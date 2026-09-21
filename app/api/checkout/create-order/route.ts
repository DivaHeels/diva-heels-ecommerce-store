import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { insertOrder, readActiveProductsBySlugs, readOrderByIdempotencyKey, updateOrder } from '@/lib/supabase-server'
import { getProductMinorPrice, isCountryAllowed, isMarket, markets, type Market } from '@/lib/markets'
import { createRevolutOrder } from '@/lib/revolut'
import { rateLimit, requestAddress } from '@/lib/rate-limit'

type CheckoutItem = { product?: { slug?: unknown }; size?: unknown; quantity?: unknown }
type DbProduct = { id: string; slug: string; title: string; sizes?: unknown; price_eur_minor?: number | null; price_gbp_minor?: number | null }
const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'city', 'postalCode', 'address'] as const
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^[+0-9()\s-]{7,24}$/
const idempotencyPattern = /^[A-Za-z0-9._:-]{8,255}$/

function hashToken(token: string) { return crypto.createHash('sha256').update(token).digest('hex') }
function result(order: Record<string, unknown>) {
  return { orderId: order.id, orderNumber: order.public_order_number, checkoutUrl: order.revolut_checkout_url, revolutOrderId: order.revolut_order_id, paymentAvailable: Boolean(order.revolut_checkout_url) }
}

export async function POST(request: Request) {
  const limit = rateLimit(`checkout:${requestAddress(request)}`, 12, 60_000)
  if (!limit.allowed) return NextResponse.json({ error: 'Твърде много опити. Моля, изчакайте.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } })
  const idempotencyKey = request.headers.get('Idempotency-Key')?.trim() ?? ''
  if (!idempotencyPattern.test(idempotencyKey)) return NextResponse.json({ error: 'Липсва валиден Idempotency-Key.' }, { status: 400 })
  try {
    const existing = await readOrderByIdempotencyKey(idempotencyKey)
    if (existing?.revolut_checkout_url) return NextResponse.json(result(existing))
    if (existing) return NextResponse.json({ error: 'Предишният checkout опит е неуспешен. Създайте нова заявка.' }, { status: 409 })

    const body = await request.json()
    if (!isMarket(body?.market)) return NextResponse.json({ error: 'Невалиден пазар.' }, { status: 400 })
    const market: Market = body.market
    const country = typeof body.country === 'string' ? body.country : ''
    const missing = requiredFields.filter((field) => typeof body[field] !== 'string' || !body[field].trim())
    if (missing.length || !emailPattern.test(String(body.email).trim()) || !phonePattern.test(String(body.phone).trim())) return NextResponse.json({ error: 'Моля, попълнете коректно всички задължителни полета.' }, { status: 400 })
    if (!isCountryAllowed(market, country)) return NextResponse.json({ error: 'Избраната държава не е налична за този пазар.' }, { status: 400 })
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) return NextResponse.json({ error: 'Количката е празна или невалидна.' }, { status: 400 })

    const requested = (body.items as CheckoutItem[]).map((item) => ({ slug: typeof item?.product?.slug === 'string' ? item.product.slug : '', size: typeof item?.size === 'string' ? item.size : '', quantity: Number(item?.quantity) }))
    if (requested.some((item) => !item.slug || !item.size || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) || requested.reduce((sum, item) => sum + item.quantity, 0) > 50) return NextResponse.json({ error: 'Количката съдържа невалидно количество.' }, { status: 400 })

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
    const publicAccessToken = crypto.randomBytes(32).toString('base64url')
    const order = await insertOrder({ public_order_number: publicOrderNumber, idempotency_key: idempotencyKey, public_access_token_hash: hashToken(publicAccessToken), market, currency: markets[market].currency, status: 'pending', payment_status: 'unpaid', customer_first_name: body.firstName.trim(), customer_last_name: body.lastName.trim(), customer_email: body.email.trim().toLowerCase(), customer_phone: body.phone.trim(), shipping_country: country, shipping_city: body.city.trim(), shipping_postal_code: body.postalCode.trim(), shipping_address_line_1: body.address.trim(), shipping_address_line_2: typeof body.address2 === 'string' ? body.address2.trim() || null : null, subtotal_minor: subtotal, shipping_minor: 0, total_minor: subtotal }, orderItems)

    try {
      const payment = await createRevolutOrder(subtotal, markets[market].currency, publicOrderNumber, order.id, publicAccessToken)
      await updateOrder(order.id, { revolut_order_id: payment.id, revolut_checkout_url: payment.checkout_url, status: 'processing', payment_status: 'processing' })
      return NextResponse.json(result({ ...order, revolut_order_id: payment.id, revolut_checkout_url: payment.checkout_url }))
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown payment creation error'
      await updateOrder(order.id, { status: 'cancelled', payment_status: 'failed', payment_failure_reason: reason.slice(0, 500) })
      console.error('[checkout] Revolut order creation failed', reason)
      return NextResponse.json({ error: 'Плащането не може да бъде инициирано в момента.' }, { status: 502 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown checkout error'
    console.error('[checkout] Checkout failed', message)
    return NextResponse.json({ error: message.includes('Supabase') ? message : 'Поръчката не може да бъде създадена в момента.' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
