'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import type { UserRole } from '@/lib/supabase/types'
import type { UserWithRelations } from './page'

const ROLE_LABELS: Record<UserRole, string> = {
  admin:                    'מנהל מערכת',
  project_manager:          'מנהל פרויקט',
  resident:                 'דייר',
  residents_representative: 'נציג דיירים',
  residents_lawyer:         'עו"ד דיירים',
  residents_supervisor:     'מפקח מטעם הדיירים',
  developer:                'יזם',
  developer_lawyer:         'עו"ד יזם',
  developer_supervisor:     'מפקח מטעם היזם',
}

interface Project { id: string; name: string }

interface Props {
  users: UserWithRelations[]
  projects: Project[]
}

export function UserRoleManager({ users, projects }: Props) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')

  async function assignRole(userId: string, role: UserRole) {
    setUpdating(userId)
    setMessage(null)
    const res = await fetch('/api/users/assign-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    })
    const data = await res.json()
    setMessage(res.ok
      ? { type: 'success', text: 'תפקיד עודכן בהצלחה' }
      : { type: 'error', text: `שגיאה: ${data.error}` }
    )
    setUpdating(null)
  }

  const filtered = useMemo(() => {
    let result = users
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      )
    }
    if (projectFilter) {
      result = result.filter(u => u.project_id === projectFilter)
    }
    return result
  }, [users, search, projectFilter])

  return (
    <div className="space-y-4">
      {/* Search + filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם..."
            className="w-full rounded-xl border border-input bg-background px-4 pe-9 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="חיפוש משתמשים"
          />
        </div>
        <select
          value={projectFilter}
          onChange={e => setProjectFilter(e.target.value)}
          className="rounded-xl border border-input bg-background px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="סינון לפי פרויקט"
        >
          <option value="">כל הפרויקטים</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`rounded-lg px-4 py-3 text-base ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-start p-4 font-semibold whitespace-nowrap">שם</th>
                <th className="text-start p-4 font-semibold whitespace-nowrap">פרויקט</th>
                <th className="text-start p-4 font-semibold whitespace-nowrap">בניין</th>
                <th className="text-start p-4 font-semibold whitespace-nowrap">תפקיד נוכחי</th>
                <th className="text-start p-4 font-semibold whitespace-nowrap">שינוי תפקיד</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    לא נמצאו משתמשים
                  </td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="p-4 font-medium">{user.full_name ?? '—'}</td>
                    <td className="p-4 text-muted-foreground">{user.project?.name ?? '—'}</td>
                    <td className="p-4 text-muted-foreground">{user.building?.address ?? '—'}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-sm bg-muted">
                        {ROLE_LABELS[user.role as UserRole] ?? user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        defaultValue={user.role}
                        disabled={updating === user.id}
                        onChange={e => assignRole(user.id, e.target.value as UserRole)}
                        aria-label={`תפקיד של ${user.full_name}`}
                        className="rounded-lg border border-input bg-background px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                      >
                        {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      {updating === user.id && (
                        <span className="ms-2 text-sm text-muted-foreground">מעדכן...</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border bg-muted/20 text-sm text-muted-foreground">
          {filtered.length} מתוך {users.length} משתמשים
        </div>
      </div>
    </div>
  )
}
