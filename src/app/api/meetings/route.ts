import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createMeetingSchema = z.object({
  projectId:   z.string().uuid(),
  title:       z.string().min(1),
  description: z.string().optional(),
  start_time:  z.string().datetime(),
  end_time:    z.string().datetime(),
  location:    z.string().optional(),
}).refine(d => new Date(d.end_time) > new Date(d.start_time), {
  message: 'שעת הסיום חייבת להיות לאחר שעת ההתחלה',
  path: ['end_time'],
})

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = request.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId נדרש' }, { status: 400 })

  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('project_id', projectId)
    .order('start_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ meetings: data })
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role as string | undefined
  if (role !== 'project_manager' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createMeetingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'שגיאת קלט' }, { status: 400 })
  }

  const { projectId, title, description, start_time, end_time, location } = parsed.data

  const { data, error } = await supabase.from('meetings').insert({
    project_id: projectId,
    title,
    description: description ?? null,
    start_time,
    end_time,
    location: location ?? null,
    created_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ meeting: data }, { status: 201 })
}
