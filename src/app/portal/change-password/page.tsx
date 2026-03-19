'use client'

import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function ChangePasswordPage() {
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('הסיסמא חייבת להכיל לפחות 8 תווים'); return }
    if (password !== confirm)  { setError('הסיסמאות אינן תואמות'); return }

    setSaving(true)
    setError('')

    const supabase = getSupabaseBrowserClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    // Clear must_change_password flag via API
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: password }),
      })
    }

    // Refresh session and redirect
    await supabase.auth.refreshSession()
    router.push('/')
    router.refresh()
  }

  const inputClass = 'w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a1628' }}>
      <div className="w-full max-w-md bg-card rounded-3xl border border-border p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            <Lock size={28} className="text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-center">שינוי סיסמא</h1>
          <p className="text-muted-foreground text-center mt-2 text-base">
            זוהי ההתחברות הראשונה שלך. אנא הגדר סיסמא חדשה.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="pw" className="block text-base font-medium mb-1.5">סיסמא חדשה</label>
            <div className="relative">
              <input
                id="pw"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`${inputClass} pe-12`}
                placeholder="לפחות 8 תווים"
                autoComplete="new-password"
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                aria-label={showPw ? 'הסתר סיסמא' : 'הצג סיסמא'}
                className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm" className="block text-base font-medium mb-1.5">אימות סיסמא</label>
            <input
              id="confirm"
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className={inputClass}
              placeholder="הכנס שוב את הסיסמא"
              autoComplete="new-password"
              aria-required="true"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-xl px-4 py-3 text-base bg-destructive/10 text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-primary text-primary-foreground px-6 py-3 text-base font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity mt-2"
          >
            {saving ? 'שומר...' : 'שמור סיסמא והמשך'}
          </button>
        </form>
      </div>
    </div>
  )
}
