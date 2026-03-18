import { getSupabaseServerClient } from '@/lib/supabase/server'
import { UserRoleManager } from './UserRoleManager'
import { CreateUserForm } from '@/components/portal/admin/CreateUserForm'

export default async function UsersPage() {
  const supabase = await getSupabaseServerClient()

  const [{ data: users }, { data: projects }] = await Promise.all([
    supabase
      .from('users')
      .select('*, project:project_id(id, name), building:building_id(id, address)')
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name')
      .order('name'),
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">ניהול משתמשים</h1>
      <CreateUserForm />
      <section>
        <h2 className="text-xl font-bold mb-4">משתמשים קיימים</h2>
        <UserRoleManager
          users={(users ?? []) as UserWithRelations[]}
          projects={projects ?? []}
        />
      </section>
    </div>
  )
}

export interface UserWithRelations {
  id: string
  role: string
  full_name: string | null
  phone: string | null
  project_id: string | null
  building_id: string | null
  created_at: string
  updated_at: string
  project: { id: string; name: string } | null
  building: { id: string; address: string } | null
}
