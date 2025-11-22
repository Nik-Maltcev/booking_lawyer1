import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import BookingClient from '@/components/BookingClient'

interface BookingPageProps {
  params: Promise<{
    bookingLink: string
  }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { bookingLink } = await params
  const user = await prisma.user.findUnique({
    where: {
      bookingLink: bookingLink,
    },
    include: {
      availabilities: {
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
      bookings: {
        where: {
          bookingDate: {
            gte: new Date(),
          },
        },
        select: {
          bookingDate: true,
          duration: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  return <BookingClient lawyer={user as any} />
}
