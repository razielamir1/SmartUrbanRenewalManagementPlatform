// SERVER-ONLY: This client uses the service role key and bypasses RLS.
// Never import this in Client Components or expose to the browser.
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
