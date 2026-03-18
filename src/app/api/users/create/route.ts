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
  if (callerRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, password, full_name, role } = body as {
    email?: string
    password?: string
    full_name?: string
    role?: UserRole
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
    app_metadata: { role },
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
  })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, userId, email, role })
}
