import { supabaseAdmin } from '@/lib/db'
import { notFound } from 'next/navigation'
import BookingClient from '@/components/BookingClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface BookingPageProps {
  params: {
    bookingLink: string
  }
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { bookingLink } = params
  
  const { data: user } = await supabaseAdmin
    .from('profiles')
    .select(`
      *,
      availabilities (*),
      bookings (booking_date, duration)
    `)
    .eq('booking_link', bookingLink)
    .gte('bookings.booking_date', new Date().toISOString())
    .single()

  if (!user) notFound()

  // Supabase возвращает snake_case, приводим к ожидаемому формату клиента
  const lawyer = {
    ...user,
    availabilities: (user.availabilities || []).map((a: any) => ({
      ...a,
      dayOfWeek: a.day_of_week ?? a.dayOfWeek,
      startTime: a.start_time ?? a.startTime,
      endTime: a.end_time ?? a.endTime,
    })),
    bookings: (user.bookings || []).map((b: any) => ({
      ...b,
      bookingDate: b.booking_date ?? b.bookingDate,
    })),
  }

  return <BookingClient lawyer={lawyer as any} />
}
