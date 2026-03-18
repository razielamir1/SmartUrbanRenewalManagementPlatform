'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/supabase/types'

export interface SessionState {
  user: User | null
  role: UserRole | null
  loading: boolean
}

export function useSession(): SessionState {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      setRole((sessionUser?.app_metadata?.role as UserRole) ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const sessionUser = session?.user ?? null
        setUser(sessionUser)
        setRole((sessionUser?.app_metadata?.role as UserRole) ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, role, loading }
}
