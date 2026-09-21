import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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
