import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

export async function POST(req: Request) {
  try {
    const { userId, name } = await req.json()

    const profile = await prisma.profile.create({
      data: {
        id: userId,
        email: '',
        name,
        bookingLink: nanoid(10),
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка создания профиля' }, { status: 500 })
  }
}
