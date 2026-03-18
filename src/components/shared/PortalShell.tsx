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
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — drawer on mobile, fixed column on desktop */}
      <div
        className={[
          // mobile: fixed drawer, slides in from the end (right in RTL)
          'fixed inset-y-0 end-0 z-50 transition-transform duration-300 ease-in-out',
          // desktop: back in normal flow
          'md:relative md:inset-auto md:z-auto md:transition-none md:translate-x-0',
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <SideNav role={role} userName={userName} onClose={close} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile-only top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border md:hidden">
          <span className="font-bold text-lg">פינוי-בינוי</span>
          <button
            onClick={() => setIsOpen(true)}
            aria-label="פתח תפריט"
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
