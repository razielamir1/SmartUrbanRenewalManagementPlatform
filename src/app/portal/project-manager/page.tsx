import { getSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, FileText, Building2, BookUser, CalendarDays } from 'lucide-react'

export default async function ProjectManagerDashboard() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: project } = await supabase
    .from('projects')
    .select('*, buildings(count)')
    .eq('project_manager_id', user!.id)
    .single()

  if (!project) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">לוח בקרה — מנהל פרויקט</h1>
          <p className="text-muted-foreground mt-1">עדיין לא שויכת לפרויקט. פנה למנהל המערכת.</p>
        </div>
      </div>
    )
  }

  const buildingCount = Array.isArray(project.buildings)
    ? project.buildings.length
    : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">לוח בקרה — מנהל פרויקט</h1>
        <p className="text-muted-foreground mt-1">ניהול הפרויקט שלך</p>
      </div>

      {/* Project card */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div>
          <p className="text-2xl font-bold">{project.name}</p>
          <p className="text-muted-foreground capitalize mt-1">{project.status}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 size={16} aria-hidden="true" />
          <span>{buildingCount} בניינים</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Link
          href="/portal/project-manager/team"
          className="flex items-center gap-4 bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow"
        >
          <div className="p-3 bg-primary/10 rounded-xl">
            <Users size={24} className="text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-lg">ניהול צוות</p>
            <p className="text-sm text-muted-foreground">הוסף דיירים, עורכי דין, מפקחים</p>
          </div>
        </Link>

        <Link
          href="/portal/project-manager/docs"
          className="flex items-center gap-4 bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow"
        >
          <div className="p-3 bg-primary/10 rounded-xl">
            <FileText size={24} className="text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-lg">מסמכים</p>
            <p className="text-sm text-muted-foreground">העלאה וסקירת מסמכי הפרויקט</p>
          </div>
        </Link>

        <Link
          href="/portal/project-manager/contacts"
          className="flex items-center gap-4 bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow"
        >
          <div className="p-3 bg-primary/10 rounded-xl">
            <BookUser size={24} className="text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-lg">אנשי קשר</p>
            <p className="text-sm text-muted-foreground">ייבוא, ניהול, והזמנות WhatsApp</p>
          </div>
        </Link>

        <Link
          href="/portal/project-manager/meetings"
          className="flex items-center gap-4 bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-shadow"
        >
          <div className="p-3 bg-primary/10 rounded-xl">
            <CalendarDays size={24} className="text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-lg">פגישות</p>
            <p className="text-sm text-muted-foreground">קביעת פגישות ויצוא ליומן</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
