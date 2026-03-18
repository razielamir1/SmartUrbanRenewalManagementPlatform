import { getSupabaseServerClient } from '@/lib/supabase/server'
import { DocumentHeatMap } from '@/components/portal/admin/DocumentHeatMap'
import { CircularProgress } from '@/components/shared/CircularProgress'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PROJECT_TYPE_LABELS } from '@/lib/supabase/types'

export default async function AdminDashboard() {
  const supabase = await getSupabaseServerClient()

  const [{ data: projects }, { data: buildings }, { data: documents }] = await Promise.all([
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('buildings').select('*'),
    supabase.from('documents').select('*').eq('source', 'resident'),
  ])

  const totalDocs = documents?.length ?? 0
  const approvedDocs = documents?.filter(d => d.status === 'approved').length ?? 0
  const overallProgress = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">לוח בקרה</h1>
        <Link
          href="/portal/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-base font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={20} aria-hidden="true" />
          פרויקט חדש
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="פרויקטים" value={projects?.length ?? 0} />
        <StatCard label="בניינים" value={buildings?.length ?? 0} />
        <StatCard label="מסמכים שאושרו" value={approvedDocs} />
        <div className="bg-card rounded-2xl border border-border p-5 flex flex-col items-center gap-2">
          <CircularProgress value={overallProgress} size={72} label="מסמכים" />
        </div>
      </div>

      {/* Projects list */}
      <section>
        <h2 className="text-xl font-bold mb-4">פרויקטים פעילים</h2>
        {!projects || projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map(project => (
              <Link
                key={project.id}
                href={`/portal/admin/projects/${project.id}`}
                className="block bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow"
              >
                <p className="text-lg font-bold">{project.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{PROJECT_TYPE_LABELS[project.project_type]}</p>
                <p className="text-sm text-muted-foreground mt-1 capitalize">
                  {STATUS_LABELS[project.status] ?? project.status}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Document Heat Map */}
      {buildings && buildings.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">מצב מסמכים — מפת חום</h2>
          <div className="bg-card rounded-2xl border border-border p-5 overflow-x-auto">
            <DocumentHeatMap buildings={buildings} residentDocs={[]} />
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-1">
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="text-base text-muted-foreground">{label}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="text-lg">אין פרויקטים עדיין.</p>
      <Link href="/portal/admin/projects/new" className="text-primary underline mt-2 inline-block text-base">
        צרו את הפרויקט הראשון
      </Link>
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = {
  pre_planning: 'טרום תכנון',
  planning: 'תכנון',
  permits: 'קבלת היתרים',
  construction: 'בנייה',
  finishing: 'גמר',
  key_delivery: 'מסירת מפתחות',
}
