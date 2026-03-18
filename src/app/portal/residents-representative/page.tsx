import { getSupabaseServerClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/shared/StatusBadge'
import Link from 'next/link'

export default async function ResidentsRepresentativeDashboard() {
  const supabase = await getSupabaseServerClient()

  const [{ data: projects }, { data: pendingDocs }] = await Promise.all([
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('documents').select('*').eq('source', 'resident').eq('status', 'pending_review'),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">לוח בקרה — נציג דיירים</h1>
        <p className="text-muted-foreground mt-1">סקירת מצב הפרויקט ומסמכי הדיירים</p>
      </div>

      {/* Pending docs summary */}
      {pendingDocs && pendingDocs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h2 className="text-xl font-bold text-amber-900 mb-2">
            מסמכים הממתינים לאישור ({pendingDocs.length})
          </h2>
          <p className="text-base text-amber-800">
            יש מסמכים שהדיירים העלו ומחכים לביקורת. פנו למפקח הדיירים לאישור.
          </p>
        </div>
      )}

      {/* Projects */}
      <section>
        <h2 className="text-xl font-bold mb-4">הפרויקטים שלי</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(projects ?? []).map(project => (
            <Link
              key={project.id}
              href={`/portal/residents-representative/projects/${project.id}`}
              className="block bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow"
            >
              <p className="text-lg font-bold">{project.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{project.status}</p>
            </Link>
          ))}
        </div>
        {(!projects || projects.length === 0) && (
          <p className="text-center text-muted-foreground py-12">אין פרויקטים משויכים</p>
        )}
      </section>
    </div>
  )
}
