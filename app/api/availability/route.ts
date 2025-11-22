import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Получить все слоты доступности текущего пользователя
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const availabilities = await prisma.availability.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json(availabilities)
  } catch (error) {
    console.error('GET AVAILABILITY ERROR', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// Создать новый слот доступности
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { dayOfWeek, startTime, endTime, duration } = body

    const availability = await prisma.availability.create({
      data: {
        userId: session.user.id,
        dayOfWeek,
        startTime,
        endTime,
        duration,
      },
    })

    return NextResponse.json(availability)
  } catch (error) {
    console.error('CREATE AVAILABILITY ERROR', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// Удалить слот доступности
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return new NextResponse('ID required', { status: 400 })
    }

    await prisma.availability.delete({
      where: {
        id,
        userId: session.user.id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('DELETE AVAILABILITY ERROR', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
