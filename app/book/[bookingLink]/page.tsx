import { supabaseAdmin } from '@/lib/db'
import { notFound } from 'next/navigation'
import BookingClient from '@/components/BookingClient'

interface BookingPageProps {
  params: Promise<{
    bookingLink: string
  }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { bookingLink } = await params
  
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

  return <BookingClient lawyer={user as any} />
}
