'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, Sun, Moon } from 'lucide-react'
import { SideNav } from './SideNav'
import type { UserRole } from '@/lib/supabase/types'

interface Props {
  role: UserRole | null
  userName: string | null
  children: React.ReactNode
}

export function PortalShell({ role, userName, children }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDark, setIsDark]  = useState(false)
  const portalRef = useRef<HTMLDivElement>(null)
  const close = () => setIsOpen(false)

  // Read preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('portal-theme')
    if (stored === 'dark') setIsDark(true)
    else if (stored === 'light') setIsDark(false)
    else {
      // Follow system preference if no stored value
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
  }, [])

  // Apply data attribute to portal wrapper
  useEffect(() => {
    if (!portalRef.current) return
    const el = portalRef.current
    if (isDark) {
      el.setAttribute('data-dark', '')
      el.removeAttribute('data-light')
    } else {
      el.removeAttribute('data-dark')
      el.setAttribute('data-light', '')
    }
  }, [isDark])

  function toggleDark() {
    setIsDark(prev => {
      const next = !prev
      localStorage.setItem('portal-theme', next ? 'dark' : 'light')
      return next
    })
  }

  return (
    <div ref={portalRef} className="flex min-h-screen bg-background">

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={[
          'fixed inset-y-0 right-0 w-64 z-[60]',
          'transition-transform duration-300 ease-in-out overflow-y-auto',
          'md:static md:inset-auto md:w-auto md:z-auto',
          'md:translate-x-0 md:transition-none md:overflow-visible',
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <SideNav role={role} userName={userName} onClose={close} isDark={isDark} onToggleDark={toggleDark} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile header */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 md:hidden"
          style={{ background: '#0a1628', borderBottom: '1px solid rgba(30,58,95,0.5)' }}
        >
          <button
            onClick={() => setIsOpen(true)}
            aria-label="פתח תפריט"
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <Menu size={24} aria-hidden="true" />
          </button>
          <span className="font-bold text-lg text-white">UrbanOS</span>
          <button
            onClick={toggleDark}
            aria-label={isDark ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            {isDark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
