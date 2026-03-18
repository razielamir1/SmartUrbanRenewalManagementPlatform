import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('project_id')
  if (!projectId) return NextResponse.json({ buildings: [] })

  const { data: buildings } = await supabase
    .from('buildings')
    .select('id, address, building_number')
    .eq('project_id', projectId)
    .order('address')

  return NextResponse.json({ buildings: buildings ?? [] })
}
