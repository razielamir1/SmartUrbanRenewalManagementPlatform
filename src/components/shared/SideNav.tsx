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
  X,
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
    { href: '/portal/project-manager',            label: 'לוח בקרה',    Icon: LayoutDashboard },
    { href: '/portal/project-manager/team',       label: 'ניהול צוות',  Icon: Users },
    { href: '/portal/project-manager/docs',       label: 'מסמכים',       Icon: FileText },
    { href: '/portal/project-manager/contacts',   label: 'אנשי קשר',    Icon: BookUser },
    { href: '/portal/project-manager/meetings',   label: 'פגישות',       Icon: CalendarDays },
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
}

export function SideNav({ role, userName, onClose }: SideNavProps) {
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
      className="w-64 shrink-0 bg-card border-e border-border flex flex-col h-full min-h-screen"
      aria-label="ניווט ראשי"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-5 border-b border-border">
        <div>
          <h1 className="text-lg font-bold">פינוי-בינוי</h1>
          {role && (
            <p className="text-sm text-muted-foreground mt-0.5">{ROLE_LABELS_HE[role]}</p>
          )}
        </div>
        {/* Close button — visible only on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="סגור תפריט"
            className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1" aria-label="ניווט פורטל">
        {items.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              aria-current={isActive ? 'page' : undefined}
              className={`
                flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors
                ${isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
                }
              `}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="p-4 border-t border-border space-y-2">
        {userName && (
          <p className="text-sm font-medium truncate" title={userName}>{userName}</p>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-base text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          aria-label="יציאה מהמערכת"
        >
          <LogOut size={18} aria-hidden="true" />
          <span>יציאה</span>
        </button>
      </div>
    </aside>
  )
}
