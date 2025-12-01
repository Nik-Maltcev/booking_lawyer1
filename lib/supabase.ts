// Client-only Supabase instance
'use client'

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

let authListenerAttached = false

export function setupSupabaseAuthListener() {
  if (authListenerAttached || typeof window === 'undefined') return
  authListenerAttached = true

  const callbackUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/auth/callback`
      : process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`
        : null

  if (!callbackUrl) return

  supabase.auth.onAuthStateChange((event, session) => {
    fetch(callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ event, session }),
    }).catch((error) => {
      console.error('Auth callback error:', error)
    })
  })
}
