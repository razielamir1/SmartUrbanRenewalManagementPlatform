import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ContactsClient } from '@/components/portal/project-manager/contacts/ContactsClient'

export default async function ProjectManagerContactsPage() {
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
        <h1 className="text-3xl font-bold">אנשי קשר</h1>
        <p className="text-muted-foreground">לא משויך לפרויקט. פנה למנהל המערכת.</p>
      </div>
    )
  }

  const { data: buildings } = await supabase
    .from('buildings')
    .select('id, address, building_number')
    .eq('project_id', project.id)
    .order('address')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">אנשי קשר</h1>
        <p className="text-muted-foreground mt-1">פרויקט: {project.name}</p>
      </div>
      <ContactsClient
        projectId={project.id}
        projectName={project.name}
        buildings={buildings ?? []}
      />
    </div>
  )
}
