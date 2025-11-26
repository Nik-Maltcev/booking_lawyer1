import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/db'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: user } = await supabaseAdmin
    .from('profiles')
    .select(`
      *,
      availabilities (*),
      bookings (*)
    `)
    .eq('id', authUser.id)
    .single()

  if (!user) redirect('/login')
  if (user.role === 'ADMIN') redirect('/admin')

  return <DashboardClient user={user as any} />
}
