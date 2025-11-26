import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardClient from '@/components/DashboardClient'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export default async function DashboardPage() {
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

  const user = await prisma.profile.findUnique({
    where: { id: authUser.id },
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

  if (user.role === 'ADMIN') {
    redirect('/admin')
  }

  return <DashboardClient user={user as any} />
}
