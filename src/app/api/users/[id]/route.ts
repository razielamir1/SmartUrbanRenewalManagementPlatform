import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'

async function requireAdmin(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  if (user.app_metadata?.role !== 'admin') return null
  return user
}

// GET /api/users/[id] — returns auth details (email) + public profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const caller = await requireAdmin(request)
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = getSupabaseAdminClient()

  const [{ data: authUser, error: authError }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(id),
    admin.from('users').select('full_name, phone').eq('id', id).single(),
  ])

  if (authError || !authUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({
    id,
    email: authUser.user.email,
    full_name: profile?.full_name ?? null,
    phone: profile?.phone ?? null,
    created_at: authUser.user.created_at,
    last_sign_in: authUser.user.last_sign_in_at,
    must_change_password: authUser.user.app_metadata?.must_change_password ?? false,
  })
}

// PATCH /api/users/[id] — update email, full_name, and/or reset password
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const caller = await requireAdmin(request)
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { email, full_name, new_password } = await request.json()
  const admin = getSupabaseAdminClient()

  // Update auth user (email and/or password)
  const authUpdates: Record<string, unknown> = {}
  if (email) authUpdates.email = email
  if (new_password) {
    if (new_password.length < 8) return NextResponse.json({ error: 'הסיסמא חייבת להכיל לפחות 8 תווים' }, { status: 400 })
    authUpdates.password = new_password
    // Clear must_change_password flag
    authUpdates.app_metadata = { must_change_password: false }
  }

  if (Object.keys(authUpdates).length > 0) {
    const { error } = await admin.auth.admin.updateUserById(id, authUpdates)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update public profile
  if (full_name !== undefined) {
    const { error } = await admin.from('users').update({ full_name }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
