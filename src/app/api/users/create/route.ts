import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/lib/supabase/types'

const VALID_ROLES: UserRole[] = [
  'admin', 'resident', 'residents_representative',
  'residents_lawyer', 'residents_supervisor',
  'developer', 'developer_lawyer', 'developer_supervisor',
  'project_manager',
]

export async function POST(request: NextRequest) {
  // Verify the caller is an admin
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const callerRole = user.app_metadata?.role as UserRole | undefined
  const isAdmin = callerRole === 'admin'
  const isProjectManager = callerRole === 'project_manager'

  if (!isAdmin && !isProjectManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, password, full_name, role, project_id, building_id } = body as {
    email?: string
    password?: string
    full_name?: string
    role?: UserRole
    project_id?: string
    building_id?: string
  }

  // project_manager cannot create admins or other project_managers
  const MANAGER_ALLOWED_ROLES: UserRole[] = [
    'resident', 'residents_representative', 'residents_lawyer', 'residents_supervisor',
    'developer', 'developer_lawyer', 'developer_supervisor',
  ]
  if (isProjectManager && role && !MANAGER_ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Forbidden role for project manager' }, { status: 403 })
  }

  if (!email || !password || !role || !VALID_ROLES.includes(role)) {
    return NextResponse.json(
      { error: 'email, password, and valid role are required' },
      { status: 400 }
    )
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: 'password must be at least 8 characters' },
      { status: 400 }
    )
  }

  const admin = getSupabaseAdminClient()

  // Create the Supabase Auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role, must_change_password: true },
    user_metadata: { full_name: full_name ?? '' },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  const userId = authData.user.id

  // Insert into public.users (trigger may have already done this — use upsert)
  const { error: dbError } = await admin.from('users').upsert({
    id: userId,
    role,
    full_name: full_name ?? null,
    project_id: project_id ?? null,
    building_id: building_id ?? null,
  })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  // If creating a project_manager, link them to the specified project
  if (role === 'project_manager' && project_id) {
    const { error: projectError } = await admin
      .from('projects')
      .update({ project_manager_id: userId })
      .eq('id', project_id)
    if (projectError) {
      return NextResponse.json({ error: projectError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, userId, email, role })
}
