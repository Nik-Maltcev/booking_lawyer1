import { redirect } from 'next/navigation'
import AdminClient from '@/components/AdminClient'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/db'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: currentUser } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!currentUser || currentUser.role !== 'ADMIN') redirect('/dashboard')

  const { data: users } = await supabaseAdmin
    .from('profiles')
    .select(`
      *,
      bookings (*),
      availabilities (*)
    `)
    .eq('role', 'USER')
    .order('created_at', { ascending: false })

  const { count: totalBookings } = await supabaseAdmin
    .from('bookings')
    .select('*', { count: 'exact', head: true })

  const { count: paidBookings } = await supabaseAdmin
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', true)

  const stats = {
    totalUsers: users?.length || 0,
    totalBookings: totalBookings || 0,
    paidBookings: paidBookings || 0,
    pendingPayments: (totalBookings || 0) - (paidBookings || 0),
  }

  return <AdminClient users={users || []} stats={stats} />
}
