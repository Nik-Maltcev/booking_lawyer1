import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: user, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      *,
      availabilities (*),
      bookings (*)
    `)
    .eq('id', authUser.id)
    .single()

  if (error || !user) {
    console.error('Dashboard user fetch error:', error)
    redirect('/login')
  }
  
  if (user.role === 'ADMIN') redirect('/admin')

  const normalizedUser = {
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

  return <DashboardClient user={normalizedUser as any} />
}