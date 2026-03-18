import { getSupabaseServerClient } from '@/lib/supabase/server'
import { MeetingsClient } from '@/components/portal/project-manager/meetings/MeetingsClient'

export default async function ProjectManagerMeetingsPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('project_manager_id', user!.id)
    .single()

  if (!project) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">פגישות</h1>
        <p className="text-muted-foreground">לא משויך לפרויקט. פנה למנהל המערכת.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">פגישות</h1>
        <p className="text-muted-foreground mt-1">פרויקט: {project.name}</p>
      </div>
      <MeetingsClient projectId={project.id} />
    </div>
  )
}
