import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/lib/supabase/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = profile.data?.role as UserRole
  if (role !== 'admin' && role !== 'project_manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const admin = getSupabaseAdminClient()

  const updates: Record<string, unknown> = {}
  if ('completed' in body) {
    updates.completed_at = body.completed ? new Date().toISOString() : null
  }
  if ('target_date' in body) {
    updates.target_date = body.target_date ?? null
  }

  const { error } = await admin.from('project_milestones').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
