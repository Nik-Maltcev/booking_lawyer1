import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminClient from '@/components/AdminClient'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  // Проверяем, что пользователь - админ
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Получаем всех пользователей с их статистикой
  const users = await prisma.user.findMany({
    where: {
      role: 'USER',
    },
    include: {
      _count: {
        select: {
          bookings: true,
          availabilities: true,
        },
      },
      bookings: {
        select: {
          id: true,
          clientName: true,
          clientEmail: true,
          bookingDate: true,
          status: true,
          paymentStatus: true,
        },
        orderBy: {
          bookingDate: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Общая статистика
  const totalBookings = await prisma.booking.count()
  const paidBookings = await prisma.booking.count({
    where: { paymentStatus: true },
  })

  const stats = {
    totalUsers: users.length,
    totalBookings,
    paidBookings,
    pendingPayments: totalBookings - paidBookings,
  }

  return <AdminClient users={users} stats={stats} />
}
