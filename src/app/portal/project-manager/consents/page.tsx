import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { ConsentsClient } from '@/components/portal/project-manager/consents/ConsentsClient'
import type { Building, Apartment } from '@/lib/supabase/types'

export default async function ConsentsPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, project_type')
    .eq('project_manager_id', user!.id)
    .single()

  if (!project) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">מעקב חתימות</h1>
        <p className="text-muted-foreground">לא שויכת לפרויקט.</p>
      </div>
    )
  }

  const admin = getSupabaseAdminClient()

  const { data: buildings } = await admin
    .from('buildings')
    .select('*')
    .eq('project_id', project.id)
    .order('address')

  const buildingIds = buildings?.map(b => b.id) ?? []

  const { data: apartments } = buildingIds.length > 0
    ? await admin
        .from('apartments')
        .select('*, users:owner_id(full_name)')
        .in('building_id', buildingIds)
        .order('unit_number')
    : { data: [] }

  return (
    <ConsentsClient
      projectId={project.id}
      projectType={project.project_type}
      buildings={(buildings ?? []) as Building[]}
      apartments={(apartments ?? []) as (Apartment & { users: { full_name: string | null } | null })[]}
    />
  )
}
