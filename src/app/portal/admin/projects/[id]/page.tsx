import { notFound } from 'next/navigation'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ProjectDetailClient } from '@/components/portal/admin/ProjectDetail/ProjectDetailClient'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const auth = await getSupabaseServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) notFound()

  const admin = getSupabaseAdminClient()

  const [
    { data: project },
    { data: buildings },
    { data: milestones },
    { data: documents },
    { data: meetings },
    { data: teamMembers },
    { data: contacts },
  ] = await Promise.all([
    admin.from('projects').select('*').eq('id', id).single(),
    admin.from('buildings').select('*').eq('project_id', id).order('address'),
    admin.from('project_milestones').select('*').eq('project_id', id).order('sort_order'),
    admin.from('documents').select('id, type, status, source, created_at').eq('project_id', id),
    admin.from('meetings').select('*').eq('project_id', id).order('start_time', { ascending: false }),
    admin.from('users').select('id, full_name, role, building_id').eq('project_id', id),
    admin.from('contacts').select('id, full_name, phone_raw').eq('project_id', id),
  ])

  if (!project) notFound()

  const buildingIds = buildings?.map(b => b.id) ?? []
  const { data: apartments } = buildingIds.length > 0
    ? await admin
        .from('apartments')
        .select('id, unit_number, floor, consent_status, building_id, owner_id, consent_notes')
        .in('building_id', buildingIds)
    : { data: [] }

  // PM user details + tik binyan
  const pmId = project.project_manager_id
  const [{ data: pm }, { data: tikBinyan }] = await Promise.all([
    pmId
      ? admin.from('users').select('full_name').eq('id', pmId).single()
      : Promise.resolve({ data: null }),
    admin.from('tik_binyan').select('*').eq('project_id', id).maybeSingle(),
  ])

  return (
    <ProjectDetailClient
      project={project}
      pm={pm}
      buildings={buildings ?? []}
      apartments={apartments ?? []}
      milestones={milestones ?? []}
      documents={documents ?? []}
      meetings={meetings ?? []}
      teamMembers={teamMembers ?? []}
      contacts={contacts ?? []}
      tikBinyan={tikBinyan as import('@/lib/supabase/types').TikBinyanRow | null}
    />
  )
}
