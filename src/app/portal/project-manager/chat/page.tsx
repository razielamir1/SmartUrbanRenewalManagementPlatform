import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { AIChatClient } from '@/components/portal/project-manager/chat/AIChatClient'
import { PROJECT_TYPE_LABELS } from '@/lib/supabase/types'

export default async function ChatPage() {
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
        <h1 className="text-3xl font-bold">עוזר AI</h1>
        <p className="text-muted-foreground">לא שויכת לפרויקט.</p>
      </div>
    )
  }

  const admin = getSupabaseAdminClient()
  const { data: apartments } = await admin
    .from('apartments')
    .select('consent_status')
    .in('building_id',
      (await admin.from('buildings').select('id').eq('project_id', project.id)).data?.map(b => b.id) ?? []
    )

  const total = apartments?.length ?? 0
  const signed = apartments?.filter(a => a.consent_status === 'signed').length ?? 0

  const projectContext = {
    name: project.name,
    type: PROJECT_TYPE_LABELS[project.project_type],
    status: project.status,
    consentPct: total > 0 ? Math.round((signed / total) * 100) : 0,
    totalApartments: total,
    signedApartments: signed,
  }

  return (
    <AIChatClient projectContext={projectContext} />
  )
}
