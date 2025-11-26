import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/db'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('availabilities')
      .select('*')
      .eq('user_id', user.id)
      .order('day_of_week')
      .order('start_time')

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { dayOfWeek, startTime, endTime, duration } = await request.json()

    const { data, error } = await supabaseAdmin
      .from('availabilities')
      .insert({
        user_id: user.id,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        duration,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return new NextResponse('ID required', { status: 400 })

    const { error } = await supabaseAdmin
      .from('availabilities')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}
