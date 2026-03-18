import { getSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function LawyerDashboard() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch assignments, then fetch projects separately
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
      <h1 className="text-3xl font-bold">הפרויקטים שלי</h1>

      {!projects || projects.length === 0 ? (
        <p className="text-center text-muted-foreground text-lg py-12">
          לא משויך לפרויקטים כרגע. פנו למנהל המערכת להוספת גישה.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map(project => (
            <Link
              key={project.id}
              href={`/portal/lawyer/projects/${project.id}`}
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
