import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { insertPaymentEvent, readOrderByRevolutId, updateOrderByRevolutId } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function isValidSignature(signatureHeader: string, secret: string, timestamp: string, raw: string) {
  const expected = crypto.createHmac('sha256', secret).update(`v1.${timestamp}.${raw}`).digest('hex')
  return signatureHeader.split(',').some((entry) => {
    const [version, provided] = entry.trim().split('=', 2)
    if (version !== 'v1' || !provided || !/^[a-f0-9]{64}$/i.test(provided)) return false
    return crypto.timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'))
  })
}

function eventId(event: Record<string, any>, raw: string) {
  return String(event.id || event.event_id || event.webhook_id || crypto.createHash('sha256').update(raw).digest('hex'))
}

export async function POST(request: Request) {
  const raw = await request.text()
  const secret = process.env.REVOLUT_WEBHOOK_SIGNING_SECRET
  const signature = request.headers.get('revolut-signature') || request.headers.get('x-revolut-signature')
  const timestamp = request.headers.get('revolut-request-timestamp') || request.headers.get('x-revolut-request-timestamp')
  if (!secret) return NextResponse.json({ error: 'Webhook signing is not configured.' }, { status: 503 })
  if (!signature || !timestamp || !/^\d{13}$/.test(timestamp)) return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  const age = Date.now() - Number(timestamp)
  if (!Number.isFinite(age) || Math.abs(age) > 300000) return NextResponse.json({ error: 'Expired webhook.' }, { status: 401 })
  if (!isValidSignature(signature, secret, timestamp, raw)) return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })

  try {
    const event = JSON.parse(raw) as Record<string, any>
    const type = String(event.event || event.type || '')
    const revolutId = String(event.order_id || event.order?.id || '')
    const id = eventId(event, raw)
    const order = revolutId ? await readOrderByRevolutId(revolutId) : null
    const duplicate = await insertPaymentEvent({ revolut_event_id: id, order_id: order?.id ?? null, event_type: type, payload: event })
    if (duplicate) return NextResponse.json({ received: true, duplicate: true })
    if (!order || !revolutId) return NextResponse.json({ received: true })

    const terminalPaid = order.payment_status === 'paid' || order.payment_status === 'refunded'
    if (terminalPaid && ['ORDER_PAYMENT_FAILED', 'ORDER_PAYMENT_DECLINED', 'ORDER_FAILED', 'ORDER_CANCELLED'].includes(type)) return NextResponse.json({ received: true })

    if (type === 'ORDER_AUTHORISED') await updateOrderByRevolutId(revolutId, { payment_status: 'processing', status: 'processing' })
    else if (type === 'ORDER_COMPLETED') await updateOrderByRevolutId(revolutId, { payment_status: 'paid', status: 'completed', payment_failure_reason: null })
    else if (type === 'ORDER_PAYMENT_FAILED' || type === 'ORDER_PAYMENT_DECLINED') await updateOrderByRevolutId(revolutId, { payment_status: 'failed', status: 'processing', payment_failure_reason: String(event.failure_reason || event.reason || type).slice(0, 500) })
    else if (type === 'ORDER_FAILED' || type === 'ORDER_CANCELLED') await updateOrderByRevolutId(revolutId, { payment_status: 'failed', status: 'cancelled', payment_failure_reason: String(event.failure_reason || event.reason || type).slice(0, 500) })
    else if (type === 'ORDER_REFUNDED') await updateOrderByRevolutId(revolutId, { payment_status: 'refunded', status: 'refunded' })
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[webhook] Payment event processing failed', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
