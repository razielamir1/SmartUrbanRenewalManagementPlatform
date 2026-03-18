import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/setup/bootstrap-admin
 * One-time endpoint to create the first admin user.
 * Returns 403 if an admin already exists.
 *
 * Body: { "password": "YourSecurePassword123!" }
 * The admin email is fixed to zikiwin@gmail.com.
 */
export async function POST(request: NextRequest) {
  const ADMIN_EMAIL = 'zikiwin@gmail.com'

  const body = await request.json().catch(() => ({}))
  const { password } = body as { password?: string }

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: 'password required (min 8 characters)' },
      { status: 400 }
    )
  }

  const admin = getSupabaseAdminClient()

  // Guard: only run if no admin exists yet
  const { data: existingAdmins } = await admin
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1)

  if (existingAdmins && existingAdmins.length > 0) {
    return NextResponse.json(
      { error: 'Admin already exists. This endpoint is disabled.' },
      { status: 403 }
    )
  }

  // Create the auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password,
    email_confirm: true,
    app_metadata: { role: 'admin' },
    user_metadata: { full_name: 'מנהל ראשי' },
  })

  if (authError) {
    // If user already exists in auth but not in public.users, update instead
    if (authError.message.includes('already been registered')) {
      const { data: existingUser } = await admin.auth.admin.listUsers()
      const found = existingUser?.users?.find(u => u.email === ADMIN_EMAIL)
      if (found) {
        await admin.auth.admin.updateUserById(found.id, {
          app_metadata: { role: 'admin' },
        })
        await admin.from('users').upsert({
          id: found.id,
          role: 'admin',
          full_name: 'מנהל ראשי',
        })
        return NextResponse.json({
          success: true,
          message: 'Existing user promoted to admin.',
          email: ADMIN_EMAIL,
        })
      }
    }
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  const userId = authData.user.id

  // Insert into public.users (trigger may have already done this — use upsert)
  const { error: dbError } = await admin.from('users').upsert({
    id: userId,
    role: 'admin',
    full_name: 'מנהל ראשי',
  })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Admin user created successfully.',
    email: ADMIN_EMAIL,
    userId,
  })
}
