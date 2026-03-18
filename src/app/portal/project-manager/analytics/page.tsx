import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { AnalyticsClient } from '@/components/portal/project-manager/analytics/AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, project_type, status')
    .eq('project_manager_id', user!.id)
    .single()

  if (!project) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">אנליטיקה</h1>
        <p className="text-muted-foreground">לא שויכת לפרויקט.</p>
      </div>
    )
  }

  const admin = getSupabaseAdminClient()

  const { data: buildings } = await admin
    .from('buildings')
    .select('*')
    .eq('project_id', project.id)

  const buildingIds = buildings?.map(b => b.id) ?? []

  const [{ data: apartments }, { data: milestones }, { data: documents }] = await Promise.all([
    buildingIds.length > 0
      ? admin.from('apartments').select('*').in('building_id', buildingIds)
      : Promise.resolve({ data: [] }),
    admin.from('project_milestones').select('*').eq('project_id', project.id).order('sort_order'),
    admin.from('documents').select('status').eq('project_id', project.id),
  ])

  return (
    <AnalyticsClient
      project={project}
      buildings={buildings ?? []}
      apartments={apartments ?? []}
      milestones={milestones ?? []}
      documents={documents ?? []}
    />
  )
}
