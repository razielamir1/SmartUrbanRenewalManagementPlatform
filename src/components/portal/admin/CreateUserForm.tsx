'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { UserRole } from '@/lib/supabase/types'

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

const schema = z.object({
  full_name:   z.string().min(2, 'שם חובה'),
  email:       z.string().email('כתובת אימייל לא תקינה'),
  password:    z.string().min(8, 'סיסמה חייבת להכיל לפחות 8 תווים'),
  role:        z.enum([
    'admin', 'project_manager', 'resident', 'residents_representative',
    'residents_lawyer', 'residents_supervisor',
    'developer', 'developer_lawyer', 'developer_supervisor',
  ] as const),
  project_id:  z.string().optional(),
  building_id: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Project  { id: string; name: string }
interface Building { id: string; address: string; building_number: string | null }

export function CreateUserForm() {
  const [serverMessage, setServerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [projects, setProjects]   = useState<Project[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loadingBuildings, setLoadingBuildings] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'resident' },
  })

  const selectedRole      = watch('role')
  const selectedProjectId = watch('project_id')

  // Load projects once
  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(data.projects ?? []))
      .catch(() => {})
  }, [])

  // Load buildings when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setBuildings([])
      setValue('building_id', '')
      return
    }
    setLoadingBuildings(true)
    fetch(`/api/buildings?project_id=${selectedProjectId}`)
      .then(r => r.json())
      .then(data => setBuildings(data.buildings ?? []))
      .catch(() => {})
      .finally(() => setLoadingBuildings(false))
    setValue('building_id', '')
  }, [selectedProjectId, setValue])

  async function onSubmit(values: FormValues) {
    setServerMessage(null)

    if (values.role === 'project_manager' && !values.project_id) {
      setServerMessage({ type: 'error', text: 'יש לבחור פרויקט עבור מנהל הפרויקט' })
      return
    }

    const res  = await fetch('/api/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data = await res.json()
    if (res.ok) {
      setServerMessage({ type: 'success', text: `משתמש נוצר בהצלחה — ${values.email}` })
      reset()
      setBuildings([])
    } else {
      setServerMessage({ type: 'error', text: `שגיאה: ${data.error}` })
    }
  }

  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring'
  const labelClass = 'block text-base font-medium mb-1'
  const errorClass = 'text-sm text-destructive mt-1'

  const needsProject = selectedRole !== 'admin'

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h2 className="text-xl font-bold mb-5">יצירת משתמש חדש</h2>

      {serverMessage && (
        <div
          role={serverMessage.type === 'error' ? 'alert' : 'status'}
          className={`rounded-lg px-4 py-3 text-base mb-5 ${
            serverMessage.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {serverMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div>
            <label htmlFor="full_name" className={labelClass}>שם מלא</label>
            <input id="full_name" type="text" autoComplete="name" className={inputClass} {...register('full_name')} />
            {errors.full_name && <p className={errorClass}>{errors.full_name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="new_email" className={labelClass}>אימייל</label>
            <input id="new_email" type="email" autoComplete="off" className={inputClass} dir="ltr" {...register('email')} />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="new_password" className={labelClass}>סיסמה</label>
            <input id="new_password" type="password" autoComplete="new-password" className={inputClass} {...register('password')} />
            {errors.password && <p className={errorClass}>{errors.password.message}</p>}
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className={labelClass}>תפקיד</label>
            <select id="role" className={inputClass} {...register('role')}>
              {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.role && <p className={errorClass}>{errors.role.message}</p>}
          </div>

          {/* Project — shown for all non-admin roles */}
          {needsProject && (
            <div>
              <label htmlFor="project_id" className={labelClass}>
                פרויקט
                {selectedRole === 'project_manager' && <span className="text-destructive"> *</span>}
              </label>
              <select id="project_id" className={inputClass} {...register('project_id')}>
                <option value="">— ללא שיוך לפרויקט —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  אין פרויקטים. <a href="/portal/admin/projects/new" className="text-primary underline">צור פרויקט תחילה</a>
                </p>
              )}
            </div>
          )}

          {/* Building — shown when project is selected */}
          {needsProject && selectedProjectId && (
            <div>
              <label htmlFor="building_id" className={labelClass}>
                בניין <span className="text-muted-foreground text-sm font-normal">(אופציונלי)</span>
              </label>
              <select
                id="building_id"
                className={inputClass}
                disabled={loadingBuildings}
                {...register('building_id')}
              >
                <option value="">— ללא שיוך לבניין ספציפי —</option>
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.address}{b.building_number ? ` (בניין ${b.building_number})` : ''}
                  </option>
                ))}
              </select>
              {loadingBuildings && <p className="text-sm text-muted-foreground mt-1">טוען בניינים...</p>}
              {!loadingBuildings && buildings.length === 0 && (
                <p className="text-sm text-muted-foreground mt-1">אין בניינים בפרויקט זה</p>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-primary text-primary-foreground px-6 py-2.5 text-base font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {isSubmitting ? 'יוצר...' : 'צור משתמש'}
        </button>
      </form>
    </div>
  )
}
