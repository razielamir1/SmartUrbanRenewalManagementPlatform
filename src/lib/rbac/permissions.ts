import type { UserRole } from '@/lib/supabase/types'

export type Resource =
  | 'project'
  | 'building'
  | 'apartment'
  | 'document_resident'   // personal docs (id_card, tabu, contract)
  | 'document_project'    // developer/municipality docs
  | 'document_approval'   // approve/reject documents
  | 'user_management'
  | 'milestone'
  | 'whatsapp_config'

export type Action = 'read' | 'write' | 'approve' | 'manage'

// ─── Permission matrix ─────────────────────────────────────────────────────
// This is the single source of truth for all access control in the app.
// Components, Server Actions, and Route Handlers should all call canAccess().
const PERMISSIONS: Record<UserRole, Partial<Record<Resource, Action[]>>> = {
  admin: {
    project:             ['read', 'write', 'manage'],
    building:            ['read', 'write', 'manage'],
    apartment:           ['read', 'write', 'manage'],
    document_resident:   ['read', 'write', 'approve', 'manage'],
    document_project:    ['read', 'write', 'approve', 'manage'],
    document_approval:   ['approve', 'manage'],
    user_management:     ['read', 'write', 'manage'],
    milestone:           ['read', 'write', 'manage'],
    whatsapp_config:     ['read', 'write', 'manage'],
  },
  supervisor: {
    project:             ['read'],
    building:            ['read'],
    apartment:           ['read'],
    document_resident:   ['read', 'approve'],
    document_project:    ['read'],
    document_approval:   ['approve'],
    milestone:           ['read'],
  },
  developer: {
    project:             ['read'],
    building:            ['read'],
    apartment:           ['read'],
    document_resident:   ['read'],
    document_project:    ['read', 'write'],
    milestone:           ['read', 'write'],
  },
  lawyer: {
    project:             ['read'],
    building:            ['read'],
    apartment:           ['read'],
    document_resident:   ['read'],
    document_project:    ['read'],
  },
  resident: {
    apartment:           ['read'],
    document_resident:   ['read', 'write'],
    document_project:    ['read'],
  },
}

// ─── canAccess ─────────────────────────────────────────────────────────────
export function canAccess(
  role: UserRole,
  resource: Resource,
  action: Action
): boolean {
  return PERMISSIONS[role]?.[resource]?.includes(action) ?? false
}

// ─── homeRouteForRole ──────────────────────────────────────────────────────
export function homeRouteForRole(role: UserRole): string {
  const map: Record<UserRole, string> = {
    admin:      '/portal/admin',
    supervisor: '/portal/supervisor',
    developer:  '/portal/developer',
    lawyer:     '/portal/lawyer',
    resident:   '/portal/resident',
  }
  return map[role]
}

// ─── Portal route prefix → required role ───────────────────────────────────
export const PORTAL_ROLE_MAP: Record<string, UserRole> = {
  '/portal/admin':      'admin',
  '/portal/supervisor': 'supervisor',
  '/portal/developer':  'developer',
  '/portal/lawyer':     'lawyer',
  '/portal/resident':   'resident',
}
