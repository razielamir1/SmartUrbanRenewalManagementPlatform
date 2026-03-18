import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import type { ConsentStatus } from '@/lib/supabase/types'

const schema = z.object({
  apartmentId: z.string().uuid(),
  consentStatus: z.enum(['unsigned', 'unsigned_neutral', 'signed', 'objecting']),
  notes: z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const { apartmentId, consentStatus, notes } = parsed.data
  const admin = getSupabaseAdminClient()

  // Verify user is PM of the project this apartment belongs to
  const { data: apt } = await admin
    .from('apartments')
    .select('building_id, buildings(project_id, projects(project_manager_id))')
    .eq('id', apartmentId)
    .single()

  if (!apt) return NextResponse.json({ error: 'Apartment not found' }, { status: 404 })

  const building = apt.buildings as { project_id: string; projects: { project_manager_id: string | null } | null } | null
  const pmId = building?.projects?.project_manager_id

  // Allow admin or the assigned PM
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && pmId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await admin
    .from('apartments')
    .update({
      consent_status: consentStatus as ConsentStatus,
      consent_notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', apartmentId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
