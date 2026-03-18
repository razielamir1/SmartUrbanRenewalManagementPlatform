'use client'

import { useState, useEffect } from 'react'
import { Trash2, ChevronRight } from 'lucide-react'
import type { RawContact } from '@/lib/contacts/parse-phones'
import { classifyBuilding } from '@/lib/contacts/classify-building'

interface Building {
  id: string
  address: string
  building_number: string | null
}

interface EditableContact extends RawContact {
  building_id: string | null
}

interface Props {
  rawContacts: RawContact[]
  buildings: Building[]
  projectId: string
  projectName: string
  saving: boolean
  savedCount?: number
  onSave: (contacts: EditableContact[]) => Promise<void>
  onBack: () => void
}

export function ContactReviewTable({ rawContacts, buildings, saving, savedCount, onSave, onBack }: Props) {
  const [contacts, setContacts] = useState<EditableContact[]>([])

  useEffect(() => {
    setContacts(
      rawContacts.map(c => ({
        ...c,
        building_id: classifyBuilding(`${c.full_name} ${c.phone_raw}`, buildings),
      }))
    )
  }, [rawContacts, buildings])

  function updateField<K extends keyof EditableContact>(index: number, key: K, value: EditableContact[K]) {
    setContacts(prev => prev.map((c, i) => i === index ? { ...c, [key]: value } : c))
  }

  function removeRow(index: number) {
    setContacts(prev => prev.filter((_, i) => i !== index))
  }

  if (savedCount !== undefined) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 text-center">
        <p className="text-xl font-bold text-green-600">✓ נשמרו {savedCount} אנשי קשר בהצלחה</p>
      </div>
    )
  }

  const inputClass = 'w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">סקירת אנשי קשר שנמצאו</h2>
          <p className="text-sm text-muted-foreground">{contacts.length} אנשי קשר — ניתן לערוך לפני שמירה</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded-xl border border-border px-4 py-2 text-base hover:bg-muted/40 transition-colors"
          >
            <ChevronRight size={16} />
            חזור
          </button>
          <button
            disabled={saving || contacts.length === 0}
            onClick={() => onSave(contacts)}
            className="rounded-xl bg-primary text-primary-foreground px-6 py-2 text-base font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {saving ? 'שומר...' : `שמור הכל (${contacts.length})`}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-start p-3 font-semibold">שם</th>
              <th className="text-start p-3 font-semibold">טלפון</th>
              <th className="text-start p-3 font-semibold">WhatsApp</th>
              {buildings.length > 0 && <th className="text-start p-3 font-semibold">בניין</th>}
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/10">
                <td className="p-2">
                  <input
                    value={c.full_name}
                    onChange={e => updateField(i, 'full_name', e.target.value)}
                    className={inputClass}
                  />
                </td>
                <td className="p-2 font-mono text-sm whitespace-nowrap" dir="ltr">{c.phone_raw}</td>
                <td className="p-2 text-xs text-muted-foreground" dir="ltr">{c.phone_wa}</td>
                {buildings.length > 0 && (
                  <td className="p-2">
                    <select
                      value={c.building_id ?? ''}
                      onChange={e => updateField(i, 'building_id', e.target.value || null)}
                      className={inputClass}
                    >
                      <option value="">— לא שויך —</option>
                      {buildings.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.address}{b.building_number ? ` (${b.building_number})` : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                )}
                <td className="p-2 text-center">
                  <button
                    onClick={() => removeRow(i)}
                    aria-label="הסר"
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
