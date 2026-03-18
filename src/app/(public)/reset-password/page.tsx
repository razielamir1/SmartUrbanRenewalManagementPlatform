'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
})
type Values = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: Values) {
    setError(null)
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    if (error) {
      setError('אירעה שגיאה. בדקו את כתובת האימייל ונסו שוב.')
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-md p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold">נשלח!</h1>
          <p className="text-lg text-muted-foreground">
            נשלח אליכם אימייל לאיפוס הסיסמה. בדקו את תיבת הדואר שלכם.
          </p>
          <a href="/login" className="text-primary underline text-base">חזרה לכניסה</a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">איפוס סיסמה</h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-card rounded-2xl shadow-md p-8 space-y-6"
          noValidate
        >
          {error && (
            <div role="alert" className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-base">
              {error}
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
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-ring"
              dir="ltr"
            />
            {errors.email && (
              <p className="text-sm text-destructive" role="alert">{errors.email.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-primary text-primary-foreground py-3 text-lg font-semibold disabled:opacity-60"
          >
            {isSubmitting ? 'שולח...' : 'שלחו לינק לאיפוס'}
          </button>
          <div className="text-center">
            <a href="/login" className="text-primary underline text-base">חזרה לכניסה</a>
          </div>
        </form>
      </div>
    </main>
  )
}
