import { getSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  pre_planning:  'טרום תכנון',
  planning:      'תכנון',
  permits:       'קבלת היתרים',
  construction:  'בנייה',
  finishing:     'גמר',
  key_delivery:  'מסירת מפתחות',
}

export default async function AdminProjectsPage() {
  const supabase = await getSupabaseServerClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch manager names separately (avoid join type issues)
  const managerIds = (projects ?? [])
    .map(p => p.project_manager_id)
    .filter((id): id is string => !!id)

  const { data: managers } = managerIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', managerIds)
    : { data: [] }

  const managerMap = Object.fromEntries(
    (managers ?? []).map(m => [m.id, m.full_name])
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">פרויקטים</h1>
        <Link
          href="/portal/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-base font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={20} aria-hidden="true" />
          פרויקט חדש
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">אין פרויקטים עדיין.</p>
          <Link href="/portal/admin/projects/new" className="text-primary underline mt-2 inline-block">
            צרו את הפרויקט הראשון
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-x-auto">
          <table className="w-full text-base min-w-[480px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-start p-4 font-semibold">שם פרויקט</th>
                <th className="text-start p-4 font-semibold">סטטוס</th>
                <th className="text-start p-4 font-semibold">מנהל פרויקט</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => {
                const managerName = project.project_manager_id
                  ? managerMap[project.project_manager_id]
                  : null
                return (
                  <tr key={project.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="p-4 font-medium">{project.name}</td>
                    <td className="p-4 text-muted-foreground">
                      {STATUS_LABELS[project.status] ?? project.status}
                    </td>
                    <td className="p-4">
                      {managerName ? (
                        <span className="text-foreground">{managerName}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">לא משויך</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
