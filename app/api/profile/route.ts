import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { nanoid } from 'nanoid'

export async function POST(req: Request) {
  try {
    const { userId, email, name } = await req.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email,
        name: name || '',
        booking_link: nanoid(10),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Profile creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
