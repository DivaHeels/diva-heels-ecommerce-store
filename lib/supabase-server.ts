import 'server-only'
import type { SupabaseProduct } from '@/lib/products'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

function getConfig() {
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase server configuration is missing.')
  return { supabaseUrl, serviceRoleKey }
}

function headers() {
  const { serviceRoleKey } = getConfig()
  return { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' }
}

function eq(value: string) { return encodeURIComponent(value) }

export async function insertOrder(order: Record<string, unknown>, items: Record<string, unknown>[]) {
  const { supabaseUrl } = getConfig()
  const response = await fetch(`${supabaseUrl}/rest/v1/orders`, { method: 'POST', headers: { ...headers(), Prefer: 'return=representation' }, body: JSON.stringify(order), cache: 'no-store' })
  if (!response.ok) throw new Error(`Unable to create order (${response.status}).`)
  const [created] = await response.json()
  const itemResponse = await fetch(`${supabaseUrl}/rest/v1/order_items`, { method: 'POST', headers: headers(), body: JSON.stringify(items.map((item) => ({ ...item, order_id: created.id }))), cache: 'no-store' })
  if (!itemResponse.ok) throw new Error(`Unable to create order items (${itemResponse.status}).`)
  return created
}

export async function readOrderByIdempotencyKey(idempotencyKey: string) {
  const { supabaseUrl } = getConfig()
  const response = await fetch(`${supabaseUrl}/rest/v1/orders?idempotency_key=eq.${eq(idempotencyKey)}&select=*,order_items(*)&limit=1`, { headers: headers(), cache: 'no-store' })
  if (!response.ok) throw new Error(`Unable to read idempotent order (${response.status}).`)
  const rows = await response.json()
  return rows[0] ?? null
}

export async function updateOrder(id: string, values: Record<string, unknown>) {
  const { supabaseUrl } = getConfig()
  const response = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${eq(id)}`, { method: 'PATCH', headers: { ...headers(), Prefer: 'return=minimal' }, body: JSON.stringify(values), cache: 'no-store' })
  if (!response.ok) throw new Error(`Unable to update order (${response.status}).`)
}

export async function updateOrderByRevolutId(revolutOrderId: string, values: Record<string, unknown>) {
  const { supabaseUrl } = getConfig()
  const response = await fetch(`${supabaseUrl}/rest/v1/orders?revolut_order_id=eq.${eq(revolutOrderId)}`, { method: 'PATCH', headers: { ...headers(), Prefer: 'return=minimal' }, body: JSON.stringify(values), cache: 'no-store' })
  if (!response.ok) throw new Error(`Unable to update Revolut order (${response.status}).`)
}

export async function readOrderByRevolutId(revolutOrderId: string) {
  const { supabaseUrl } = getConfig()
  const response = await fetch(`${supabaseUrl}/rest/v1/orders?revolut_order_id=eq.${eq(revolutOrderId)}&select=*&limit=1`, { headers: headers(), cache: 'no-store' })
  if (!response.ok) throw new Error(`Unable to read Revolut order (${response.status}).`)
  const rows = await response.json()
  return rows[0] ?? null
}

export async function insertPaymentEvent(event: { revolut_event_id: string; order_id?: string | null; event_type: string; payload: unknown }) {
  const { supabaseUrl } = getConfig()
  const response = await fetch(`${supabaseUrl}/rest/v1/payment_events`, { method: 'POST', headers: { ...headers(), Prefer: 'return=representation,resolution=ignore-duplicates' }, body: JSON.stringify({ ...event, order_id: event.order_id ?? null }), cache: 'no-store' })
  if (!response.ok) throw new Error(`Unable to store payment event (${response.status}).`)
  const rows = await response.json().catch(() => [])
  return !Array.isArray(rows) || rows.length === 0
}

export async function readActiveProducts(): Promise<SupabaseProduct[]> {
  const { supabaseUrl } = getConfig()
  const response = await fetch(`${supabaseUrl}/rest/v1/products?active=eq.true&order=created_at.desc`, { headers: headers(), cache: 'no-store' })
  if (!response.ok) throw new Error('Unable to read products.')
  return response.json()
}

export async function readActiveProductsBySlugs(slugs: string[]): Promise<SupabaseProduct[]> {
  const { supabaseUrl } = getConfig()
  const encoded = slugs.map((slug) => `"${slug.replaceAll('"', '')}"`).join(',')
  const response = await fetch(`${supabaseUrl}/rest/v1/products?active=eq.true&slug=in.(${encodeURIComponent(encoded)})`, { headers: headers(), cache: 'no-store' })
  if (!response.ok) throw new Error('Unable to validate products.')
  return response.json()
}

export async function readOrder(id: string, publicAccessTokenHash?: string) {
  const { supabaseUrl } = getConfig()
  const accessFilter = publicAccessTokenHash ? `&public_access_token_hash=eq.${eq(publicAccessTokenHash)}` : ''
  const response = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${eq(id)}${accessFilter}&select=*,order_items(*)&limit=1`, { headers: headers(), cache: 'no-store' })
  if (!response.ok) throw new Error('Unable to read order.')
  const rows = await response.json()
  return rows[0] ?? null
}
