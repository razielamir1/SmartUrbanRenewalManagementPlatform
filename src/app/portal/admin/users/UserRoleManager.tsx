'use client'

import { useState } from 'react'
import type { UserProfile, UserRole } from '@/lib/supabase/types'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'מנהל מערכת',
  resident: 'דייר',
  residents_representative: 'נציג דיירים',
  residents_lawyer: 'עו"ד דיירים',
  residents_supervisor: 'מפקח מטעם הדיירים',
  developer: 'יזם',
  developer_lawyer: 'עו"ד יזם',
  developer_supervisor: 'מפקח מטעם היזם',
}

export function UserRoleManager({ users }: { users: UserProfile[] }) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function assignRole(userId: string, role: UserRole) {
    setUpdating(userId)
    setMessage(null)
    const res = await fetch('/api/users/assign-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessage(`תפקיד עודכן בהצלחה`)
    } else {
      setMessage(`שגיאה: ${data.error}`)
    }
    setUpdating(null)
  }

  return (
    <div className="space-y-4">
      {message && (
        <div role="status" className="bg-muted rounded-lg px-4 py-3 text-base">
          {message}
        </div>
      )}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-start p-4 font-semibold">שם</th>
              <th className="text-start p-4 font-semibold">תפקיד נוכחי</th>
              <th className="text-start p-4 font-semibold">שינוי תפקיד</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="p-4">{user.full_name ?? '—'}</td>
                <td className="p-4">{ROLE_LABELS[user.role]}</td>
                <td className="p-4">
                  <select
                    defaultValue={user.role}
                    disabled={updating === user.id}
                    onChange={(e) => assignRole(user.id, e.target.value as UserRole)}
                    aria-label={`תפקיד של ${user.full_name}`}
                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  {updating === user.id && (
                    <span className="ms-2 text-sm text-muted-foreground">מעדכן...</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
