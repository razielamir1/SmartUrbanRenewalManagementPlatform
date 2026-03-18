import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProjectTimeline } from '@/components/shared/ProjectTimeline'
import { WhatsAppButton } from '@/components/shared/WhatsAppButton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import Link from 'next/link'
import type { Milestone } from '@/lib/supabase/types'

export default async function ResidentDashboard() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get the resident's apartment + building + project
  const { data: apartment } = await supabase
    .from('apartments')
    .select('*, buildings(*, projects(*))')
    .eq('owner_id', user.id)
    .single()

  const building = apartment ? (apartment as { buildings: Record<string, unknown> }).buildings as Record<string, unknown> : null
  const project = building ? (building as { projects: Record<string, unknown> }).projects as Record<string, unknown> : null

  // Get documents for this resident
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_id', user.id)
    .eq('source', 'resident')

  // Get milestones for the project
  const milestones: Milestone[] = []
  if (project) {
    const { data } = await supabase
      .from('project_milestones')
      .select('*')
      .eq('project_id', (project as { id: string }).id)
      .order('sort_order')
    if (data) milestones.push(...data)
  }

  const requiredDocs = ['id_card', 'tabu', 'signed_contract'] as const
  const missingDocs = requiredDocs.filter(type =>
    !documents?.find(d => d.type === type && d.status !== 'missing')
  )

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">שלום{user.email ? ` 👋` : ''}</h1>

      {/* Apartment summary */}
      {apartment && building && project && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <h2 className="text-xl font-bold">{(project as { name: string }).name}</h2>
          <p className="text-base text-muted-foreground">
            {(building as { address: string }).address} — דירה {apartment.unit_number}
          </p>
          {(building as { building_whatsapp_link?: string }).building_whatsapp_link && (
            <WhatsAppButton
              link={(building as { building_whatsapp_link: string }).building_whatsapp_link}
              label="קבוצת הווצאפ של הבניין שלי"
            />
          )}
          {(project as { global_whatsapp_link?: string }).global_whatsapp_link && (
            <WhatsAppButton
              link={(project as { global_whatsapp_link: string }).global_whatsapp_link}
              label="קבוצת הווצאפ של הפרויקט"
              size="sm"
            />
          )}
        </div>
      )}

      {/* Missing docs alert */}
      {missingDocs.length > 0 && (
        <div role="alert" className="bg-red-50 border-2 border-red-400 rounded-2xl p-5 space-y-3">
          <h2 className="text-xl font-bold text-red-900">נדרשת פעולה מצדכם</h2>
          <p className="text-base text-red-800">
            חסרים {missingDocs.length} מסמכים. אנא העלו אותם בהקדם האפשרי.
          </p>
          <Link
            href="/portal/resident/documents"
            className="inline-block rounded-xl bg-red-600 text-white px-5 py-2.5 text-base font-semibold hover:bg-red-700 transition-colors"
          >
            העלאת מסמכים
          </Link>
        </div>
      )}

      {/* Documents summary */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">המסמכים שלי</h2>
          <Link href="/portal/resident/documents" className="text-primary underline text-base">
            כל המסמכים
          </Link>
        </div>
        <div className="grid gap-3">
          {requiredDocs.map(type => {
            const doc = documents?.find(d => d.type === type)
            return (
              <div key={type} className="flex items-center justify-between bg-card rounded-xl border border-border p-4">
                <span className="text-base font-medium">{DOC_LABELS[type]}</span>
                <StatusBadge status={doc?.status ?? 'missing'} />
              </div>
            )
          })}
        </div>
      </section>

      {/* Project timeline */}
      {milestones.length > 0 && project && (
        <section>
          <h2 className="text-xl font-bold mb-4">שלבי הפרויקט</h2>
          <div className="bg-card rounded-2xl border border-border p-5">
            <ProjectTimeline
              milestones={milestones}
              currentStage={(project as { status: string }).status as Milestone['stage']}
            />
          </div>
        </section>
      )}
    </div>
  )
}

const DOC_LABELS: Record<string, string> = {
  id_card: 'תעודת זהות',
  tabu: 'נסח טאבו',
  signed_contract: 'חוזה חתום',
}
