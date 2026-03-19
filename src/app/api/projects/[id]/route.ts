import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.app_metadata?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { project_manager_id } = await request.json() as { project_manager_id: string | null }
  const admin = getSupabaseAdminClient()

  // Get current project to find old PM
  const { data: project } = await admin.from('projects').select('project_manager_id').eq('id', id).single()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const oldPmId = project.project_manager_id

  // Update project's PM
  const { error: projectErr } = await admin.from('projects')
    .update({ project_manager_id: project_manager_id || null })
    .eq('id', id)
  if (projectErr) return NextResponse.json({ error: projectErr.message }, { status: 500 })

  // Unlink old PM from this project
  if (oldPmId && oldPmId !== project_manager_id) {
    await admin.from('users').update({ project_id: null }).eq('id', oldPmId).eq('project_id', id)
  }

  // Link new PM to this project
  if (project_manager_id) {
    await admin.from('users').update({ project_id: id }).eq('id', project_manager_id)
  }

  return NextResponse.json({ ok: true })
}
