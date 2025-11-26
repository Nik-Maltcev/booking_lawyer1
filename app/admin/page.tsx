import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminClient from '@/components/AdminClient'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export default async function AdminPage() {
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

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const currentUser = await prisma.profile.findUnique({
    where: { id: authUser.id },
  })

  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const users = await prisma.profile.findMany({
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
