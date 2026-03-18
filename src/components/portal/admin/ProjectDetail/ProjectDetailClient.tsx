'use client'

import { useState, useMemo } from 'react'
import {
  CheckCircle2, Circle, Clock, ArrowLeft,
  Users, FileText, CalendarDays, Building2,
  MapPin, Phone, ChevronDown, ChevronUp,
  ClipboardCheck, BarChart3, Target,
  AlertTriangle, TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'
import {
  PROJECT_TYPE_LABELS,
  CONSENT_STATUS_LABELS,
  CONSENT_STATUS_COLORS,
  type ProjectType,
  type ProjectStatus,
  type ConsentStatus,
  type UserRole,
} from '@/lib/supabase/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string; name: string; project_type: ProjectType; status: ProjectStatus
  description: string | null; global_whatsapp_link: string | null
  project_manager_id: string | null; created_at: string
}
interface Building { id: string; address: string; building_number: string | null }
interface Apartment {
  id: string; unit_number: string; floor: number | null
  consent_status: ConsentStatus; building_id: string; owner_id: string | null
}
interface Milestone {
  id: string; stage: ProjectStatus; label: string; label_en: string | null
  description: string | null; target_date: string | null
  completed_at: string | null; sort_order: number
}
interface Document { id: string; type: string; status: string; source: string; created_at: string }
interface Meeting { id: string; title: string; start_time: string; end_time: string; location: string | null }
interface TeamMember { id: string; full_name: string | null; role: UserRole; building_id: string | null }
interface Contact { id: string; full_name: string; phone_raw: string }

