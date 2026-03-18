import { getSupabaseServerClient } from '@/lib/supabase/server'
import { UserRoleManager } from './UserRoleManager'

export default async function UsersPage() {
  const supabase = await getSupabaseServerClient()
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ניהול משתמשים</h1>
      <UserRoleManager users={users ?? []} />
    </div>
  )
}
