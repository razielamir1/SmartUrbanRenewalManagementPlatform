import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { homeRouteForRole, PORTAL_ROLE_MAP } from '@/lib/rbac/permissions'
import type { UserRole } from '@/lib/supabase/types'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Build a mutable response so we can forward refreshed cookies
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — also keeps the access token from going stale
  const { data: { user } } = await supabase.auth.getUser()

  // ── Not logged in → redirect to /login ──────────────────────
  if (!user && pathname.startsWith('/portal')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Read role from JWT app_metadata — zero extra DB call
    const role = user.app_metadata?.role as UserRole | undefined

    // ── No role assigned yet → onboarding ───────────────────
    if (!role && pathname.startsWith('/portal')) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    if (role) {
      // ── First login: force password change ─────────────────
      if (
        user.app_metadata?.must_change_password === true &&
        pathname.startsWith('/portal') &&
        pathname !== '/portal/change-password'
      ) {
        const url = request.nextUrl.clone()
        url.pathname = '/portal/change-password'
        return NextResponse.redirect(url)
      }

      // ── Logged-in user hitting /login → redirect to portal ─
      if (pathname === '/login') {
        const url = request.nextUrl.clone()
        url.pathname = homeRouteForRole(role)
        return NextResponse.redirect(url)
      }

      // ── Wrong portal → redirect to correct one ─────────────
      // Admin with "viewAs" cookie can access any portal
      const viewAs = request.cookies.get('viewAs')?.value
      const isAdminViewAs = role === 'admin' && viewAs

      if (pathname.startsWith('/portal') && !isAdminViewAs) {
        const matchedPrefix = Object.keys(PORTAL_ROLE_MAP).find((p) =>
          pathname.startsWith(p)
        )
        if (matchedPrefix && PORTAL_ROLE_MAP[matchedPrefix] !== role) {
          const url = request.nextUrl.clone()
          url.pathname = homeRouteForRole(role)
          return NextResponse.redirect(url)
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/portal/:path*',
    '/login',
    '/onboarding',
    '/portal/change-password',
  ],
}
