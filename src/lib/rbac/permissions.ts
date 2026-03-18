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
  | 'contact'
  | 'meeting'

export type Action = 'read' | 'write' | 'approve' | 'manage'

// ─── Hebrew role labels ────────────────────────────────────────────────────
export const ROLE_LABELS_HE: Record<UserRole, string> = {
  admin:                   'מנהל מערכת',
  project_manager:         'מנהל פרויקט',
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
  project_manager:         'Project Manager',
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
    contact:             ['read', 'write', 'manage'],
    meeting:             ['read', 'write', 'manage'],
  },

  // Manages a single assigned project — configures team, tracks milestones, uploads docs
  project_manager: {
    project:             ['read', 'write'],
    building:            ['read', 'write', 'manage'],
    apartment:           ['read', 'write', 'manage'],
    document_resident:   ['read'],
    document_project:    ['read', 'write'],
    document_approval:   ['approve'],
    user_management:     ['read', 'write'],
    milestone:           ['read', 'write', 'manage'],
    whatsapp_config:     ['read', 'write'],
    contact:             ['read', 'write', 'manage'],
    meeting:             ['read', 'write', 'manage'],
  },

  // ── Resident side ─────────────────────────────────────────────────────────
  resident: {
    apartment:           ['read'],
    document_resident:   ['read', 'write'],
    document_project:    ['read'],
  },

  residents_representative: {
    project:             ['read'],
    building:            ['read'],
    apartment:           ['read'],
    document_resident:   ['read', 'write'],
    document_project:    ['read'],
  },

  residents_lawyer: {
    project:             ['read'],
    building:            ['read'],
    apartment:           ['read'],
    document_resident:   ['read'],
    document_project:    ['read'],
  },

  residents_supervisor: {
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
    project:             ['read'],
    building:            ['read'],
    document_resident:   ['read'],
    document_project:    ['read'],
  },

  developer_supervisor: {
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
    project_manager:         '/portal/project-manager',
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
  '/portal/project-manager':          'project_manager',
  '/portal/resident':                 'resident',
  '/portal/residents-representative': 'residents_representative',
  '/portal/residents-lawyer':         'residents_lawyer',
  '/portal/residents-supervisor':     'residents_supervisor',
  '/portal/developer':                'developer',
  '/portal/developer-lawyer':         'developer_lawyer',
  '/portal/developer-supervisor':     'developer_supervisor',
}

// ─── Role grouping helpers ─────────────────────────────────────────────────
export const ROLES_WITH_FULL_DOC_ACCESS: UserRole[] = [
  'admin', 'project_manager', 'residents_supervisor', 'residents_representative',
  'residents_lawyer', 'developer', 'developer_supervisor', 'developer_lawyer',
]

export const ROLES_WITH_APPROVAL: UserRole[] = [
  'admin', 'project_manager', 'residents_supervisor',
]

export const DEVELOPER_SIDE_ROLES: UserRole[] = [
  'developer', 'developer_lawyer', 'developer_supervisor',
]

export const RESIDENT_SIDE_ROLES: UserRole[] = [
  'resident', 'residents_representative', 'residents_lawyer', 'residents_supervisor',
]
