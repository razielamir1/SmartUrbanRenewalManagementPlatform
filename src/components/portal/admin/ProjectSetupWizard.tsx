'use client'

import { useReducer, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { ProjectType } from '@/lib/supabase/types'

// ─── Step schemas ──────────────────────────────────────────────────────────
const step2Schema = z.object({
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
  step: 1 | 2 | 3 | 4 | 5 | 6
  projectType: ProjectType
  projectName: string
  description: string
  globalWhatsappLink: string
  buildings: Building[]
}

type WizardAction =
  | { type: 'SET_TYPE'; projectType: ProjectType }
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
    case 'SET_TYPE':
      return { ...state, projectType: action.projectType, step: 2 }
    case 'SET_PROJECT':
      return { ...state, projectName: action.name, description: action.description }
    case 'ADD_BUILDING':
      return { ...state, buildings: [...state.buildings, initialBuilding()] }
    case 'UPDATE_BUILDING': {
      const buildings = [...state.buildings]
      buildings[action.index] = { ...buildings[action.index], [action.field]: action.value }
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
      return { ...state, step: Math.min(6, state.step + 1) as WizardState['step'] }
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
    projectType: 'pinui_binui',
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
        project_type: state.projectType,
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

    // 3. Seed type-specific milestones
    await supabase.rpc('seed_project_milestones', {
      p_project_id: project.id,
      p_project_type: state.projectType,
    })

    router.push(`/portal/admin/projects/${project.id}`)
    router.refresh()
  }

  // Step 1 is type selection — no label in progress bar
  const progressSteps = ['פרטי הפרויקט', 'בניינים', 'דירות', 'ווצאפ', 'סיכום']

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Step indicator — only show from step 2 onward */}
      {state.step > 1 && (
        <nav aria-label="שלבי האשף">
          <ol className="flex gap-2">
            {progressSteps.map((label, i) => (
              <li
                key={label}
                aria-current={state.step === i + 2 ? 'step' : undefined}
                className={`flex-1 rounded-full h-2 transition-colors ${
                  i + 2 < state.step ? 'bg-primary' :
                  i + 2 === state.step ? 'bg-primary/60' :
                  'bg-muted'
                }`}
                title={label}
              />
            ))}
          </ol>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            שלב {state.step - 1} מתוך 5: <strong>{progressSteps[state.step - 2]}</strong>
          </p>
        </nav>
      )}

      <div className="bg-card rounded-2xl shadow p-6 space-y-6">

        {/* Step 1: Project type selection */}
        {state.step === 1 && (
          <StepType onSelect={(t) => dispatch({ type: 'SET_TYPE', projectType: t })} />
        )}

        {/* Step 2: Project info */}
        {state.step === 2 && (
          <Step2
            name={state.projectName}
            description={state.description}
            projectType={state.projectType}
            onChange={(name, description) => dispatch({ type: 'SET_PROJECT', name, description })}
          />
        )}

        {/* Step 3: Buildings */}
        {state.step === 3 && (
          <Step3
            buildings={state.buildings}
            onAdd={() => dispatch({ type: 'ADD_BUILDING' })}
            onUpdate={(i, field, value) => dispatch({ type: 'UPDATE_BUILDING', index: i, field, value })}
            onRemove={(i) => dispatch({ type: 'REMOVE_BUILDING', index: i })}
          />
        )}

        {/* Step 4: Apartments per building */}
        {state.step === 4 && (
          <Step4
            buildings={state.buildings}
            onUpdate={(i, field, value) => dispatch({ type: 'UPDATE_BUILDING', index: i, field, value })}
          />
        )}

        {/* Step 5: WhatsApp links */}
        {state.step === 5 && (
          <Step5
            globalLink={state.globalWhatsappLink}
            buildings={state.buildings}
            onGlobalChange={(link) => dispatch({ type: 'SET_GLOBAL_WA', link })}
            onBuildingChange={(i, value) => dispatch({ type: 'UPDATE_BUILDING', index: i, field: 'whatsappLink', value })}
          />
        )}

        {/* Step 6: Review */}
        {state.step === 6 && (
          <Step6 state={state} />
        )}

        {error && (
          <div role="alert" className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-base">
            {error}
          </div>
        )}

        {/* Navigation — hidden on step 1 (type selection auto-advances) */}
        {state.step > 1 && (
          <div className="flex justify-between gap-4 pt-2">
            <button
              onClick={() => dispatch({ type: 'PREV' })}
              className="rounded-lg border border-border px-5 py-2.5 text-base font-medium hover:bg-muted transition-colors"
            >
              חזרה
            </button>
            <div className="flex-1" />
            {state.step < 6 ? (
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
        )}
      </div>
    </div>
  )
}

// ─── Step sub-components ───────────────────────────────────────────────────

const TYPE_CARDS: {
  type: ProjectType
  icon: string
  name: string
  desc: string
  bullets: string[]
  color: string
}[] = [
  {
    type: 'tama38a',
    icon: '🏗️',
    name: 'תמ"א 38 א — חיזוק',
    desc: 'חיזוק מבנה קיים מפני רעידות אדמה, הוספת ממ"ד והרחבה מוגבלת.',
    bullets: ['דיירים נשארים בבית לאורך כל הבנייה', '66% הסכמה · 3-5 שנים'],
    color: '#3b82f6',
  },
  {
    type: 'tama38b',
    icon: '🏢',
    name: 'תמ"א 38 ב — הריסה ובנייה',
    desc: 'הריסת הבניין הקיים ובניית בניין חדש ומודרני עם קומות נוספות.',
    bullets: ['פינוי זמני כ-3 שנים ממומן ביזם', '80% הסכמה · 5-6 שנים'],
    color: '#8b5cf6',
  },
  {
    type: 'pinui_binui',
    icon: '🏙️',
    name: 'פינוי-בינוי',
    desc: 'התחדשות עירונית רחבת היקף של מתחם שלם עם בניינים מרובים.',
    bullets: ['מינימום 24 יחידות דיור במתחם', '66% הסכמה · 10-12 שנים'],
    color: '#10b981',
  },
]

function StepType({ onSelect }: { onSelect: (t: ProjectType) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">בחרו את סוג הפרויקט</h2>
        <p className="text-sm text-muted-foreground mt-1">כל סוג מקבל שלבים ואבני דרך ייחודיות מותאמות לו</p>
      </div>
      <div className="grid gap-4">
        {TYPE_CARDS.map(card => (
          <button
            key={card.type}
            onClick={() => onSelect(card.type)}
            className="text-start w-full rounded-xl border-2 border-border hover:border-primary p-4 transition-all duration-200 hover:shadow-sm group"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: `${card.color}18`, border: `1px solid ${card.color}30` }}
              >
                {card.icon}
              </div>
              <div className="space-y-1 flex-1">
                <p className="font-bold text-base group-hover:text-primary transition-colors">{card.name}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                  {card.bullets.map(b => (
                    <span key={b} className="text-xs text-muted-foreground flex items-center gap-1">
                      <span style={{ color: card.color }}>•</span> {b}
                    </span>
                  ))}
                </div>
              </div>
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0 mt-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

const TYPE_NAME: Record<ProjectType, string> = {
  tama38a:     'תמ"א 38 א — חיזוק',
  tama38b:     'תמ"א 38 ב — הריסה ובנייה',
  pinui_binui: 'פינוי-בינוי',
}

function Step2({ name, description, projectType, onChange }: {
  name: string; description: string; projectType: ProjectType
  onChange: (name: string, desc: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">פרטי הפרויקט</h2>
        <p className="text-sm text-muted-foreground mt-0.5">סוג: <strong>{TYPE_NAME[projectType]}</strong></p>
      </div>
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

function Step3({ buildings, onAdd, onUpdate, onRemove }: {
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

function Step4({ buildings, onUpdate }: {
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

function Step5({ globalLink, buildings, onGlobalChange, onBuildingChange }: {
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

function Step6({ state }: { state: WizardState }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">סיכום ואישור</h2>
      <div className="bg-muted/30 rounded-xl p-4 space-y-3 text-base">
        <p><strong>סוג פרויקט:</strong> {TYPE_NAME[state.projectType]}</p>
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
