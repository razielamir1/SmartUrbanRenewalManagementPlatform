'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PROJECT_TYPE_LABELS, type ProjectType, type ProjectStatus } from '@/lib/supabase/types'

const STATUS_LABELS: Record<string, string> = {
  pre_planning: 'טרום תכנון', planning: 'תכנון', permits: 'קבלת היתרים',
  construction: 'בנייה', finishing: 'גמר', key_delivery: 'מסירת מפתחות',
}

interface Project {
  id: string; name: string; project_type: ProjectType; status: ProjectStatus
  project_manager_id: string | null
}

interface Props {
  projects: Project[]
  managerMap: Record<string, string>
  projectManagers: { id: string; full_name: string | null }[]
}

export function ProjectsTable({ projects, managerMap: initialMap, projectManagers }: Props) {
  const [managerMap, setManagerMap] = useState(initialMap)
  const [pmAssignments, setPmAssignments] = useState<Record<string, string | null>>(
    Object.fromEntries(projects.map(p => [p.id, p.project_manager_id]))
  )
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage]   = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function assignPM(projectId: string, pmId: string | null) {
    setUpdating(projectId)
    setMessage(null)

    const oldPmId = pmAssignments[projectId]
    // Optimistic
    setPmAssignments(prev => ({ ...prev, [projectId]: pmId }))
    if (pmId) {
      const pm = projectManagers.find(u => u.id === pmId)
      if (pm?.full_name) setManagerMap(prev => ({ ...prev, [pmId]: pm.full_name! }))
    }

    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_manager_id: pmId || null }),
    })

    if (!res.ok) {
      // Revert
      setPmAssignments(prev => ({ ...prev, [projectId]: oldPmId }))
      const data = await res.json()
      setMessage({ type: 'error', text: data.error ?? 'שגיאה בשיוך מנהל' })
    } else {
      setMessage({ type: 'success', text: 'מנהל פרויקט עודכן בהצלחה' })
    }
    setUpdating(null)
    setTimeout(() => setMessage(null), 3000)
  }

  const selectClass = 'rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60'

  return (
    <div className="space-y-3">
      {message && (
        <div role={message.type === 'error' ? 'alert' : 'status'}
          className={`rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-x-auto">
        <table className="w-full text-base min-w-[580px]">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-start p-4 font-semibold">שם פרויקט</th>
              <th className="text-start p-4 font-semibold">סוג</th>
              <th className="text-start p-4 font-semibold">סטטוס</th>
              <th className="text-start p-4 font-semibold">מנהל פרויקט</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => {
              const currentPmId = pmAssignments[project.id]
              return (
                <tr key={project.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="p-4 font-medium">
                    <Link href={`/portal/admin/projects/${project.id}`}
                      className="hover:text-primary transition-colors flex items-center gap-1.5 group">
                      {project.name}
                      <ArrowLeft size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {PROJECT_TYPE_LABELS[project.project_type]}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {STATUS_LABELS[project.status] ?? project.status}
                  </td>
                  <td className="p-4">
                    <select
                      value={currentPmId ?? ''}
                      onChange={e => assignPM(project.id, e.target.value || null)}
                      disabled={updating === project.id}
                      className={selectClass}
                      aria-label={`מנהל פרויקט של ${project.name}`}
                    >
                      <option value="">— לא משויך —</option>
                      {projectManagers.map(pm => (
                        <option key={pm.id} value={pm.id}>{pm.full_name ?? pm.id}</option>
                      ))}
                    </select>
                    {updating === project.id && (
                      <span className="ms-2 text-xs text-muted-foreground">מעדכן...</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
