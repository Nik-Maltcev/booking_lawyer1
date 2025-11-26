import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

export async function POST(req: Request) {
  try {
    const { userId, name, email } = await req.json()

    const profile = await prisma.profile.create({
      data: {
        id: userId,
        email: email || '',
        name: name || '',
        bookingLink: nanoid(10),
      },
    })

    return NextResponse.json(profile)
  } catch (error: any) {
    console.error('Profile creation error:', error)
    return NextResponse.json({ error: error.message || 'Ошибка создания профиля' }, { status: 500 })
  }
}
