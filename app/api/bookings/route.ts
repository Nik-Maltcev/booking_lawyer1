import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/db'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('lawyer_id', user.id)
      .order('booking_date')

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { lawyerId, clientName, clientEmail, clientPhone, bookingDate, duration } = await request.json()

    if (!lawyerId || !clientName || !clientEmail || !bookingDate || !duration) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        lawyer_id: lawyerId,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        booking_date: bookingDate,
        duration,
        type: 'онлайн-консультация',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}
