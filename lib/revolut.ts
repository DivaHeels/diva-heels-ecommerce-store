import 'server-only'

const API_VERSION = '2026-08-17'
const production = process.env.REVOLUT_ENV === 'production'
const baseUrl = production ? 'https://merchant.revolut.com' : 'https://sandbox-merchant.revolut.com'

export type RevolutOrder = {
  id: string
  token?: string
  checkout_url?: string
  state?: string
  amount?: number
  currency?: string
}

function getSecret() {
  const secret = process.env.REVOLUT_MERCHANT_SECRET_KEY
  if (!secret) throw new Error('Revolut Merchant secret is not configured.')
  return secret
}

function getProductionSiteUrl() {
  const siteUrl = process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  if (!siteUrl || !/^https:\/\//.test(siteUrl)) throw new Error('Public site URL is not configured.')
  return siteUrl.replace(/\/$/, '')
}

async function revolutFetch(path: string, init?: RequestInit) {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecret()}`,
      'Content-Type': 'application/json',
      'Revolut-Api-Version': API_VERSION,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
}

export async function createRevolutOrder(amountMinor: number, currency: string, reference: string, orderId: string, confirmationToken: string): Promise<RevolutOrder> {
  const redirectUrl = `${getProductionSiteUrl()}/order-confirmation/${encodeURIComponent(orderId)}?token=${encodeURIComponent(confirmationToken)}`
  const response = await revolutFetch('/api/orders', { method: 'POST', body: JSON.stringify({ amount: amountMinor, currency, merchant_order_data: { reference }, redirect_url: redirectUrl }) })
  if (!response.ok) throw new Error(`Revolut order creation failed (${response.status})`)
  const order = await response.json() as RevolutOrder
  if (!order.id || !order.checkout_url) throw new Error('Revolut order did not return a checkout_url.')
  return order
}

export async function retrieveRevolutOrder(revolutOrderId: string) {
  const response = await revolutFetch(`/api/orders/${encodeURIComponent(revolutOrderId)}`, { method: 'GET' })
  if (!response.ok) throw new Error(`Revolut order retrieve failed (${response.status})`)
  return response.json() as Promise<RevolutOrder>
}

export function getRevolutConfig() {
  return { configured: Boolean(process.env.REVOLUT_MERCHANT_SECRET_KEY), production, publicKey: process.env.REVOLUT_MERCHANT_PUBLIC_KEY ?? null }
}
