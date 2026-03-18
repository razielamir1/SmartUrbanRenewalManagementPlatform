'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { homeRouteForRole } from '@/lib/rbac/permissions'
import type { UserRole } from '@/lib/supabase/types'

const loginSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(6, 'הסיסמה חייבת להכיל לפחות 6 תווים'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginValues) {
    setServerError(null)
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      setServerError('פרטי ההתחברות שגויים. נסו שוב.')
      return
    }

    const role = data.user?.app_metadata?.role as UserRole | undefined
    router.push(role ? homeRouteForRole(role) : '/onboarding')
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card rounded-2xl shadow-md p-8 space-y-6"
      noValidate
    >
      {serverError && (
        <div role="alert" className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-base">
          {serverError}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="block text-lg font-medium">
          כתובת אימייל
        </label>
        <input
          {...register('email')}
          id="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-ring"
          aria-describedby={errors.email ? 'email-error' : undefined}
          dir="ltr"
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-lg font-medium">
          סיסמה
        </label>
        <input
          {...register('password')}
          id="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-ring"
          aria-describedby={errors.password ? 'password-error' : undefined}
          dir="ltr"
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-primary text-primary-foreground py-3 text-lg font-semibold transition-opacity disabled:opacity-60"
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'מתחבר...' : 'כניסה'}
      </button>

      <div className="text-center">
        <a
          href="/reset-password"
          className="text-primary underline text-base hover:opacity-80"
        >
          שכחתם סיסמה?
        </a>
      </div>
    </form>
  )
}
