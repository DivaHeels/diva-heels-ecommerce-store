import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { updateOrder } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const raw = await request.text()
  const secret = process.env.REVOLUT_WEBHOOK_SIGNING_SECRET
  const signature = request.headers.get('revolut-signature') || request.headers.get('x-revolut-signature')
  const timestamp = request.headers.get('revolut-request-timestamp') || request.headers.get('x-revolut-request-timestamp')
  if (!secret) return NextResponse.json({ error: 'REVOLUT_WEBHOOK_SIGNING_SECRET is required' }, { status: 503 })
  if (!signature || !timestamp || !/^\d+$/.test(timestamp)) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  const age = Date.now() - Number(timestamp) * 1000
  if (!Number.isFinite(age) || Math.abs(age) > 300000) return NextResponse.json({ error: 'Expired webhook' }, { status: 401 })
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex')
  const provided = signature.replace(/^v\d+=/, '').trim()
  if (!/^[a-f0-9]+$/i.test(provided) || provided.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'))) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  try {
    const event = JSON.parse(raw)
    const type = event.event || event.type
    const revolutId = event.order_id || event.order?.id
    const updates: Record<string, Record<string, unknown>> = {
      ORDER_AUTHORISED: { payment_status: 'pending', status: 'processing' },
      ORDER_COMPLETED: { payment_status: 'paid', status: 'completed' },
      ORDER_FAILED: { payment_status: 'failed', status: 'cancelled' },
      ORDER_CANCELLED: { payment_status: 'failed', status: 'cancelled' },
      ORDER_REFUNDED: { payment_status: 'refunded', status: 'refunded' },
    }
    if (revolutId && updates[type]) await updateOrderByRevolut(revolutId, updates[type])
    return NextResponse.json({ received: true })
  } catch { return NextResponse.json({ error: 'Invalid payload' }, { status: 400 }) }
}

async function updateOrderByRevolut(revolutId: string, values: Record<string, unknown>) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error('Supabase configuration is missing')
  await fetch(`${url}/rest/v1/orders?revolut_order_id=eq.${encodeURIComponent(revolutId)}&payment_status=not.in.(paid,refunded)`, { method: 'PATCH', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(values), cache: 'no-store' })
}
