import { NextResponse } from 'next/server'
import { rateLimit, requestAddress } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const limit = rateLimit(`contact:${requestAddress(request)}`, 5, 60_000)
  if (!limit.allowed) return NextResponse.json({ error: 'Твърде много опити. Моля, изчакайте.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } })
  try {
    const body = await request.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    if (!name || name.length > 100 || !/^\S+@\S+\.\S+$/.test(email) || message.length < 10 || message.length > 5000) {
      return NextResponse.json({ error: 'Моля, проверете въведените данни.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Формата за контакт очаква конфигурирана услуга за изпращане на имейли.' }, { status: 503 })
  } catch {
    return NextResponse.json({ error: 'Невалидна заявка.' }, { status: 400 })
  }
}
