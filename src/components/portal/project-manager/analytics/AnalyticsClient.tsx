'use client'

import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  CONSENT_STATUS_LABELS,
  CONSENT_STATUS_COLORS,
  PROJECT_TYPE_LABELS,
  type Apartment,
  type Building,
  type Milestone,
  type ProjectType,
  type ProjectStatus,
} from '@/lib/supabase/types'
import { Lightbulb, AlertTriangle, Rocket, RefreshCw } from 'lucide-react'

interface Project {
  id: string
  name: string
  project_type: ProjectType
  status: ProjectStatus
}

interface DocStat {
  status: string
}

interface Props {
  project: Project
  buildings: Building[]
  apartments: Apartment[]
  milestones: Milestone[]
  documents: DocStat[]
}

interface AIInsights {
  insights: string[]
  alerts: string[]
  tips: string[]
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  pre_planning: 'טרום תכנון',
  planning: 'תכנון',
  permits: 'קבלת היתרים',
  construction: 'בנייה',
  finishing: 'גמר',
  key_delivery: 'מסירת מפתחות',
}

export function AnalyticsClient({ project, buildings, apartments, milestones, documents }: Props) {
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

  async function fetchInsights() {
    setLoadingInsights(true)
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      })
      const data = await res.json()
      setInsights(data)
    } catch {
      setInsights({ insights: ['שגיאה בטעינת תובנות AI'], alerts: [], tips: [] })
    } finally {
      setLoadingInsights(false)
    }
  }

  useEffect(() => { fetchInsights() }, [project.id])

  // Consent data
  const consentData = (['signed', 'objecting', 'unsigned_neutral', 'unsigned'] as const).map(status => ({
    name: CONSENT_STATUS_LABELS[status],
    value: apartments.filter(a => a.consent_status === status).length,
    color: CONSENT_STATUS_COLORS[status],
  })).filter(d => d.value > 0)

  // Per-building consent
  const buildingConsentData = buildings.map(b => {
    const bApts = apartments.filter(a => a.building_id === b.id)
    return {
      name: b.address.slice(0, 20),
      חתמו: bApts.filter(a => a.consent_status === 'signed').length,
      מתנגדים: bApts.filter(a => a.consent_status === 'objecting').length,
      'לא חתמו': bApts.filter(a => a.consent_status === 'unsigned' || a.consent_status === 'unsigned_neutral').length,
    }
  })

  // Milestones
  const completedMilestones = milestones.filter(m => m.completed_at).length
  const milestonePct = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0

  // Documents
  const docData = [
    { name: 'אושרו', value: documents.filter(d => d.status === 'approved').length, color: '#22c55e' },
    { name: 'ממתינים', value: documents.filter(d => d.status === 'pending_review').length, color: '#f59e0b' },
    { name: 'חסרים', value: documents.filter(d => d.status === 'missing').length, color: '#ef4444' },
  ].filter(d => d.value > 0)

  const total = apartments.length
  const signed = apartments.filter(a => a.consent_status === 'signed').length
  const signedPct = total > 0 ? Math.round((signed / total) * 100) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">אנליטיקה</h1>
        <p className="text-muted-foreground mt-0.5">
          {project.name} · {PROJECT_TYPE_LABELS[project.project_type]} · {STATUS_LABELS[project.status]}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="דירות סה״כ" value={String(total)} />
        <KPI label="חתמו" value={`${signed} (${signedPct}%)`} color="text-green-600" />
        <KPI label="מתנגדים" value={String(apartments.filter(a => a.consent_status === 'objecting').length)} color="text-red-600" />
        <KPI label="התקדמות אבני דרך" value={`${milestonePct}%`} color="text-blue-600" />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Consent pie */}
        {consentData.length > 0 && (
          <ChartCard title="פילוח חתימות">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={consentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}>
                  {consentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Per-building bar */}
        {buildingConsentData.length > 0 && (
          <ChartCard title="חתימות לפי בניין">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={buildingConsentData} barSize={18}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="חתמו" fill="#22c55e" stackId="a" />
                <Bar dataKey="מתנגדים" fill="#ef4444" stackId="a" />
                <Bar dataKey="לא חתמו" fill="#6b7280" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Document donut */}
        {docData.length > 0 && (
          <ChartCard title="מסמכים">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={docData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {docData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Milestones */}
        {milestones.length > 0 && (
          <ChartCard title="אבני דרך">
            <div className="space-y-2 mt-2">
              {milestones.map(m => (
                <div key={m.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={m.completed_at ? 'text-green-600 font-medium' : 'text-muted-foreground'}>{m.label}</span>
                    {m.completed_at && <span className="text-green-600 text-xs">✓</span>}
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${m.completed_at ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
                      style={{ width: m.completed_at ? '100%' : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </div>

      {/* AI Insights */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">תובנות AI</h2>
          <button
            onClick={fetchInsights}
            disabled={loadingInsights}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-60"
          >
            <RefreshCw size={14} className={loadingInsights ? 'animate-spin' : ''} aria-hidden="true" />
            {loadingInsights ? 'מנתח...' : 'רענן ניתוח'}
          </button>
        </div>

        {loadingInsights && !insights ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5 animate-pulse h-36" />
            ))}
          </div>
        ) : insights ? (
          <div className="grid md:grid-cols-3 gap-4">
            <InsightCard
              title="תובנות"
              icon={<Lightbulb size={20} className="text-blue-500" aria-hidden="true" />}
              items={insights.insights}
              bgColor="bg-blue-50 dark:bg-blue-950/20"
            />
            <InsightCard
              title="התראות"
              icon={<AlertTriangle size={20} className="text-amber-500" aria-hidden="true" />}
              items={insights.alerts.length > 0 ? insights.alerts : ['אין התראות פעילות']}
              bgColor="bg-amber-50 dark:bg-amber-950/20"
            />
            <InsightCard
              title="המלצות"
              icon={<Rocket size={20} className="text-green-500" aria-hidden="true" />}
              items={insights.tips}
              bgColor="bg-green-50 dark:bg-green-950/20"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function KPI({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-1">
      <p className={`text-2xl font-bold tabular-nums ${color ?? ''}`}>{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h3 className="font-bold mb-3">{title}</h3>
      {children}
    </div>
  )
}

function InsightCard({ title, icon, items, bgColor }: {
  title: string
  icon: React.ReactNode
  items: string[]
  bgColor: string
}) {
  return (
    <div className={`rounded-2xl border border-border p-5 space-y-3 ${bgColor}`}>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-bold">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed flex gap-2">
            <span className="shrink-0 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
