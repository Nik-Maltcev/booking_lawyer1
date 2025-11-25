import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

export async function POST(req: Request) {
  try {
    const { userId, email, name } = await req.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Отсутствуют userId или email' },
        { status: 400 }
      )
    }

    const profile = await prisma.profile.create({
      data: {
        id: userId,
        email: email,
        name,
        bookingLink: nanoid(10),
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка создания профиля' }, { status: 500 })
  }
}
