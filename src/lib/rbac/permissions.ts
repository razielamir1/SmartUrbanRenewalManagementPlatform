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

// ─── Hebrew role labels ────────────────────────────────────────────────────
export const ROLE_LABELS_HE: Record<UserRole, string> = {
  admin:                   'מנהל מערכת',
  resident:                'דייר',
  residents_representative: 'נציג דיירים',
  residents_lawyer:        'עו"ד דיירים',
  residents_supervisor:    'מפקח מטעם הדיירים',
  developer:               'יזם',
  developer_lawyer:        'עו"ד יזם',
  developer_supervisor:    'מפקח מטעם היזם',
}

export const ROLE_LABELS_EN: Record<UserRole, string> = {
  admin:                   'System Admin',
  resident:                'Resident',
  residents_representative: "Residents' Representative",
  residents_lawyer:        "Residents' Lawyer",
  residents_supervisor:    "Residents' Supervisor",
  developer:               'Developer',
  developer_lawyer:        "Developer's Lawyer",
  developer_supervisor:    "Developer's Supervisor",
}

// ─── Permission matrix ─────────────────────────────────────────────────────
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

  // ── Resident side ─────────────────────────────────────────────────────────
  resident: {
    apartment:           ['read'],
    document_resident:   ['read', 'write'],
    document_project:    ['read'],
  },

  residents_representative: {
    // Can view all residents in their building, help with docs
    project:             ['read'],
    building:            ['read'],
    apartment:           ['read'],
    document_resident:   ['read', 'write'],
    document_project:    ['read'],
  },

  residents_lawyer: {
    // Legal review — reads everything for assigned projects
    project:             ['read'],
    building:            ['read'],
    apartment:           ['read'],
    document_resident:   ['read'],
    document_project:    ['read'],
  },

  residents_supervisor: {
    // Oversight on behalf of residents — can approve docs
    project:             ['read'],
    building:            ['read'],
    apartment:           ['read'],
    document_resident:   ['read', 'approve'],
    document_project:    ['read'],
    document_approval:   ['approve'],
    milestone:           ['read'],
  },

  // ── Developer side ────────────────────────────────────────────────────────
  developer: {
    project:             ['read'],
    building:            ['read'],
    apartment:           ['read'],
    document_resident:   ['read'],
    document_project:    ['read', 'write'],
    milestone:           ['read', 'write'],
  },

  developer_lawyer: {
    // Legal counsel for developer — reads project docs
    project:             ['read'],
    building:            ['read'],
    document_resident:   ['read'],
    document_project:    ['read'],
  },

  developer_supervisor: {
    // Project supervisor on behalf of developer
    project:             ['read'],
    building:            ['read'],
    apartment:           ['read'],
    document_resident:   ['read'],
    document_project:    ['read', 'write'],
    milestone:           ['read', 'write'],
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
    admin:                   '/portal/admin',
    resident:                '/portal/resident',
    residents_representative: '/portal/residents-representative',
    residents_lawyer:        '/portal/residents-lawyer',
    residents_supervisor:    '/portal/residents-supervisor',
    developer:               '/portal/developer',
    developer_lawyer:        '/portal/developer-lawyer',
    developer_supervisor:    '/portal/developer-supervisor',
  }
  return map[role]
}

// ─── Portal route prefix → required role ──────────────────────────────────
export const PORTAL_ROLE_MAP: Record<string, UserRole> = {
  '/portal/admin':                    'admin',
  '/portal/resident':                 'resident',
  '/portal/residents-representative': 'residents_representative',
  '/portal/residents-lawyer':         'residents_lawyer',
  '/portal/residents-supervisor':     'residents_supervisor',
  '/portal/developer':                'developer',
  '/portal/developer-lawyer':         'developer_lawyer',
  '/portal/developer-supervisor':     'developer_supervisor',
}

// ─── Role grouping helpers ─────────────────────────────────────────────────
// Roles that can see all residents' documents
export const ROLES_WITH_FULL_DOC_ACCESS: UserRole[] = [
  'admin', 'residents_supervisor', 'residents_representative',
  'residents_lawyer', 'developer', 'developer_supervisor', 'developer_lawyer',
]

// Roles that can approve documents
export const ROLES_WITH_APPROVAL: UserRole[] = [
  'admin', 'residents_supervisor',
]

// Roles on the "developer" side of the project
export const DEVELOPER_SIDE_ROLES: UserRole[] = [
  'developer', 'developer_lawyer', 'developer_supervisor',
]

// Roles on the "resident" side of the project
export const RESIDENT_SIDE_ROLES: UserRole[] = [
  'resident', 'residents_representative', 'residents_lawyer', 'residents_supervisor',
]
