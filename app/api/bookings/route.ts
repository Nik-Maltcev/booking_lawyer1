import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

async function getUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const bookings = await prisma.booking.findMany({
      where: { lawyerId: user.id },
      orderBy: { bookingDate: 'asc' },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { lawyerId, clientName, clientEmail, clientPhone, bookingDate, duration } = await request.json()

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
    return new NextResponse('Internal Error', { status: 500 })
  }
}
