import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ProjectsTable } from '@/components/portal/admin/ProjectsTable'

export default async function AdminProjectsPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = getSupabaseAdminClient()

  // Fetch projects + PM users in parallel
  const [{ data: projects }, { data: pmUsers }] = await Promise.all([
    admin.from('projects').select('id, name, project_type, status, project_manager_id').order('created_at', { ascending: false }),
    admin.from('users').select('id, full_name').eq('role', 'project_manager'),
  ])

  // Build manager name map
  const managerIds = (projects ?? []).map(p => p.project_manager_id).filter((id): id is string => !!id)
  const { data: managers } = managerIds.length > 0
    ? await admin.from('users').select('id, full_name').in('id', managerIds)
    : { data: [] }
  const managerMap = Object.fromEntries((managers ?? []).map(m => [m.id, m.full_name ?? '']))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">פרויקטים</h1>
        <Link
          href="/portal/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-base font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={20} aria-hidden="true" />
          פרויקט חדש
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">אין פרויקטים עדיין.</p>
          <Link href="/portal/admin/projects/new" className="text-primary underline mt-2 inline-block">
            צרו את הפרויקט הראשון
          </Link>
        </div>
      ) : (
        <ProjectsTable
          projects={projects}
          managerMap={managerMap}
          projectManagers={pmUsers ?? []}
        />
      )}
    </div>
  )
}
