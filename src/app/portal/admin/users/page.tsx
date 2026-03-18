import { getSupabaseServerClient } from '@/lib/supabase/server'
import { UserRoleManager } from './UserRoleManager'
import { CreateUserForm } from '@/components/portal/admin/CreateUserForm'

export default async function UsersPage() {
  const supabase = await getSupabaseServerClient()
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">ניהול משתמשים</h1>
      <CreateUserForm />
      <section>
        <h2 className="text-xl font-bold mb-4">משתמשים קיימים</h2>
        <UserRoleManager users={users ?? []} />
      </section>
    </div>
  )
}
