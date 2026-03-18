import { getSupabaseServerClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/shared/StatusBadge'
import Link from 'next/link'

export default async function SupervisorDashboard() {
  const supabase = await getSupabaseServerClient()

  const [{ data: projects }, { data: missingDocs }] = await Promise.all([
    supabase.from('projects').select('*, buildings(count)').order('created_at', { ascending: false }),
    supabase.from('documents').select('*, users!owner_id(full_name)').eq('source', 'resident').eq('status', 'missing'),
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">סקירה כללית</h1>

      {/* Missing docs alert */}
      {missingDocs && missingDocs.length > 0 && (
        <section className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <h2 className="text-xl font-bold text-red-900 mb-3">
            מסמכים חסרים ({missingDocs.length})
          </h2>
          <div className="space-y-2">
            {missingDocs.slice(0, 10).map(doc => (
              <div key={doc.id} className="flex items-center justify-between gap-4 bg-white rounded-xl p-3">
                <span className="text-base">
                  {(doc as { users: { full_name: string } | null }).users?.full_name ?? 'דייר לא ידוע'}
                </span>
                <StatusBadge status="missing" size="sm" />
              </div>
            ))}
            {missingDocs.length > 10 && (
              <p className="text-sm text-red-700 text-center pt-1">ועוד {missingDocs.length - 10} מסמכים חסרים...</p>
            )}
          </div>
        </section>
      )}

      {/* Projects */}
      <section>
        <h2 className="text-xl font-bold mb-4">כל הפרויקטים</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(projects ?? []).map(project => (
            <Link
              key={project.id}
              href={`/portal/supervisor/projects/${project.id}`}
              className="block bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow"
            >
              <p className="text-lg font-bold">{project.name}</p>
              <p className="text-sm text-muted-foreground mt-1 capitalize">{project.status}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
