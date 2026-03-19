import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// GET /api/tik-binyan?project_id=xxx
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = request.nextUrl.searchParams.get('project_id')
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 })

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('tik_binyan')
    .select('id, municipality, municipality_url, search_type, file_number, request_number, address, gush, helka, parsed_data, sync_status, sync_error, last_sync_at, created_at')
    .eq('project_id', projectId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tikBinyan: data })
}

// POST /api/tik-binyan — create or update tik config
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role as string | undefined
  if (role !== 'admin' && role !== 'project_manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as {
    projectId: string
    municipality: string
    search_type: string
    file_number?: string
    request_number?: string
    address?: string
    gush?: string
    helka?: string
    municipality_url?: string
  }

  if (!body.projectId || !body.municipality) {
    return NextResponse.json({ error: 'projectId and municipality required' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()

  // Upsert — one tik per project
  const { data: existing } = await admin
    .from('tik_binyan')
    .select('id')
    .eq('project_id', body.projectId)
    .maybeSingle()

  const row = {
    project_id: body.projectId,
    municipality: body.municipality,
    municipality_url: body.municipality_url || null,
    search_type: body.search_type || 'file_number',
    file_number: body.file_number || null,
    request_number: body.request_number || null,
    address: body.address || null,
    gush: body.gush || null,
    helka: body.helka || null,
    sync_status: 'pending' as const,
  }

  if (existing) {
    const { data, error } = await admin.from('tik_binyan').update(row).eq('id', existing.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ tikBinyan: data })
  } else {
    const { data, error } = await admin.from('tik_binyan').insert(row).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ tikBinyan: data }, { status: 201 })
  }
}
