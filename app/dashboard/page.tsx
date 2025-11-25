import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  // Проверяем роль - если админ, редиректим в админку
  if (session.user.role === 'ADMIN') {
    redirect('/admin')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      availabilities: {
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
      bookings: {
        orderBy: { bookingDate: 'asc' },
      },
    },
  })

  if (!user) {
    redirect('/login')
  }

  return <DashboardClient user={user as any} />
}
