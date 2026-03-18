import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/lib/supabase/types'

const VALID_ROLES: UserRole[] = [
  'admin', 'resident', 'residents_representative',
  'residents_lawyer', 'residents_supervisor',
  'developer', 'developer_lawyer', 'developer_supervisor',
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
  const { userId, role } = body as { userId?: string; role?: UserRole }

  if (!userId || !role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid userId or role' }, { status: 400 })
  }

  // Update auth.users app_metadata so middleware can read role from JWT
  const { error: authError } = await getSupabaseAdminClient().auth.admin.updateUserById(
    userId,
    { app_metadata: { role } }
  )

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // Also update public.users table for querying
  const { error: dbError } = await getSupabaseAdminClient()
    .from('users')
    .update({ role })
    .eq('id', userId)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, userId, role })
}
