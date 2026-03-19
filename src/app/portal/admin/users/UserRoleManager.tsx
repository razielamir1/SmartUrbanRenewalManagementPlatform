'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Link2, X, Pencil, Eye, EyeOff } from 'lucide-react'
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

interface Project  { id: string; name: string }
interface Building { id: string; address: string }

interface Props {
  users: UserWithRelations[]
  projects: Project[]
}

// ─── User Edit Modal ──────────────────────────────────────────────────────────

function UserEditModal({ user, onClose, onSaved }: {
  user: UserWithRelations
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [fullName,    setFullName]    = useState(user.full_name ?? '')
  const [email,       setEmail]       = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [err,         setErr]         = useState('')

  // Load email from auth on mount
  useEffect(() => {
    fetch(`/api/users/${user.id}`)
      .then(r => r.json())
      .then(d => { setEmail(d.email ?? ''); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user.id])

  async function handleSave() {
    setSaving(true); setErr('')
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName,
        email: email || undefined,
        new_password: newPassword || undefined,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(data.error ?? 'שגיאה'); return }
    onSaved('פרטי המשתמש עודכנו בהצלחה')
  }

  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">עריכת משתמש</h3>
          <button onClick={onClose} aria-label="סגור" className="p-1 rounded-lg hover:bg-muted"><X size={18} /></button>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">טוען...</p> : (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">שם מלא</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} aria-label="שם מלא" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">אימייל (שם משתמש)</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={inputClass} aria-label="אימייל" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">סיסמא חדשה (השאר ריק לאי-שינוי)</label>
              <div className="relative">
                <input value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  type={showPw ? 'text' : 'password'}
                  className={`${inputClass} pe-10`}
                  placeholder="לפחות 8 תווים"
                  aria-label="סיסמא חדשה"
                  dir="ltr"
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  aria-label={showPw ? 'הסתר סיסמא' : 'הצג סיסמא'}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}

        <button onClick={handleSave} disabled={saving || loading}
          className="w-full rounded-xl bg-primary text-primary-foreground px-4 py-2.5 font-semibold hover:opacity-90 disabled:opacity-60">
          {saving ? 'שומר...' : 'שמור שינויים'}
        </button>
      </div>
    </div>
  )
}

interface AssignState {
  projectId: string
  buildingId: string
  buildings: Building[]
  loading: boolean
  saving: boolean
}

export function UserRoleManager({ users, projects }: Props) {
  const [updating,      setUpdating]      = useState<string | null>(null)
  const [message,       setMessage]       = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [search,        setSearch]        = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [assigning,     setAssigning]     = useState<string | null>(null)
  const [editingUser,   setEditingUser]   = useState<UserWithRelations | null>(null)
  const [assignState,   setAssignState]   = useState<AssignState>({
    projectId: '', buildingId: '', buildings: [], loading: false, saving: false,
  })

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

  async function openAssign(user: UserWithRelations) {
    const state: AssignState = {
      projectId:  user.project_id  ?? '',
      buildingId: user.building_id ?? '',
      buildings:  [],
      loading:    false,
      saving:     false,
    }
    setAssigning(user.id)
    setAssignState(state)

    if (user.project_id) {
      setAssignState(s => ({ ...s, loading: true }))
      const res = await fetch(`/api/buildings?project_id=${user.project_id}`)
      const data = await res.json()
      setAssignState(s => ({ ...s, buildings: data.buildings ?? [], loading: false }))
    }
  }

  async function onAssignProjectChange(projectId: string) {
    setAssignState(s => ({ ...s, projectId, buildingId: '', buildings: [], loading: true }))
    if (!projectId) {
      setAssignState(s => ({ ...s, loading: false }))
      return
    }
    const res = await fetch(`/api/buildings?project_id=${projectId}`)
    const data = await res.json()
    setAssignState(s => ({ ...s, buildings: data.buildings ?? [], loading: false }))
  }

  async function saveAssignment() {
    if (!assigning) return
    setAssignState(s => ({ ...s, saving: true }))
    const res = await fetch('/api/users/assign-project', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId:     assigning,
        projectId:  assignState.projectId,
        buildingId: assignState.buildingId,
      }),
    })
    const data = await res.json()
    setAssignState(s => ({ ...s, saving: false }))
    setMessage(res.ok
      ? { type: 'success', text: 'שיוך עודכן — רענן את הדף לצפייה' }
      : { type: 'error', text: `שגיאה: ${data.error}` }
    )
    if (res.ok) setAssigning(null)
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

  const selectClass = 'rounded-lg border border-input bg-background px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'

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

      {/* User edit modal */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={msg => { setMessage({ type: 'success', text: msg }); setEditingUser(null) }}
        />
      )}

      {/* Assignment modal */}
      {assigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) setAssigning(null) }}>
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">שיוך לפרויקט</h3>
              <button onClick={() => setAssigning(null)} aria-label="סגור" className="p-1 rounded-lg hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">פרויקט</label>
              <select
                value={assignState.projectId}
                onChange={e => onAssignProjectChange(e.target.value)}
                className={`w-full ${selectClass}`}
                aria-label="בחר פרויקט"
              >
                <option value="">— ללא פרויקט —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {assignState.projectId && (
              <div>
                <label className="block text-sm font-medium mb-1">בניין (אופציונלי)</label>
                {assignState.loading
                  ? <p className="text-sm text-muted-foreground">טוען בניינים...</p>
                  : (
                    <select
                      value={assignState.buildingId}
                      onChange={e => setAssignState(s => ({ ...s, buildingId: e.target.value }))}
                      className={`w-full ${selectClass}`}
                      aria-label="בחר בניין"
                    >
                      <option value="">— ללא בניין —</option>
                      {assignState.buildings.map(b => <option key={b.id} value={b.id}>{b.address}</option>)}
                    </select>
                  )
                }
              </div>
            )}

            <button
              onClick={saveAssignment}
              disabled={assignState.saving}
              className="w-full rounded-xl bg-primary text-primary-foreground px-4 py-2.5 font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {assignState.saving ? 'שומר...' : 'שמור שיוך'}
            </button>
          </div>
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
                <th className="text-start p-4 font-semibold whitespace-nowrap">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    לא נמצאו משתמשים
                  </td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="p-4 font-medium">{user.full_name ?? '—'}</td>
                    <td className="p-4 text-muted-foreground text-sm">{user.project?.name ?? <span className="italic">לא משויך</span>}</td>
                    <td className="p-4 text-muted-foreground text-sm">{user.building?.address ?? '—'}</td>
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
                        className={selectClass}
                      >
                        {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      {updating === user.id && (
                        <span className="ms-2 text-sm text-muted-foreground">מעדכן...</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAssign(user)}
                          aria-label={`שייך ${user.full_name} לפרויקט`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-sm transition-colors"
                        >
                          <Link2 size={14} aria-hidden="true" />
                          שייך
                        </button>
                        <button
                          onClick={() => setEditingUser(user)}
                          aria-label={`ערוך ${user.full_name}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-sm transition-colors"
                        >
                          <Pencil size={14} aria-hidden="true" />
                          ערוך
                        </button>
                      </div>
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
