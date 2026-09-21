import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const required = ['firstName', 'lastName', 'email', 'phone', 'city', 'postalCode', 'address']
    const missing = required.filter((field) => typeof body?.[field] !== 'string' || !body[field].trim())

    if (missing.length) {
      return NextResponse.json({ error: 'Моля, попълнете всички задължителни полета.' }, { status: 400 })
    }

    if (body.country !== 'България') {
      return NextResponse.json({ error: 'Доставката е налична само за България.' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Плащането не е конфигурирано. Не са свързани база данни и Revolut Merchant.' },
      { status: 503 },
    )
  } catch {
    return NextResponse.json({ error: 'Невалидна заявка.' }, { status: 400 })
  }
}
