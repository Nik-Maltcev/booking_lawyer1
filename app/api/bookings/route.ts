import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Получить все записи текущего пользователя
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const bookings = await prisma.booking.findMany({
      where: {
        lawyerId: session.user.id,
      },
      orderBy: {
        bookingDate: 'asc',
      },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('GET BOOKINGS ERROR', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// Создать новую запись (публичный эндпоинт для клиентов)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lawyerId, clientName, clientEmail, clientPhone, bookingDate, duration } = body

    if (!lawyerId || !clientName || !clientEmail || !bookingDate || !duration) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const booking = await prisma.booking.create({
      data: {
        lawyerId,
        clientName,
        clientEmail,
        clientPhone,
        bookingDate: new Date(bookingDate),
        duration,
        type: 'онлайн-консультация',
      },
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error('CREATE BOOKING ERROR', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