interface Props {
  project: Project
  pm: { full_name: string | null } | null
  buildings: Building[]
  apartments: Apartment[]
  milestones: Milestone[]
  documents: Document[]
  meetings: Meeting[]
  teamMembers: TeamMember[]
  contacts: Contact[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ProjectStatus, string> = {
  pre_planning: 'טרום תכנון', planning: 'תכנון', permits: 'קבלת היתרים',
  construction: 'בנייה', finishing: 'גמר', key_delivery: 'מסירת מפתחות',
}
const STATUS_ORDER: ProjectStatus[] = [
  'pre_planning', 'planning', 'permits', 'construction', 'finishing', 'key_delivery',
]
const STATUS_ICONS: Record<ProjectStatus, string> = {
  pre_planning: '📋', planning: '🏗️', permits: '📝',
  construction: '🏚️', finishing: '🔨', key_delivery: '🗝️',
}
const ROLE_LABELS_HE: Partial<Record<UserRole, string>> = {
  resident: 'דייר', residents_representative: 'נציג דיירים',
  residents_lawyer: 'עו"ד דיירים', residents_supervisor: 'מפקח דיירים',
  developer: 'יזם', developer_lawyer: 'עו"ד יזם', developer_supervisor: 'מפקח יזם',
  project_manager: 'מנהל פרויקט',
}

type TabId = 'overview' | 'consents' | 'documents' | 'meetings' | 'team'

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProjectDetailClient({
  project, pm, buildings, apartments, milestones,
  documents, meetings, teamMembers, contacts,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [localMilestones, setLocalMilestones] = useState<Milestone[]>(milestones)
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null)

  // Stats
  const totalApts   = apartments.length
  const signed      = apartments.filter(a => a.consent_status === 'signed').length
  const objecting   = apartments.filter(a => a.consent_status === 'objecting').length
  const signedPct   = totalApts > 0 ? Math.round((signed / totalApts) * 100) : 0
  const completedMs = localMilestones.filter(m => m.completed_at).length
  const msPct       = localMilestones.length > 0 ? Math.round((completedMs / localMilestones.length) * 100) : 0
  const approvedDocs = documents.filter(d => d.status === 'approved').length
  const currentStageIdx = STATUS_ORDER.indexOf(project.status)

  async function toggleMilestone(milestone: Milestone) {
    const nowCompleted = !milestone.completed_at
    setLocalMilestones(prev =>
      prev.map(m => m.id === milestone.id
        ? { ...m, completed_at: nowCompleted ? new Date().toISOString() : null }
        : m
      )
    )
    await fetch(`/api/milestones/${milestone.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: nowCompleted }),
    })
  }

  const TABS: { id: TabId; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'overview',   label: 'סקירה',    icon: BarChart3 },
    { id: 'consents',   label: 'חתימות',   icon: ClipboardCheck, count: totalApts },
    { id: 'documents',  label: 'מסמכים',   icon: FileText,        count: documents.length },
    { id: 'meetings',   label: 'פגישות',   icon: CalendarDays,    count: meetings.length },
    { id: 'team',       label: 'צוות',     icon: Users,           count: teamMembers.length },
  ]

  return (
    <div className="space-y-6 pb-16">

      {/* Back link */}
      <Link
        href="/portal/admin/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        חזרה לפרויקטים
      </Link>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div
        className="rounded-3xl p-6 md:p-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f2035 0%, #1a3a5c 50%, #0f2035 100%)' }}
      >
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(59,130,246,0.3)', border: '1px solid rgba(59,130,246,0.5)', color: '#93c5fd' }}>
                  {PROJECT_TYPE_LABELS[project.project_type]}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7' }}>
                  {STATUS_LABELS[project.status]}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{project.name}</h1>
              {pm?.full_name && (
                <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  מנהל פרויקט: {pm.full_name}
                </p>
              )}
              {project.description && (
                <p className="mt-2 text-sm max-w-xl" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {project.description}
                </p>
              )}
            </div>

            {/* KPI mini-cards */}
            <div className="flex flex-wrap gap-3">
              <HeroKPI label="דירות" value={String(totalApts)} icon="🏠" />
              <HeroKPI label="חתמו" value={`${signedPct}%`} icon="✅" highlight={signedPct >= 66} />
              <HeroKPI label="אבני דרך" value={`${completedMs}/${localMilestones.length}`} icon="🎯" />
              <HeroKPI label="מסמכים" value={String(approvedDocs)} icon="📄" />
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <span>התקדמות כוללת</span>
              <span>{msPct}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${msPct}%`, background: 'linear-gradient(90deg, #3b82f6, #10b981)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Timeline ──────────────────────────────────────────── */}
      <div className="bg-card rounded-3xl border border-border p-6 overflow-hidden">
        <h2 className="text-xl font-bold mb-6">ציר זמן — שלבי הפרויקט</h2>

        {/* Desktop horizontal stepper */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-7 inset-x-0 h-0.5 bg-border" style={{ marginInline: '5%' }} />
            {/* Completed line overlay */}
            <div className="absolute top-7 h-0.5 transition-all duration-700"
              style={{
                insetInlineStart: '5%',
                width: `${Math.min(((currentStageIdx) / (STATUS_ORDER.length - 1)) * 90, 90)}%`,
                background: 'linear-gradient(90deg, #3b82f6, #10b981)',
              }}
            />

            <div className="relative flex justify-between">
              {STATUS_ORDER.map((stage, idx) => {
                const milestone = localMilestones.find(m => m.stage === stage)
                const isCompleted = !!milestone?.completed_at
                const isCurrent   = stage === project.status
                const isPast      = idx < currentStageIdx
                const isExpanded  = expandedMilestone === stage

                return (
                  <div key={stage} className="flex flex-col items-center gap-2 flex-1">
                    {/* Node */}
                    <button
                      onClick={() => setExpandedMilestone(isExpanded ? null : stage)}
                      aria-expanded={isExpanded}
                      aria-label={`שלב: ${STATUS_LABELS[stage]}`}
                      className="relative flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      style={isCompleted
                        ? { background: 'linear-gradient(135deg, #3b82f6, #10b981)', borderColor: '#3b82f6', boxShadow: '0 0 0 4px rgba(59,130,246,0.15)' }
                        : isCurrent
                        ? { background: 'transparent', borderColor: '#3b82f6', boxShadow: '0 0 0 4px rgba(59,130,246,0.12)', animation: 'pulse 2s infinite' }
                        : { background: 'transparent', borderColor: 'var(--border)' }
                      }
                    >
                      <span className="text-xl">{STATUS_ICONS[stage]}</span>
                      {isCompleted && (
                        <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle2 size={12} className="text-white" aria-hidden="true" />
                        </span>
                      )}
                      {isCurrent && !isCompleted && (
                        <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </button>

                    {/* Label */}
                    <div className="text-center max-w-[90px]">
                      <p className={`text-xs font-semibold leading-tight ${
                        isCompleted ? 'text-green-600' : isCurrent ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {milestone?.label ?? STATUS_LABELS[stage]}
                      </p>
                      {milestone?.completed_at && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(milestone.completed_at).toLocaleDateString('he-IL')}
                        </p>
                      )}
                      {milestone?.target_date && !milestone.completed_at && (
                        <p className="text-[10px] text-amber-600 mt-0.5">
                          יעד: {new Date(milestone.target_date).toLocaleDateString('he-IL')}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Mobile vertical timeline */}
        <div className="md:hidden space-y-0">
          {STATUS_ORDER.map((stage, idx) => {
            const milestone = localMilestones.find(m => m.stage === stage)
            const isCompleted = !!milestone?.completed_at
            const isCurrent   = stage === project.status
            const isLast      = idx === STATUS_ORDER.length - 1

            return (
              <div key={stage} className="flex gap-4">
                {/* Line + node */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 text-lg"
                    style={isCompleted
                      ? { background: 'linear-gradient(135deg, #3b82f6, #10b981)', borderColor: '#3b82f6' }
                      : isCurrent
                      ? { borderColor: '#3b82f6' }
                      : { borderColor: 'var(--border)' }
                    }
                  >
                    {STATUS_ICONS[stage]}
                  </div>
                  {!isLast && (
                    <div className="w-0.5 flex-1 my-1"
                      style={{ background: isCompleted ? '#3b82f6' : 'var(--border)' }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-5">
                  <p className={`font-semibold text-base ${
                    isCompleted ? 'text-green-600' : isCurrent ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {milestone?.label ?? STATUS_LABELS[stage]}
                  </p>
                  {milestone?.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{milestone.description}</p>
                  )}
                  {milestone?.completed_at && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ הושלם {new Date(milestone.completed_at).toLocaleDateString('he-IL')}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Expanded milestone detail (desktop) */}
        {expandedMilestone && (() => {
          const milestone = localMilestones.find(m => m.stage === expandedMilestone as ProjectStatus)
          if (!milestone) return null
          return (
            <div className="hidden md:block mt-6 bg-muted/30 rounded-2xl p-5 border border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{milestone.label}</h3>
                  {milestone.description && (
                    <p className="text-muted-foreground mt-1 leading-relaxed">{milestone.description}</p>
                  )}
                  {milestone.completed_at && (
                    <p className="text-green-600 text-sm mt-2">✓ הושלם: {new Date(milestone.completed_at).toLocaleDateString('he-IL')}</p>
                  )}
                  {milestone.target_date && !milestone.completed_at && (
                    <p className="text-amber-600 text-sm mt-2">🎯 תאריך יעד: {new Date(milestone.target_date).toLocaleDateString('he-IL')}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleMilestone(milestone)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    milestone.completed_at
                      ? 'bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                      : 'bg-primary text-primary-foreground hover:opacity-90'
                  }`}
                >
                  {milestone.completed_at ? 'בטל השלמה' : 'סמן כהושלם'}
                </button>
              </div>
            </div>
          )
        })()}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="bg-card rounded-3xl border border-border overflow-hidden">
        {/* Tab bar */}
        <div className="flex overflow-x-auto border-b border-border">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon size={16} aria-hidden="true" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'overview'  && <OverviewTab apartments={apartments} buildings={buildings} milestones={localMilestones} documents={documents} meetings={meetings} project={project} onToggleMilestone={toggleMilestone} />}
          {activeTab === 'consents'  && <ConsentsTab  apartments={apartments} buildings={buildings} project={project} />}
          {activeTab === 'documents' && <DocumentsTab documents={documents} />}
          {activeTab === 'meetings'  && <MeetingsTab  meetings={meetings} />}
          {activeTab === 'team'      && <TeamTab      teamMembers={teamMembers} contacts={contacts} buildings={buildings} pm={null} />}
        </div>
      </div>
    </div>
  )
}

// ─── HeroKPI ──────────────────────────────────────────────────────────────────

function HeroKPI({ label, value, icon, highlight }: { label: string; value: string; icon: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl px-4 py-3 text-center min-w-[80px]"
      style={{ background: highlight ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)', border: `1px solid ${highlight ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
      <div className="text-xl mb-0.5">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</div>
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ apartments, buildings, milestones, documents, meetings, project, onToggleMilestone }: {
  apartments: Apartment[]; buildings: Building[]; milestones: Milestone[]
  documents: Document[]; meetings: Meeting[]; project: Project
  onToggleMilestone: (m: Milestone) => void
}) {
  const consentData = (['signed', 'objecting', 'unsigned_neutral', 'unsigned'] as ConsentStatus[]).map(s => ({
    name: CONSENT_STATUS_LABELS[s],
    value: apartments.filter(a => a.consent_status === s).length,
    color: CONSENT_STATUS_COLORS[s],
  })).filter(d => d.value > 0)

  const docData = [
    { name: 'אושרו', value: documents.filter(d => d.status === 'approved').length, color: '#22c55e' },
    { name: 'ממתינים', value: documents.filter(d => d.status === 'pending_review').length, color: '#f59e0b' },
    { name: 'חסרים', value: documents.filter(d => d.status === 'missing').length, color: '#ef4444' },
  ].filter(d => d.value > 0)

  const upcoming = meetings.filter(m => new Date(m.start_time) > new Date()).slice(0, 3)
  const total = apartments.length
  const signed = apartments.filter(a => a.consent_status === 'signed').length
  const threshold = project.project_type === 'tama38b' ? 80 : project.project_type === 'hitarot_pratiyot' ? null : 66

  return (
    <div className="space-y-6">
      {/* Mini charts row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {consentData.length > 0 && (
          <MiniChart title="פילוח חתימות">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={consentData} dataKey="value" cx="50%" cy="50%" outerRadius={55} label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`} labelLine={false}>
                  {consentData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name]} />
              </PieChart>
            </ResponsiveContainer>
            {threshold !== null && (
              <p className={`text-xs text-center mt-1 font-medium ${total > 0 && Math.round(signed/total*100) >= threshold ? 'text-green-600' : 'text-amber-600'}`}>
                סף: {threshold}% | נוכחי: {total > 0 ? Math.round(signed/total*100) : 0}%
              </p>
            )}
          </MiniChart>
        )}

        {docData.length > 0 && (
          <MiniChart title="מסמכים">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={docData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55}>
                  {docData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-xs text-center mt-1 text-muted-foreground">{documents.length} מסמכים סה"כ</p>
          </MiniChart>
        )}

        {/* Buildings summary */}
        <MiniChart title="בניינים">
          <div className="space-y-2 mt-2">
            {buildings.map(b => {
              const bApts = apartments.filter(a => a.building_id === b.id)
              const bSigned = bApts.filter(a => a.consent_status === 'signed').length
              const pct = bApts.length > 0 ? Math.round(bSigned / bApts.length * 100) : 0
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="truncate max-w-[140px]">{b.address}</span>
                    <span className="text-muted-foreground">{bSigned}/{bApts.length}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {buildings.length === 0 && <p className="text-sm text-muted-foreground">אין בניינים</p>}
          </div>
        </MiniChart>
      </div>

      {/* Milestone checklist */}
      <div>
        <h3 className="font-bold mb-3">אבני דרך</h3>
        <div className="space-y-2">
          {milestones.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <button onClick={() => onToggleMilestone(m)} aria-label={`סמן ${m.label} כ${m.completed_at ? 'לא הושלם' : 'הושלם'}`}>
                {m.completed_at
                  ? <CheckCircle2 size={22} className="text-green-500 shrink-0" aria-hidden="true" />
                  : <Circle size={22} className="text-muted-foreground shrink-0" aria-hidden="true" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${m.completed_at ? 'line-through text-muted-foreground' : ''}`}>
                  {m.label}
                </p>
                {m.completed_at && (
                  <p className="text-xs text-green-600">{new Date(m.completed_at).toLocaleDateString('he-IL')}</p>
                )}
                {m.target_date && !m.completed_at && (
                  <p className="text-xs text-amber-600">יעד: {new Date(m.target_date).toLocaleDateString('he-IL')}</p>
                )}
              </div>
              {m.description && (
                <p className="text-xs text-muted-foreground hidden lg:block max-w-xs truncate">{m.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming meetings */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="font-bold mb-3">פגישות קרובות</h3>
          <div className="space-y-2">
            {upcoming.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <CalendarDays size={18} className="text-primary shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium text-sm">{m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.start_time).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                    {m.location && ` · ${m.location}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Consents Tab ─────────────────────────────────────────────────────────────

function ConsentsTab({ apartments, buildings, project }: { apartments: Apartment[]; buildings: Building[]; project: Project }) {
  const threshold = project.project_type === 'tama38b' ? 80 : project.project_type === 'hitarot_pratiyot' ? null : 66
  const total  = apartments.length
  const signed = apartments.filter(a => a.consent_status === 'signed').length
  const pct    = total > 0 ? Math.round(signed / total * 100) : 0

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30">
        <div className="text-3xl font-bold tabular-nums text-green-600">{pct}%</div>
        <div>
          <p className="font-semibold">{signed} מתוך {total} חתמו</p>
          {threshold !== null && (
            <p className={`text-sm ${pct >= threshold ? 'text-green-600' : 'text-amber-600'}`}>
              {pct >= threshold ? '✓ הגעתם לסף הנדרש' : `נדרשים עוד ${threshold - pct}% (סף: ${threshold}%)`}
            </p>
          )}
        </div>
      </div>

      {/* Per building */}
      {buildings.map(b => {
        const bApts = apartments.filter(a => a.building_id === b.id)
        const bSigned = bApts.filter(a => a.consent_status === 'signed').length
        const bPct = bApts.length > 0 ? Math.round(bSigned / bApts.length * 100) : 0

        return (
          <div key={b.id} className="border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-muted/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-muted-foreground" aria-hidden="true" />
                <span className="font-semibold">{b.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all" style={{ width: `${bPct}%` }} />
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">{bSigned}/{bApts.length}</span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {bApts.map(apt => (
                <div key={apt.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">דירה {apt.unit_number}{apt.floor !== null ? ` (קומה ${apt.floor})` : ''}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: `${CONSENT_STATUS_COLORS[apt.consent_status]}20`, color: CONSENT_STATUS_COLORS[apt.consent_status], border: `1px solid ${CONSENT_STATUS_COLORS[apt.consent_status]}40` }}>
                    {CONSENT_STATUS_LABELS[apt.consent_status]}
                  </span>
                </div>
              ))}
              {bApts.length === 0 && (
                <p className="px-4 py-3 text-sm text-muted-foreground">אין דירות בבניין זה</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Documents Tab ────────────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
  id_card: 'תעודת זהות', tabu: 'נסח טאבו', signed_contract: 'חוזה חתום',
  permit: 'היתר', municipal_approval: 'אישור עירייה', construction_plan: 'תוכנית בנייה', other: 'אחר',
}
const DOC_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  approved:       { label: 'אושר',       color: '#22c55e' },
  pending_review: { label: 'בבדיקה',     color: '#f59e0b' },
  missing:        { label: 'חסר',        color: '#ef4444' },
}

function DocumentsTab({ documents }: { documents: Document[] }) {
  if (documents.length === 0) return <p className="text-muted-foreground">אין מסמכים עדיין</p>

  const grouped = documents.reduce<Record<string, Document[]>>((acc, d) => {
    acc[d.status] = [...(acc[d.status] ?? []), d]
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        {Object.entries(DOC_STATUS_LABELS).map(([status, info]) => {
          const count = (grouped[status] ?? []).length
          return (
            <div key={status} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 text-sm">
              <span className="w-2 h-2 rounded-full" style={{ background: info.color }} />
              <span>{info.label}: <strong>{count}</strong></span>
            </div>
          )
        })}
      </div>

      <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden">
        {documents.map(doc => {
          const statusInfo = DOC_STATUS_LABELS[doc.status]
          return (
            <div key={doc.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
              <div>
                <span className="font-medium">{DOC_TYPE_LABELS[doc.type] ?? doc.type}</span>
                <span className="ms-2 text-xs text-muted-foreground">{doc.source}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString('he-IL')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: `${statusInfo?.color ?? '#888'}20`, color: statusInfo?.color ?? '#888', border: `1px solid ${statusInfo?.color ?? '#888'}40` }}>
                  {statusInfo?.label ?? doc.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Meetings Tab ─────────────────────────────────────────────────────────────

function MeetingsTab({ meetings }: { meetings: Meeting[] }) {
  if (meetings.length === 0) return <p className="text-muted-foreground">אין פגישות עדיין</p>

  const now = new Date()
  const upcoming = meetings.filter(m => new Date(m.start_time) >= now)
  const past     = meetings.filter(m => new Date(m.start_time) < now)

  const MeetingItem = ({ m }: { m: Meeting }) => (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/30 border border-border">
      <div className="shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center"
        style={{ background: new Date(m.start_time) >= now ? 'rgba(59,130,246,0.1)' : 'var(--muted)' }}>
        <span className="text-lg font-bold leading-none" style={{ color: new Date(m.start_time) >= now ? '#3b82f6' : undefined }}>
          {new Date(m.start_time).getDate()}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {new Date(m.start_time).toLocaleDateString('he-IL', { month: 'short' })}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{m.title}</p>
        <p className="text-sm text-muted-foreground">
          {new Date(m.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}–
          {new Date(m.end_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
          {m.location && ` · 📍 ${m.location}`}
        </p>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {upcoming.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">פגישות קרובות</h3>
          <div className="space-y-2">{upcoming.map(m => <MeetingItem key={m.id} m={m} />)}</div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">פגישות שהתקיימו</h3>
          <div className="space-y-2 opacity-60">{past.map(m => <MeetingItem key={m.id} m={m} />)}</div>
        </div>
      )}
    </div>
  )
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────

function TeamTab({ teamMembers, contacts, buildings, pm }: {
  teamMembers: TeamMember[]
  contacts: Contact[]
  buildings: Building[]
  pm: { full_name: string | null } | null
}) {
  const buildingMap = Object.fromEntries(buildings.map(b => [b.id, b.address]))

  return (
    <div className="space-y-6">
      {/* Team members */}
      {teamMembers.length > 0 && (
        <div>
          <h3 className="font-bold mb-3">חברי הצוות</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {teamMembers.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-muted/20">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                  {(member.full_name ?? '?')[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{member.full_name ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">{ROLE_LABELS_HE[member.role] ?? member.role}</p>
                  {member.building_id && buildingMap[member.building_id] && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin size={10} aria-hidden="true" />
                      {buildingMap[member.building_id]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contacts */}
      {contacts.length > 0 && (
        <div>
          <h3 className="font-bold mb-3">אנשי קשר ({contacts.length})</h3>
          <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden">
            {contacts.slice(0, 20).map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{c.full_name}</span>
                <a href={`tel:${c.phone_raw}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                  <Phone size={13} aria-hidden="true" />
                  <span dir="ltr">{c.phone_raw}</span>
                </a>
              </div>
            ))}
            {contacts.length > 20 && (
              <div className="px-4 py-3 text-sm text-muted-foreground">ועוד {contacts.length - 20} אנשי קשר נוספים</div>
            )}
          </div>
        </div>
      )}

      {teamMembers.length === 0 && contacts.length === 0 && (
        <p className="text-muted-foreground">לא שויכו עדיין חברי צוות לפרויקט</p>
      )}
    </div>
  )
}

// ─── MiniChart wrapper ────────────────────────────────────────────────────────

function MiniChart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-muted/20 rounded-2xl p-4 border border-border">
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      {children}
    </div>
  )
}
