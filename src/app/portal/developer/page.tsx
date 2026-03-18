import { getSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Upload } from 'lucide-react'

export default async function DeveloperDashboard() {
  const supabase = await getSupabaseServerClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">הפרויקטים שלי</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {(projects ?? []).map(project => (
          <div key={project.id} className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <div>
              <p className="text-lg font-bold">{project.name}</p>
              <p className="text-sm text-muted-foreground capitalize">{project.status}</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link
                href={`/portal/developer/projects/${project.id}/milestones`}
                className="inline-flex items-center gap-2 rounded-lg border border-primary text-primary px-4 py-2 text-sm font-medium hover:bg-primary/5 transition-colors"
              >
                עדכון אבני דרך
              </Link>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
                aria-label="העלאת מסמך לפרויקט"
              >
                <Upload size={16} aria-hidden="true" />
                העלאת מסמך
              </button>
            </div>
          </div>
        ))}
      </div>

      {(!projects || projects.length === 0) && (
        <p className="text-center text-muted-foreground text-lg py-12">לא משויך לפרויקטים כרגע</p>
      )}
    </div>
  )
}
