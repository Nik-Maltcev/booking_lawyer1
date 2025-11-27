import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

let authListenerAttached = false

if (!authListenerAttached) {
  authListenerAttached = true

  supabase.auth.onAuthStateChange((event, session) => {
    fetch('/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ event, session }),
    }).catch((error) => {
      console.error('Auth callback error:', error)
    })
  })
}
