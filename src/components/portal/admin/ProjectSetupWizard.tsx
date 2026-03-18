'use client'

import { useReducer, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// ─── Step schemas ──────────────────────────────────────────────────────────
const step1Schema = z.object({
  name: z.string().min(2, 'שם הפרויקט חייב להכיל לפחות 2 תווים'),
  description: z.string().optional(),
})

// ─── State ────────────────────────────────────────────────────────────────
interface Building {
  address: string
  buildingNumber: string
  whatsappLink: string
  apartmentCount: number
  apartments: string[]  // unit numbers
}

interface WizardState {
  step: 1 | 2 | 3 | 4 | 5
  projectName: string
  description: string
  globalWhatsappLink: string
  buildings: Building[]
}

type WizardAction =
  | { type: 'SET_PROJECT'; name: string; description: string }
  | { type: 'ADD_BUILDING' }
  | { type: 'UPDATE_BUILDING'; index: number; field: keyof Building; value: string | number | string[] }
  | { type: 'REMOVE_BUILDING'; index: number }
  | { type: 'SET_GLOBAL_WA'; link: string }
  | { type: 'NEXT' }
  | { type: 'PREV' }

const initialBuilding = (): Building => ({
  address: '',
  buildingNumber: '',
  whatsappLink: '',
  apartmentCount: 0,
  apartments: [],
})

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_PROJECT':
      return { ...state, projectName: action.name, description: action.description }
    case 'ADD_BUILDING':
      return { ...state, buildings: [...state.buildings, initialBuilding()] }
    case 'UPDATE_BUILDING': {
      const buildings = [...state.buildings]
      buildings[action.index] = { ...buildings[action.index], [action.field]: action.value }
      // If apartmentCount changed, rebuild apartments array
      if (action.field === 'apartmentCount') {
        const count = Number(action.value)
        buildings[action.index].apartments = Array.from({ length: count }, (_, i) =>
          buildings[action.index].apartments[i] ?? `${i + 1}`
        )
      }
      return { ...state, buildings }
    }
    case 'REMOVE_BUILDING':
      return { ...state, buildings: state.buildings.filter((_, i) => i !== action.index) }
    case 'SET_GLOBAL_WA':
      return { ...state, globalWhatsappLink: action.link }
    case 'NEXT':
      return { ...state, step: Math.min(5, state.step + 1) as WizardState['step'] }
    case 'PREV':
      return { ...state, step: Math.max(1, state.step - 1) as WizardState['step'] }
    default:
      return state
  }
}

