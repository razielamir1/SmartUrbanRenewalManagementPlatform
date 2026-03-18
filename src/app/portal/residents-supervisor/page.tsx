import { getSupabaseServerClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/shared/StatusBadge'
import Link from 'next/link'

export default async function ResidentsSupervisorDashboard() {
  const supabase = await getSupabaseServerClient()

  const [{ data: projects }, { data: pendingDocs }, { data: missingDocs }] = await Promise.all([
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('documents').select('*').eq('source', 'resident').eq('status', 'pending_review'),
    supabase.from('documents').select('*').eq('source', 'resident').eq('status', 'missing'),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">לוח בקרה — מפקח מטעם הדיירים</h1>
        <p className="text-muted-foreground mt-1">אישור מסמכים ופיקוח על התקדמות הפרויקט</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-3xl font-bold text-amber-800 tabular-nums">{pendingDocs?.length ?? 0}</p>
          <p className="text-base text-amber-700 mt-1">ממתינים לאישור</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="text-3xl font-bold text-red-800 tabular-nums">{missingDocs?.length ?? 0}</p>
          <p className="text-base text-red-700 mt-1">מסמכים חסרים</p>
        </div>
      </div>

      {/* Pending docs for approval */}
      {pendingDocs && pendingDocs.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-3">מסמכים לאישור</h2>
          <div className="bg-card rounded-2xl border border-border divide-y divide-border">
            {pendingDocs.slice(0, 15).map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-4 gap-4">
                <div>
                  <p className="font-medium">{DOC_TYPE_LABELS[doc.type] ?? doc.type}</p>
                  <p className="text-sm text-muted-foreground">{doc.owner_id?.slice(0, 8)}...</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <StatusBadge status={doc.status} size="sm" />
                  <ApproveButton docId={doc.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      <section>
        <h2 className="text-xl font-bold mb-4">פרויקטים</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(projects ?? []).map(project => (
            <Link
              key={project.id}
              href={`/portal/residents-supervisor/projects/${project.id}`}
              className="block bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow"
            >
              <p className="text-lg font-bold">{project.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{project.status}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function ApproveButton({ docId }: { docId: string }) {
  // Client-side approval will be wired in a future update
  return (
    <span className="text-xs text-primary font-medium underline cursor-pointer">
      אישור
    </span>
  )
}

const DOC_TYPE_LABELS: Record<string, string> = {
  id_card: 'תעודת זהות',
  tabu: 'נסח טאבו',
  signed_contract: 'חוזה חתום',
  permit: 'היתר',
  municipal_approval: 'אישור עירייה',
  construction_plan: 'תוכנית בנייה',
}
