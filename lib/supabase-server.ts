import 'server-only'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

function getConfig() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase server configuration is missing.')
  }
  return { supabaseUrl, serviceRoleKey }
}

export async function insertOrder(order: Record<string, unknown>, items: Record<string, unknown>[]) {
  const { supabaseUrl, serviceRoleKey } = getConfig()
  const response = await fetch(`${supabaseUrl}/rest/v1/orders`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(order),
    cache: 'no-store',
  })

  if (!response.ok) throw new Error(`Unable to create order (${response.status}).`)
  const [createdOrder] = await response.json()

  const itemResponse = await fetch(`${supabaseUrl}/rest/v1/order_items`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(items.map((item) => ({ ...item, order_id: createdOrder.id }))),
    cache: 'no-store',
  })

  if (!itemResponse.ok) {
    await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${createdOrder.id}`, {
      method: 'DELETE',
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    })
    throw new Error(`Unable to create order items (${itemResponse.status}).`)
  }

  return createdOrder
}

export async function readActiveProducts() {
  const { supabaseUrl, serviceRoleKey } = getConfig()
  const response = await fetch(`${supabaseUrl}/rest/v1/products?active=eq.true&order=created_at.desc`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Unable to read products (${response.status}).`)
  return response.json()
}

export async function readActiveProductsBySlugs(slugs: string[]) {
  const { supabaseUrl, serviceRoleKey } = getConfig()
  const response = await fetch(`${supabaseUrl}/rest/v1/products?active=eq.true&slug=in.(${slugs.map(encodeURIComponent).join(',')})`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Unable to validate products (${response.status}).`)
  return response.json()
}