export function ProjectSetupWizard() {
  const router = useRouter()
  const [state, dispatch] = useReducer(reducer, {
    step: 1,
    projectName: '',
    description: '',
    globalWhatsappLink: '',
    buildings: [initialBuilding()],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const supabase = getSupabaseBrowserClient()

    // 1. Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: state.projectName,
        description: state.description || null,
        global_whatsapp_link: state.globalWhatsappLink || null,
        status: 'pre_planning',
      })
      .select()
      .single()

    if (projectError || !project) {
      setError('שגיאה ביצירת הפרויקט: ' + projectError?.message)
      setSaving(false)
      return
    }

    // 2. Create buildings + apartments
    for (const b of state.buildings) {
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .insert({
          project_id: project.id,
          address: b.address,
          building_number: b.buildingNumber || null,
          building_whatsapp_link: b.whatsappLink || null,
        })
        .select()
        .single()

      if (buildingError || !building) continue

      if (b.apartments.length > 0) {
        await supabase.from('apartments').insert(
          b.apartments.map(unit => ({
            building_id: building.id,
            unit_number: unit,
          }))
        )
      }
    }

    // 3. Seed milestones
    await supabase.rpc('seed_project_milestones', { p_project_id: project.id })

    router.push(`/portal/admin/projects/${project.id}`)
    router.refresh()
  }

  const steps = [
    'פרטי הפרויקט',
    'בניינים',
    'דירות',
    'ווצאפ',
    'סיכום',
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Step indicator */}
      <nav aria-label="שלבי האשף">
        <ol className="flex gap-2">
          {steps.map((label, i) => (
            <li
              key={label}
              aria-current={state.step === i + 1 ? 'step' : undefined}
              className={`flex-1 rounded-full h-2 transition-colors ${
                i + 1 < state.step ? 'bg-primary' :
                i + 1 === state.step ? 'bg-primary/60' :
                'bg-muted'
              }`}
              title={label}
            />
          ))}
        </ol>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          שלב {state.step} מתוך 5: <strong>{steps[state.step - 1]}</strong>
        </p>
      </nav>

      <div className="bg-card rounded-2xl shadow p-6 space-y-6">
        {/* Step 1: Project info */}
        {state.step === 1 && (
          <Step1
            name={state.projectName}
            description={state.description}
            onChange={(name, description) => dispatch({ type: 'SET_PROJECT', name, description })}
          />
        )}

        {/* Step 2: Buildings */}
        {state.step === 2 && (
          <Step2
            buildings={state.buildings}
            onAdd={() => dispatch({ type: 'ADD_BUILDING' })}
            onUpdate={(i, field, value) => dispatch({ type: 'UPDATE_BUILDING', index: i, field, value })}
            onRemove={(i) => dispatch({ type: 'REMOVE_BUILDING', index: i })}
          />
        )}

        {/* Step 3: Apartments per building */}
        {state.step === 3 && (
          <Step3
            buildings={state.buildings}
            onUpdate={(i, field, value) => dispatch({ type: 'UPDATE_BUILDING', index: i, field, value })}
          />
        )}

        {/* Step 4: WhatsApp links */}
        {state.step === 4 && (
          <Step4
            globalLink={state.globalWhatsappLink}
            buildings={state.buildings}
            onGlobalChange={(link) => dispatch({ type: 'SET_GLOBAL_WA', link })}
            onBuildingChange={(i, value) => dispatch({ type: 'UPDATE_BUILDING', index: i, field: 'whatsappLink', value })}
          />
        )}

        {/* Step 5: Review */}
        {state.step === 5 && (
          <Step5 state={state} />
        )}

        {error && (
          <div role="alert" className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-base">
            {error}
          </div>
        )}

        <div className="flex justify-between gap-4 pt-2">
          {state.step > 1 && (
            <button
              onClick={() => dispatch({ type: 'PREV' })}
              className="rounded-lg border border-border px-5 py-2.5 text-base font-medium hover:bg-muted transition-colors"
            >
              חזרה
            </button>
          )}
          <div className="flex-1" />
          {state.step < 5 ? (
            <button
              onClick={() => dispatch({ type: 'NEXT' })}
              className="rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-base font-semibold hover:opacity-90 transition-opacity"
            >
              המשך
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-base font-semibold disabled:opacity-60"
            >
              {saving ? 'יוצר פרויקט...' : 'צרו פרויקט'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Step sub-components ───────────────────────────────────────────────────
function Step1({ name, description, onChange }: {
  name: string; description: string
  onChange: (name: string, desc: string) => void
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">פרטי הפרויקט</h2>
      <div className="space-y-2">
        <label className="block text-lg font-medium" htmlFor="proj-name">שם הפרויקט *</label>
        <input
          id="proj-name"
          value={name}
          onChange={e => onChange(e.target.value, description)}
          className="w-full rounded-lg border border-input px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder='למשל: פינוי-בינוי רחוב הרצל 10'
        />
      </div>
      <div className="space-y-2">
        <label className="block text-lg font-medium" htmlFor="proj-desc">תיאור (אופציונלי)</label>
        <textarea
          id="proj-desc"
          value={description}
          onChange={e => onChange(name, e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-input px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          placeholder='פרטים נוספים על הפרויקט...'
        />
      </div>
    </div>
  )
}

function Step2({ buildings, onAdd, onUpdate, onRemove }: {
  buildings: Building[]
  onAdd: () => void
  onUpdate: (i: number, field: keyof Building, value: string | number | string[]) => void
  onRemove: (i: number) => void
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">בניינים בפרויקט</h2>
      {buildings.map((b, i) => (
        <div key={i} className="border border-border rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">בניין {i + 1}</h3>
            {buildings.length > 1 && (
              <button
                onClick={() => onRemove(i)}
                className="text-red-600 text-sm hover:underline"
                aria-label={`הסר בניין ${i + 1}`}
              >
                הסר
              </button>
            )}
          </div>
          <input
            value={b.address}
            onChange={e => onUpdate(i, 'address', e.target.value)}
            placeholder="כתובת הבניין *"
            className="w-full rounded-lg border border-input px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={b.buildingNumber}
            onChange={e => onUpdate(i, 'buildingNumber', e.target.value)}
            placeholder="מספר בניין (אופציונלי)"
            className="w-full rounded-lg border border-input px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      ))}
      <button
        onClick={onAdd}
        className="w-full rounded-xl border-2 border-dashed border-border py-3 text-base text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        + הוסף בניין
      </button>
    </div>
  )
}

function Step3({ buildings, onUpdate }: {
  buildings: Building[]
  onUpdate: (i: number, field: keyof Building, value: string | number | string[]) => void
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">דירות לפי בניין</h2>
      {buildings.map((b, i) => (
        <div key={i} className="border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold">{b.address || `בניין ${i + 1}`}</h3>
          <div className="space-y-2">
            <label className="text-base font-medium" htmlFor={`apt-count-${i}`}>
              מספר דירות
            </label>
            <input
              id={`apt-count-${i}`}
              type="number"
              min={0}
              max={200}
              value={b.apartmentCount || ''}
              onChange={e => onUpdate(i, 'apartmentCount', parseInt(e.target.value) || 0)}
              className="w-32 rounded-lg border border-input px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {b.apartments.length > 0 && (
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {b.apartments.map((unit, j) => (
                <input
                  key={j}
                  value={unit}
                  onChange={e => {
                    const updated = [...b.apartments]
                    updated[j] = e.target.value
                    onUpdate(i, 'apartments', updated)
                  }}
                  aria-label={`מספר דירה ${j + 1}`}
                  className="rounded-lg border border-input px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Step4({ globalLink, buildings, onGlobalChange, onBuildingChange }: {
  globalLink: string
  buildings: Building[]
  onGlobalChange: (link: string) => void
  onBuildingChange: (i: number, value: string) => void
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">קבוצות ווצאפ</h2>
      <div className="space-y-2">
        <label className="block text-base font-medium" htmlFor="global-wa">קישור לקבוצת הפרויקט (כולל כולם)</label>
        <input
          id="global-wa"
          value={globalLink}
          onChange={e => onGlobalChange(e.target.value)}
          placeholder="https://chat.whatsapp.com/..."
          dir="ltr"
          className="w-full rounded-lg border border-input px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      {buildings.map((b, i) => (
        <div key={i} className="space-y-2">
          <label className="block text-base font-medium">
            קישור לקבוצת {b.address || `בניין ${i + 1}`}
          </label>
          <input
            value={b.whatsappLink}
            onChange={e => onBuildingChange(i, e.target.value)}
            placeholder="https://chat.whatsapp.com/..."
            dir="ltr"
            className="w-full rounded-lg border border-input px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      ))}
    </div>
  )
}

function Step5({ state }: { state: WizardState }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">סיכום ואישור</h2>
      <div className="bg-muted/30 rounded-xl p-4 space-y-3 text-base">
        <p><strong>שם הפרויקט:</strong> {state.projectName}</p>
        {state.description && <p><strong>תיאור:</strong> {state.description}</p>}
        <p><strong>מספר בניינים:</strong> {state.buildings.length}</p>
        {state.buildings.map((b, i) => (
          <div key={i} className="border-t border-border pt-2">
            <p className="font-medium">{b.address || `בניין ${i + 1}`}</p>
            <p className="text-muted-foreground text-sm">{b.apartments.length} דירות</p>
            {b.whatsappLink && <p className="text-sm text-green-700">✓ קבוצת ווצאפ הוגדרה</p>}
          </div>
        ))}
        {state.globalWhatsappLink && (
          <p className="text-green-700">✓ קבוצת ווצאפ לפרויקט הכולל הוגדרה</p>
        )}
      </div>
    </div>
  )
}
