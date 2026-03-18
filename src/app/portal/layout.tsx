import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { SideNav } from '@/components/shared/SideNav'
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
    <div className="flex min-h-screen bg-background">
      <SideNav
        role={(profile?.role as UserRole) ?? null}
        userName={profile?.full_name ?? null}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
