'use client'

import { useState, useRef } from 'react'
import { Upload, FileText } from 'lucide-react'
import type { RawContact } from '@/lib/contacts/parse-phones'
import { ContactReviewTable } from './ContactReviewTable'

interface Building {
  id: string
  address: string
  building_number: string | null
}

interface Props {
  projectId: string
  projectName: string
  buildings: Building[]
  onSaved: () => void
}

type State = 'idle' | 'parsing' | 'reviewing' | 'saving' | 'done'

export function ContactImportForm({ projectId, projectName, buildings, onSaved }: Props) {
  const [state, setState] = useState<State>('idle')
  const [contacts, setContacts] = useState<RawContact[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setState('parsing')

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/contacts/parse', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'שגיאה בעיבוד הקובץ')
      setState('idle')
      return
    }

    setContacts(data.contacts)
    setState('reviewing')
  }

  if (state === 'reviewing' || state === 'saving' || state === 'done') {
    return (
      <ContactReviewTable
        rawContacts={contacts}
        buildings={buildings}
        projectId={projectId}
        projectName={projectName}
        saving={state === 'saving'}
        onSave={async (toSave) => {
          setState('saving')
          const res = await fetch('/api/contacts/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, contacts: toSave }),
          })
          const data = await res.json()
          if (!res.ok) {
            setError(data.error ?? 'שגיאה בשמירה')
            setState('reviewing')
            return
          }
          setState('done')
          setTimeout(onSaved, 800)
        }}
        onBack={() => { setState('idle'); setContacts([]) }}
        savedCount={state === 'done' ? contacts.length : undefined}
      />
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-8 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Upload size={22} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">ייבוא רשימת אנשי קשר</h2>
          <p className="text-sm text-muted-foreground">Word (.docx), CSV, או PDF</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg px-4 py-3 text-base bg-destructive/10 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <label
        htmlFor="contact-file"
        className="flex flex-col items-center gap-3 border-2 border-dashed border-border rounded-xl p-10 cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
      >
        <FileText size={40} className="text-muted-foreground" />
        <p className="text-base text-muted-foreground text-center">
          לחצו לבחירת קובץ או גררו לכאן
          <br />
          <span className="text-sm">.docx / .csv / .pdf • עד 10MB</span>
        </p>
        <input
          id="contact-file"
          ref={fileInputRef}
          type="file"
          accept=".docx,.doc,.csv,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/csv,application/pdf"
          className="sr-only"
          onChange={handleFileChange}
        />
      </label>

      {state === 'parsing' && (
        <p className="mt-4 text-center text-muted-foreground animate-pulse">מעבד את הקובץ...</p>
      )}
    </div>
  )
}
