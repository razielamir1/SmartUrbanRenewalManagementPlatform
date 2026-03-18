import { getSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DeveloperLawyerDashboard() {
  const supabase = await getSupabaseServerClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">לוח בקרה — עו&quot;ד יזם</h1>
        <p className="text-muted-foreground mt-1">סקירה משפטית של מסמכי הפרויקט</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(projects ?? []).map(project => (
          <Link
            key={project.id}
            href={`/portal/developer-lawyer/projects/${project.id}`}
            className="block bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow"
          >
            <p className="text-lg font-bold">{project.name}</p>
            <p className="text-sm text-muted-foreground mt-1">{project.status}</p>
          </Link>
        ))}
      </div>

      {(!projects || projects.length === 0) && (
        <p className="text-center text-muted-foreground text-lg py-12">אין פרויקטים משויכים</p>
      )}
    </div>
  )
}
