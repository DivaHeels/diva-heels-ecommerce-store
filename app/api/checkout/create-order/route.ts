import { NextResponse } from 'next/server'
import { insertOrder, readActiveProductsBySlugs } from '@/lib/supabase-server'

const textFields = ['firstName', 'lastName', 'email', 'phone', 'city', 'postalCode', 'address'] as const

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const missing = textFields.filter((field) => typeof body?.[field] !== 'string' || !body[field].trim())
    if (missing.length || body.country !== 'България') {
      return NextResponse.json({ error: missing.length ? 'Моля, попълнете всички задължителни полета.' : 'Доставката е налична само за България.' }, { status: 400 })
    }

    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
      return NextResponse.json({ error: 'Количката е празна или невалидна.' }, { status: 400 })
    }

    const requested = body.items.map((item: any) => ({
      slug: typeof item?.product?.slug === 'string' ? item.product.slug : '',
      size: typeof item?.size === 'string' ? item.size : '',
      quantity: Number(item?.quantity),
    }))
    if (requested.some((item: any) => !item.slug || !item.size || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) {
      return NextResponse.json({ error: 'Количката съдържа невалиден продукт.' }, { status: 400 })
    }

    const products = await readActiveProductsBySlugs([...new Set(requested.map((item: any) => item.slug))])
    const bySlug = new Map(products.map((product: any) => [product.slug, product]))
    if (requested.some((item: any) => !bySlug.has(item.slug))) {
      return NextResponse.json({ error: 'Един от продуктите вече не е наличен.' }, { status: 409 })
    }

    const items = requested.map((item: any) => {
      const product = bySlug.get(item.slug)
      const unitPrice = product.price_eur_minor
      return { product_id: product.id, product_title_snapshot: product.title, size: item.size, unit_price_minor: unitPrice, quantity: item.quantity, total_minor: unitPrice * item.quantity }
    })
    const subtotal = items.reduce((sum: number, item: any) => sum + item.total_minor, 0)
    const orderNumber = `DH-${Date.now().toString(36).toUpperCase()}`
    const order = await insertOrder({
      public_order_number: orderNumber, market: 'BG', currency: 'EUR', status: 'pending', payment_status: 'unpaid',
      customer_first_name: body.firstName.trim(), customer_last_name: body.lastName.trim(), customer_email: body.email.trim(), customer_phone: body.phone.trim(),
      shipping_country: body.country, shipping_city: body.city.trim(), shipping_postal_code: body.postalCode.trim(), shipping_address_line_1: body.address.trim(), shipping_address_line_2: typeof body.address2 === 'string' ? body.address2.trim() || null : null,
      subtotal_minor: subtotal, shipping_minor: 0, total_minor: subtotal,
    }, items)

    return NextResponse.json({ orderNumber: order.public_order_number, orderId: order.id, paymentStatus: order.payment_status }, { status: 201 })
  } catch (error) {
    console.error('[checkout] order creation failed', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Поръчката не можа да бъде създадена. Моля, опитайте отново.' }, { status: 500 })
  }
}
