'use client'

import { useState, useMemo } from 'react'
import {
  CONSENT_STATUS_LABELS,
  CONSENT_STATUS_COLORS,
  type Building,
  type Apartment,
  type ConsentStatus,
  type ProjectType,
} from '@/lib/supabase/types'
import { CheckCircle2, AlertCircle, Clock, MinusCircle, Download } from 'lucide-react'

const CONSENT_ICONS: Record<ConsentStatus, React.ElementType> = {
  signed:           CheckCircle2,
  objecting:        AlertCircle,
  unsigned_neutral: MinusCircle,
  unsigned:         Clock,
}

const THRESHOLDS: Record<ProjectType, number | null> = {
  tama38a:          66,
  tama38b:          80,
  pinui_binui:      66,
  hitarot_pratiyot: null,
}

type ApartmentWithOwner = Apartment & { users: { full_name: string | null } | null }

interface Props {
  projectId: string
  projectType: ProjectType
  buildings: Building[]
  apartments: ApartmentWithOwner[]
}

type Filter = 'all' | ConsentStatus

export function ConsentsClient({ projectId, projectType, buildings, apartments }: Props) {
  const [localApts, setLocalApts] = useState<ApartmentWithOwner[]>(apartments)
  const [filter, setFilter] = useState<Filter>('all')
  const [saving, setSaving] = useState<string | null>(null)

  const threshold = THRESHOLDS[projectType]
  const total = localApts.length
  const signed = localApts.filter(a => a.consent_status === 'signed').length
  const objecting = localApts.filter(a => a.consent_status === 'objecting').length
  const signedPct = total > 0 ? Math.round((signed / total) * 100) : 0
  const reachedThreshold = threshold !== null && signedPct >= threshold

  async function updateConsent(aptId: string, status: ConsentStatus, notes: string) {
    setSaving(aptId)
    // Optimistic update
    setLocalApts(prev =>
      prev.map(a => a.id === aptId ? { ...a, consent_status: status, consent_notes: notes } : a)
    )
    await fetch('/api/apartments/consent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apartmentId: aptId, consentStatus: status, notes }),
    })
    setSaving(null)
  }

  function exportCSV() {
    const rows = [
      ['בניין', 'דירה', 'בעל נכס', 'סטטוס', 'הערות', 'עודכן'],
      ...localApts.map(a => {
        const bld = buildings.find(b => b.id === a.building_id)
        return [
          bld?.address ?? '',
          a.unit_number,
          a.users?.full_name ?? '',
          CONSENT_STATUS_LABELS[a.consent_status],
          a.consent_notes ?? '',
          a.consent_updated_at ? new Date(a.consent_updated_at).toLocaleDateString('he-IL') : '',
        ]
      }),
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'consents.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredApts = useMemo(() =>
    filter === 'all' ? localApts : localApts.filter(a => a.consent_status === filter),
    [localApts, filter]
  )

  const FILTER_CHIPS: { value: Filter; label: string }[] = [
    { value: 'all',             label: 'הכל' },
    { value: 'signed',          label: 'חתמו' },
    { value: 'objecting',       label: 'מתנגדים' },
    { value: 'unsigned_neutral',label: 'לא חתמו ולא מתנגדים' },
    { value: 'unsigned',        label: 'לא חתמו' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">מעקב חתימות</h1>
          <p className="text-muted-foreground mt-0.5">{total} דירות סה"כ</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-base hover:bg-muted transition-colors"
          aria-label="ייצוא לקובץ CSV"
        >
          <Download size={18} aria-hidden="true" />
          ייצוא CSV
        </button>
      </div>

      {/* Summary bar */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold tabular-nums">{signedPct}%</span>
            <div>
              <p className="font-semibold">חתמו</p>
              <p className="text-sm text-muted-foreground">{signed} מתוך {total}</p>
            </div>
          </div>
          {threshold !== null && (
            <span
              className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                reachedThreshold
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {reachedThreshold ? '✓' : '⚠'} סף נדרש: {threshold}%
            </span>
          )}
          {objecting > 0 && (
            <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-800">
              {objecting} מתנגדים
            </span>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-3 bg-muted rounded-full overflow-hidden flex">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${signedPct}%` }} />
          <div className="h-full bg-red-400 transition-all"
            style={{ width: `${total > 0 ? Math.round((objecting / total) * 100) : 0}%` }} />
        </div>
        {threshold !== null && (
          <div className="flex justify-end text-xs text-muted-foreground">
            {signedPct < threshold ? `נדרשים עוד ${threshold - signedPct}%` : 'הגעתם לסף הנדרש!'}
          </div>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.value}
            onClick={() => setFilter(chip.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filter === chip.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Buildings sections */}
      {buildings.map(building => {
        const bldApts = filteredApts.filter(a => a.building_id === building.id)
        if (bldApts.length === 0) return null
        const bldTotal = localApts.filter(a => a.building_id === building.id).length
        const bldSigned = localApts.filter(a => a.building_id === building.id && a.consent_status === 'signed').length
        const bldPct = bldTotal > 0 ? Math.round((bldSigned / bldTotal) * 100) : 0

        return (
          <section key={building.id} className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-lg">{building.address}</h2>
                <p className="text-sm text-muted-foreground">{bldSigned}/{bldTotal} חתמו ({bldPct}%)</p>
              </div>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${bldPct}%` }} />
              </div>
            </div>
            <div className="divide-y divide-border">
              {bldApts.map(apt => (
                <ApartmentRow
                  key={apt.id}
                  apt={apt}
                  saving={saving === apt.id}
                  onUpdate={updateConsent}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function ApartmentRow({
  apt,
  saving,
  onUpdate,
}: {
  apt: ApartmentWithOwner
  saving: boolean
  onUpdate: (id: string, status: ConsentStatus, notes: string) => void
}) {
  const [notes, setNotes] = useState(apt.consent_notes ?? '')
  const Icon = CONSENT_ICONS[apt.consent_status]
  const color = CONSENT_STATUS_COLORS[apt.consent_status]

  return (
    <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Unit + owner */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Icon size={20} aria-hidden="true" style={{ color, flexShrink: 0 }} />
        <div className="min-w-0">
          <p className="font-semibold">דירה {apt.unit_number}</p>
          {apt.users?.full_name && (
            <p className="text-sm text-muted-foreground truncate">{apt.users.full_name}</p>
          )}
        </div>
      </div>

      {/* Status select */}
      <select
        value={apt.consent_status}
        disabled={saving}
        onChange={e => onUpdate(apt.id, e.target.value as ConsentStatus, notes)}
        className="rounded-lg border border-input px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        aria-label={`סטטוס חתימה דירה ${apt.unit_number}`}
      >
        {(Object.entries(CONSENT_STATUS_LABELS) as [ConsentStatus, string][]).map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>

      {/* Notes */}
      <input
        value={notes}
        onChange={e => setNotes(e.target.value)}
        onBlur={() => notes !== apt.consent_notes && onUpdate(apt.id, apt.consent_status, notes)}
        placeholder="הערות"
        className="flex-1 min-w-0 rounded-lg border border-input px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label={`הערות דירה ${apt.unit_number}`}
      />

      {/* Updated */}
      {apt.consent_updated_at && (
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(apt.consent_updated_at).toLocaleDateString('he-IL')}
        </p>
      )}
    </div>
  )
}
