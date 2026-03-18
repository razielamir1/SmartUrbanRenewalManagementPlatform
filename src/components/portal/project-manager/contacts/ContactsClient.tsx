'use client'

import { useState } from 'react'
import { ContactImportForm } from './ContactImportForm'
import { ContactListTable } from './ContactListTable'

interface Building {
  id: string
  address: string
  building_number: string | null
  building_whatsapp_link?: string | null
}

interface Props {
  projectId: string
  projectName: string
  buildings: Building[]
}

export function ContactsClient({ projectId, projectName, buildings }: Props) {
  const [tab, setTab] = useState<'import' | 'list'>('list')

  const tabClass = (active: boolean) =>
    `px-5 py-2.5 rounded-xl text-base font-medium transition-colors ${
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
    }`

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button className={tabClass(tab === 'list')} onClick={() => setTab('list')}>
          רשימת אנשי קשר
        </button>
        <button className={tabClass(tab === 'import')} onClick={() => setTab('import')}>
          ייבוא אנשי קשר
        </button>
      </div>

      {tab === 'import' ? (
        <ContactImportForm
          projectId={projectId}
          projectName={projectName}
          buildings={buildings}
          onSaved={() => setTab('list')}
        />
      ) : (
        <ContactListTable
          projectId={projectId}
          projectName={projectName}
          buildings={buildings}
        />
      )}
    </div>
  )
}
