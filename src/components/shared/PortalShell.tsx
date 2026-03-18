'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { SideNav } from './SideNav'
import type { UserRole } from '@/lib/supabase/types'

interface Props {
  role: UserRole | null
  userName: string | null
  children: React.ReactNode
}

export function PortalShell({ role, userName, children }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const close = () => setIsOpen(false)

  return (
    <div className="flex min-h-screen bg-background">

      {/* Backdrop — covers everything when drawer is open (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/*
        Sidebar wrapper
        Mobile:  position:fixed, right:0 (physical — RTL-safe), slides in/out with translateX
        Desktop: position:static, part of the flex row as a normal column

        IMPORTANT: use right-0 (physical) NOT end-0 (logical).
        In RTL, inset-inline-end maps to left:0 which would pin the drawer to the LEFT side.
      */}
      <div
        className={[
          // ── Mobile (default) ────────────────────────────────────────────
          'fixed inset-y-0 right-0 w-64 z-[60]',
          'transition-transform duration-300 ease-in-out overflow-y-auto',
          // ── Desktop (md+) — reset to normal flow ────────────────────────
          'md:static md:inset-auto md:w-auto md:z-auto',
          'md:translate-x-0 md:transition-none md:overflow-visible',
          // ── Slide state ─────────────────────────────────────────────────
          // translate-x-full (physical +100%) pushes the drawer off the right edge
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <SideNav role={role} userName={userName} onClose={close} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar — hamburger on the right (matches drawer side) */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border md:hidden">
          {/*
            In RTL flex layout: first child → right, last child → left.
            We want hamburger on the RIGHT (same side as the drawer).
          */}
          <button
            onClick={() => setIsOpen(true)}
            aria-label="פתח תפריט"
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <Menu size={24} aria-hidden="true" />
          </button>
          <span className="font-bold text-lg">פינוי-בינוי</span>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
