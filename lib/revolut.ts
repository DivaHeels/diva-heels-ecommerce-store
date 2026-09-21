import 'server-only'

const API_VERSION = '2026-08-20'
const production = process.env.REVOLUT_ENV === 'production'
const baseUrl = production ? 'https://merchant.revolut.com' : 'https://sandbox-merchant.revolut.com'

export type RevolutOrder = { id: string; token?: string; public_id?: string }

export async function createRevolutOrder(amountMinor: number, currency: string, reference: string): Promise<RevolutOrder | null> {
  const secret = process.env.REVOLUT_MERCHANT_SECRET_KEY
  if (!secret) return null
  const response = await fetch(`${baseUrl}/api/orders`, { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json', 'Revolut-Api-Version': API_VERSION }, body: JSON.stringify({ amount: amountMinor, currency, merchant_order_ext_ref: reference }), cache: 'no-store' })
  if (!response.ok) throw new Error(`Revolut order creation failed (${response.status})`)
  return response.json() as Promise<RevolutOrder>
}

export function getRevolutConfig() {
  return { configured: Boolean(process.env.REVOLUT_MERCHANT_SECRET_KEY && process.env.REVOLUT_MERCHANT_PUBLIC_KEY), production, publicKey: process.env.REVOLUT_MERCHANT_PUBLIC_KEY ?? null }
}
