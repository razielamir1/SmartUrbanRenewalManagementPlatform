import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { PortalShell } from '@/components/shared/PortalShell'
import type { UserRole } from '@/lib/supabase/types'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  return (
    <PortalShell
      role={(profile?.role as UserRole) ?? null}
      userName={profile?.full_name ?? null}
    >
      {children}
    </PortalShell>
  )
}
