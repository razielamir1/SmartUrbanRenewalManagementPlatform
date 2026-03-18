'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  FileText,
  Building2,
  Home,
  LogOut,
  BarChart3,
  ClipboardList,
  Scale,
  HardHat,
  UserCheck,
  BookUser,
  CalendarDays,
  ClipboardCheck,
  Bot,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ROLE_LABELS_HE } from '@/lib/rbac/permissions'
import type { UserRole } from '@/lib/supabase/types'

interface NavItem {
  href: string
  label: string
  Icon: typeof LayoutDashboard
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  admin: [
    { href: '/portal/admin',          label: 'לוח בקרה',          Icon: LayoutDashboard },
    { href: '/portal/admin/projects', label: 'פרויקטים',           Icon: FolderOpen },
    { href: '/portal/admin/users',    label: 'ניהול משתמשים',       Icon: Users },
  ],
  project_manager: [
    { href: '/portal/project-manager',                   label: 'לוח בקרה',    Icon: LayoutDashboard },
    { href: '/portal/project-manager/team',              label: 'ניהול צוות',  Icon: Users },
    { href: '/portal/project-manager/docs',              label: 'מסמכים',       Icon: FileText },
    { href: '/portal/project-manager/contacts',          label: 'אנשי קשר',    Icon: BookUser },
    { href: '/portal/project-manager/meetings',          label: 'פגישות',       Icon: CalendarDays },
    { href: '/portal/project-manager/consents',          label: 'חתימות',       Icon: ClipboardCheck },
    { href: '/portal/project-manager/analytics',         label: 'אנליטיקה',    Icon: BarChart3 },
    { href: '/portal/project-manager/chat',              label: 'עוזר AI',      Icon: Bot },
  ],
  resident: [
    { href: '/portal/resident',           label: 'הדירה שלי',   Icon: Home },
    { href: '/portal/resident/documents', label: 'מסמכים',      Icon: FileText },
  ],
  residents_representative: [
    { href: '/portal/residents-representative', label: 'לוח בקרה',  Icon: UserCheck },
    { href: '/portal/resident/documents',       label: 'מסמכים',    Icon: FileText },
  ],
  residents_lawyer: [
    { href: '/portal/residents-lawyer', label: 'הפרויקטים שלי', Icon: Scale },
  ],
  residents_supervisor: [
    { href: '/portal/residents-supervisor', label: 'לוח בקרה',  Icon: BarChart3 },
  ],
  developer: [
    { href: '/portal/developer', label: 'הפרויקטים שלי', Icon: Building2 },
  ],
  developer_lawyer: [
    { href: '/portal/developer-lawyer', label: 'הפרויקטים שלי', Icon: Scale },
  ],
  developer_supervisor: [
    { href: '/portal/developer-supervisor', label: 'לוח בקרה',   Icon: HardHat },
  ],
}

interface SideNavProps {
  role: UserRole | null
  userName: string | null
  onClose?: () => void
  isDark?: boolean
  onToggleDark?: () => void
}

export function SideNav({ role, userName, onClose, isDark, onToggleDark }: SideNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const items = role ? (NAV_ITEMS[role] ?? []) : []

  return (
    <aside
      className="w-64 shrink-0 flex flex-col h-full min-h-screen"
      style={{ background: '#0a1628', borderInlineEnd: '1px solid rgba(30,58,95,0.5)' }}
      aria-label="ניווט ראשי"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-5" style={{ borderBottom: '1px solid rgba(30,58,95,0.5)' }}>
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              U
            </div>
            <h1 className="text-lg font-bold text-white">UrbanOS</h1>
          </div>
          {role && (
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{ROLE_LABELS_HE[role]}</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="סגור תפריט"
            className="md:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-0.5" aria-label="ניווט פורטל">
        {items.map(({ href, label, Icon }) => {
          // Active if exact match, OR starts with href+/ but no more-specific item also matches
        const isActive = pathname === href || (
          pathname.startsWith(href + '/') &&
          !items.some(other => other.href !== href && pathname.startsWith(other.href))
        )
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              aria-current={isActive ? 'page' : undefined}
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.3))',
                color: '#93c5fd',
                borderLeft: '2px solid #3b82f6',
              } : {
                color: 'rgba(255,255,255,0.65)',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User + logout + theme toggle */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(30,58,95,0.5)' }}>
        {userName && (
          <p className="text-sm font-medium truncate mb-2" style={{ color: 'rgba(255,255,255,0.8)' }} title={userName}>
            {userName}
          </p>
        )}

        {/* Dark/Light toggle */}
        {onToggleDark && (
          <button
            onClick={onToggleDark}
            aria-label={isDark ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm mb-1 transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          >
            {isDark
              ? <Sun size={16} aria-hidden="true" />
              : <Moon size={16} aria-hidden="true" />
            }
            <span>{isDark ? 'מצב בהיר' : 'מצב כהה'}</span>
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          aria-label="יציאה מהמערכת"
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut size={16} aria-hidden="true" />
          <span>יציאה</span>
        </button>
      </div>
    </aside>
  )
}
