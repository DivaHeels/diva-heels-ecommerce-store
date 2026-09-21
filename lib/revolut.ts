import 'server-only'

const API_VERSION = '2026-04-20'
const baseUrl = process.env.REVOLUT_ENV === 'production' ? 'https://merchant.revolut.com' : 'https://sandbox-merchant.revolut.com'

export async function createRevolutOrder(amount: number, currency: string, reference: string) {
  const secret = process.env.REVOLUT_MERCHANT_SECRET_KEY
  if (!secret) return null
  const response = await fetch(`${baseUrl}/api/orders`, { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json', 'Revolut-Api-Version': API_VERSION }, body: JSON.stringify({ amount, currency, merchant_order_ext_ref: reference }), cache: 'no-store' })
  if (!response.ok) throw new Error('Revolut order creation failed')
  return response.json() as Promise<{ id: string; token?: string; public_id?: string }>
}

export async function getRevolutConfig() { return { configured: Boolean(process.env.REVOLUT_MERCHANT_SECRET_KEY && process.env.REVOLUT_MERCHANT_PUBLIC_KEY), publicKey: process.env.REVOLUT_MERCHANT_PUBLIC_KEY ?? null } }
