'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { UserRole } from '@/lib/supabase/types'

// project_manager can only create these roles
const ALLOWED_ROLES: { value: UserRole; label: string }[] = [
  { value: 'resident',                 label: 'דייר' },
  { value: 'residents_representative', label: 'נציג דיירים' },
  { value: 'residents_lawyer',         label: 'עו"ד דיירים' },
  { value: 'residents_supervisor',     label: 'מפקח מטעם הדיירים' },
  { value: 'developer',                label: 'יזם' },
  { value: 'developer_lawyer',         label: 'עו"ד יזם' },
  { value: 'developer_supervisor',     label: 'מפקח מטעם היזם' },
]

const schema = z.object({
  full_name: z.string().min(2, 'שם חובה'),
  email:     z.string().email('כתובת אימייל לא תקינה'),
  password:  z.string().min(8, 'סיסמה חייבת להכיל לפחות 8 תווים'),
  role:      z.enum(ALLOWED_ROLES.map(r => r.value) as [UserRole, ...UserRole[]]),
})

type FormValues = z.infer<typeof schema>

export function ProjectManagerCreateUserForm({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
}) {
  const [serverMessage, setServerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'resident' },
  })

  async function onSubmit(values: FormValues) {
    setServerMessage(null)
    const res = await fetch('/api/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, project_id: projectId }),
    })
    const data = await res.json()
    if (res.ok) {
      setServerMessage({ type: 'success', text: `משתמש נוצר בהצלחה — ${values.email}` })
      reset()
    } else {
      setServerMessage({ type: 'error', text: `שגיאה: ${data.error}` })
    }
  }

  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring'
  const labelClass = 'block text-base font-medium mb-1'
  const errorClass = 'text-sm text-destructive mt-1'

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h2 className="text-xl font-bold mb-1">הוספת משתמש לפרויקט</h2>
      <p className="text-sm text-muted-foreground mb-5">{projectName}</p>

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
          <div>
            <label htmlFor="pm_full_name" className={labelClass}>שם מלא</label>
            <input id="pm_full_name" type="text" autoComplete="name" className={inputClass} {...register('full_name')} />
            {errors.full_name && <p className={errorClass}>{errors.full_name.message}</p>}
          </div>

          <div>
            <label htmlFor="pm_email" className={labelClass}>אימייל</label>
            <input id="pm_email" type="email" autoComplete="off" className={inputClass} dir="ltr" {...register('email')} />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="pm_password" className={labelClass}>סיסמה</label>
            <input id="pm_password" type="password" autoComplete="new-password" className={inputClass} {...register('password')} />
            {errors.password && <p className={errorClass}>{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="pm_role" className={labelClass}>תפקיד</label>
            <select id="pm_role" className={inputClass} {...register('role')}>
              {ALLOWED_ROLES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.role && <p className={errorClass}>{errors.role.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-primary text-primary-foreground px-6 py-2.5 text-base font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {isSubmitting ? 'יוצר...' : 'הוסף לפרויקט'}
        </button>
      </form>
    </div>
  )
}
