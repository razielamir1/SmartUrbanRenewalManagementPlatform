'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

// Singleton pattern: reuse the same client across the app
let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function getSupabaseBrowserClient() {
  if (client) return client
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return client
}
