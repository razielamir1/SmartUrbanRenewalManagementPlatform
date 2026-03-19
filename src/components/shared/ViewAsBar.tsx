'use client'

import { useState, useEffect } from 'react'
import { Eye, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/supabase/types'

const VIEW_ROLES: { value: UserRole; label: string; home: string }[] = [
  { value: 'project_manager',         label: 'מנהל פרויקט',           home: '/portal/project-manager' },
  { value: 'resident',                label: 'דייר',                   home: '/portal/resident' },
  { value: 'residents_representative', label: 'נציג דיירים',           home: '/portal/residents-representative' },
  { value: 'residents_lawyer',        label: 'עו"ד דיירים',           home: '/portal/residents-lawyer' },
  { value: 'residents_supervisor',    label: 'מפקח דיירים',           home: '/portal/residents-supervisor' },
  { value: 'developer',               label: 'יזם',                   home: '/portal/developer' },
  { value: 'developer_lawyer',        label: 'עו"ד יזם',             home: '/portal/developer-lawyer' },
  { value: 'developer_supervisor',    label: 'מפקח יזם',             home: '/portal/developer-supervisor' },
]

export function ViewAsBar({ actualRole }: { actualRole: UserRole | null }) {
  const [viewAs, setViewAs] = useState<string | null>(null)
  const [open, setOpen]     = useState(false)
  const router = useRouter()

  // Read cookie on mount
  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)viewAs=([^;]+)/)
    if (match) setViewAs(match[1])
  }, [])

  // Only show for admin
  if (actualRole !== 'admin') return null

  function startViewAs(role: string) {
    document.cookie = `viewAs=${role}; path=/; max-age=3600; SameSite=Lax`
    setViewAs(role)
    setOpen(false)
    const target = VIEW_ROLES.find(r => r.value === role)
    router.push(target?.home ?? '/portal/admin')
    router.refresh()
  }

  function stopViewAs() {
    document.cookie = 'viewAs=; path=/; max-age=0'
    setViewAs(null)
    router.push('/portal/admin')
    router.refresh()
  }

  const activeLabel = VIEW_ROLES.find(r => r.value === viewAs)?.label

  return (
    <>
      {/* Active viewAs banner */}
      {viewAs && (
        <div
          className="sticky top-0 z-[70] flex items-center justify-center gap-3 px-4 py-2 text-sm font-medium"
          style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444)', color: '#fff' }}
        >
          <Eye size={16} aria-hidden="true" />
          <span>צפייה כ: <strong>{activeLabel}</strong></span>
          <button
            onClick={stopViewAs}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
            style={{ background: 'rgba(0,0,0,0.25)' }}
            aria-label="חזור לתצוגת מנהל"
          >
            <X size={14} aria-hidden="true" />
            חזור למנהל
          </button>
        </div>
      )}

      {/* Floating "View As" button (admin only, when NOT already viewing) */}
      {!viewAs && (
        <div className="fixed bottom-6 start-6 z-[70]">
          <button
            onClick={() => setOpen(s => !s)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-sm font-semibold text-white transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            aria-label="צפה כתפקיד אחר"
          >
            <Eye size={18} aria-hidden="true" />
            צפה כ...
          </button>

          {open && (
            <div className="absolute bottom-14 start-0 w-56 rounded-2xl border border-border bg-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-bold">בחר תפקיד לצפייה</p>
                <p className="text-xs text-muted-foreground">תראה את הפורטל כפי שהמשתמש רואה</p>
              </div>
              <div className="py-1">
                {VIEW_ROLES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => startViewAs(r.value)}
                    className="w-full px-4 py-2.5 text-start text-sm hover:bg-muted transition-colors"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
