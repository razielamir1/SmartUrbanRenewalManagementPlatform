import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { RawContact } from '@/lib/contacts/parse-phones'

interface SaveContact extends RawContact {
  building_id: string | null
}

interface SaveBody {
  projectId: string
  contacts: SaveContact[]
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = user.app_metadata?.role as string | undefined
  if (role !== 'project_manager' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json()) as SaveBody
  const { projectId, contacts } = body

  if (!projectId || !Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ error: 'נתונים חסרים' }, { status: 400 })
  }

  // Verify project ownership for project_manager
  if (role === 'project_manager') {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('project_manager_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const admin = getSupabaseAdminClient()
  const rows = contacts.map(c => ({
    project_id: projectId,
    building_id: c.building_id ?? null,
    full_name: c.full_name,
    phone_raw: c.phone_raw,
    phone_wa: c.phone_wa,
    created_by: user.id,
  }))

  const { error } = await admin.from('contacts').insert(rows)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ saved: rows.length })
}
