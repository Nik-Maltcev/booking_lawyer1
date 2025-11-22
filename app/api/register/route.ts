import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return new NextResponse('Email и пароль обязательны', { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return new NextResponse('Пользователь с таким email уже существует', {
        status: 400,
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const bookingLink = nanoid(10) // Генерируем уникальную ссылку для записи

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        bookingLink,
      },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        bookingLink: user.bookingLink,
      },
    })
  } catch (error: any) {
    console.error('REGISTRATION ERROR', error)
    return new NextResponse('Внутренняя ошибка сервера', { status: 500 })
  }
}
