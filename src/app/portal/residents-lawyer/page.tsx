import { getSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ResidentsLawyerDashboard() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: assignments } = await supabase
    .from('lawyer_project_assignments')
    .select('project_id')
    .eq('lawyer_id', user!.id)

  const projectIds = assignments?.map(a => a.project_id) ?? []
  const { data: projects } = projectIds.length > 0
    ? await supabase.from('projects').select('*').in('id', projectIds)
    : { data: [] }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">לוח בקרה — עו&quot;ד דיירים</h1>
        <p className="text-muted-foreground mt-1">סקירת מסמכים ומצב משפטי של הפרויקטים</p>
      </div>

      {!projects || projects.length === 0 ? (
        <p className="text-center text-muted-foreground text-lg py-12">
          לא משויך לפרויקטים. פנו למנהל המערכת.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map(project => (
            <Link
              key={project.id}
              href={`/portal/residents-lawyer/projects/${project.id}`}
              className="block bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow"
            >
              <p className="text-lg font-bold">{project.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{project.status}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
