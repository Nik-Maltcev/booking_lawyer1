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
    const {
      lawyerId,
      clientName,
      clientEmail,
      clientPhone,
      bookingDate,
      duration,
      status,
      paymentStatus,
      type,
    } = await request.json()

    if (!lawyerId || !bookingDate || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const insertData: Record<string, unknown> = {
      lawyer_id: lawyerId,
      client_name: clientName || 'Личное время',
      client_email: clientEmail || 'busy@local',
      client_phone: clientPhone,
      booking_date: bookingDate,
      duration,
      status: status || 'PENDING',
      payment_status: paymentStatus ?? false,
    }

    // Only add type if provided (column may not exist)
    if (type) {
      insertData.type = type
    }

    console.log('Inserting booking:', insertData)

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Supabase booking insert error:', error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Bookings POST error:', error)
    return NextResponse.json({ error: error?.message || 'Internal Error' }, { status: 500 })
  }
}
