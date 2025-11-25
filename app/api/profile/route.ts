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

    const user = await prisma.user.create({
      data: {
        id: userId,
        email: email,
        name,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json({ error: 'Ошибка создания профиля' }, { status: 500 })
  }
}
