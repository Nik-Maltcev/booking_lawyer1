import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import BookingClient from '@/components/BookingClient'

interface BookingPageProps {
  params: {
    bookingLink: string
  }
}

export default async function BookingPage({ params }: BookingPageProps) {
  const user = await prisma.user.findUnique({
    where: {
      bookingLink: params.bookingLink,
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

  return <BookingClient lawyer={user} />
}
