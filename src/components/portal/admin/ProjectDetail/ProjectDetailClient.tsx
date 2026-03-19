'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  CheckCircle2, Circle, Clock, ArrowLeft,
  Users, FileText, CalendarDays, Building2,
  MapPin, Phone, ChevronDown, ChevronUp,
  ClipboardCheck, BarChart3, Target,
  AlertTriangle, TrendingUp, Bot, Send, Pencil, X, Upload, Plus,
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
  type TikBinyanRow,
  type TikBinyanParsedData,
} from '@/lib/supabase/types'
import { MUNICIPALITY_OPTIONS } from '@/lib/tik-binyan/municipalities'

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
  consent_notes: string | null
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
  tikBinyan: TikBinyanRow | null
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

type TabId = 'overview' | 'consents' | 'documents' | 'meetings' | 'team' | 'tik_binyan' | 'ai'

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProjectDetailClient({
  project, pm, buildings, apartments, milestones,
  documents, meetings, teamMembers, contacts, tikBinyan,
}: Props) {
  const [activeTab,         setActiveTab]         = useState<TabId>('overview')
  const [localMilestones,   setLocalMilestones]   = useState<Milestone[]>(milestones)
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null)
  const [localMeetings,     setLocalMeetings]     = useState<Meeting[]>(meetings)
  const [localApts,         setLocalApts]         = useState<Apartment[]>(apartments)
  const [localDocs,         setLocalDocs]         = useState<Document[]>(documents)
  const [editingApt,        setEditingApt]        = useState<Apartment | null>(null)

  // Stats
  const totalApts    = localApts.length
  const signed       = localApts.filter(a => a.consent_status === 'signed').length
  const objecting    = localApts.filter(a => a.consent_status === 'objecting').length
  const signedPct    = totalApts > 0 ? Math.round((signed / totalApts) * 100) : 0
  const completedMs  = localMilestones.filter(m => m.completed_at).length
  const msPct        = localMilestones.length > 0 ? Math.round((completedMs / localMilestones.length) * 100) : 0
  const approvedDocs = localDocs.filter(d => d.status === 'approved').length
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
    { id: 'documents',  label: 'מסמכים',   icon: FileText,        count: localDocs.length },
    { id: 'meetings',   label: 'פגישות',   icon: CalendarDays,    count: localMeetings.length },
    { id: 'team',       label: 'צוות',     icon: Users,           count: teamMembers.length },
    { id: 'tik_binyan', label: 'תיק בניין', icon: Building2 },
    { id: 'ai',         label: 'עוזר AI',  icon: Bot },
  ]

  function handleAptSaved(id: string, updates: Partial<Apartment>) {
    setLocalApts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
  }

  return (
    <div className="space-y-6 pb-16">

      {/* Apartment edit modal */}
      {editingApt && (
        <AptEditModal
          apt={editingApt}
          residents={teamMembers}
          onClose={() => setEditingApt(null)}
          onSaved={updates => { handleAptSaved(editingApt.id, updates) }}
        />
      )}

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
          {activeTab === 'overview'  && <OverviewTab apartments={localApts} buildings={buildings} milestones={localMilestones} documents={localDocs} meetings={localMeetings} project={project} onToggleMilestone={toggleMilestone} />}
          {activeTab === 'consents'  && <ConsentsTab  apartments={localApts} buildings={buildings} project={project} onEditApt={setEditingApt} residents={teamMembers} />}
          {activeTab === 'documents' && <DocumentsTab documents={localDocs} projectId={project.id} onUploaded={doc => setLocalDocs(prev => [doc, ...prev])} />}
          {activeTab === 'meetings'  && <MeetingsTab  meetings={localMeetings} projectId={project.id} onCreated={m => setLocalMeetings(prev => [...prev, m])} />}
          {activeTab === 'team'      && <TeamTab      teamMembers={teamMembers} contacts={contacts} buildings={buildings} pm={pm} projectId={project.id} />}
          {activeTab === 'tik_binyan' && <TikBinyanTab projectId={project.id} initialData={tikBinyan} />}
          {activeTab === 'ai'        && <AIChatTab    project={project} signedPct={signedPct} totalApts={totalApts} />}
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

function ConsentsTab({ apartments, buildings, project, onEditApt, residents }: {
  apartments: Apartment[]; buildings: Building[]; project: Project
  onEditApt: (apt: Apartment) => void
  residents: TeamMember[]
}) {
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
              {bApts.map(apt => {
                const owner = residents.find(r => r.id === apt.owner_id)
                return (
                  <div key={apt.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <span className="font-medium">דירה {apt.unit_number}{apt.floor !== null ? ` (קומה ${apt.floor})` : ''}</span>
                      {owner && <span className="ms-2 text-xs text-muted-foreground">· {owner.full_name}</span>}
                      {apt.consent_notes && <p className="text-xs text-muted-foreground mt-0.5">{apt.consent_notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: `${CONSENT_STATUS_COLORS[apt.consent_status]}20`, color: CONSENT_STATUS_COLORS[apt.consent_status], border: `1px solid ${CONSENT_STATUS_COLORS[apt.consent_status]}40` }}>
                        {CONSENT_STATUS_LABELS[apt.consent_status]}
                      </span>
                      <button onClick={() => onEditApt(apt)} aria-label={`ערוך דירה ${apt.unit_number}`}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )
              })}
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

function DocumentsTab({ documents, projectId, onUploaded }: {
  documents: Document[]
  projectId: string
  onUploaded: (doc: Document) => void
}) {
  const [showForm,  setShowForm]  = useState(false)
  const [file,      setFile]      = useState<File | null>(null)
  const [docType,   setDocType]   = useState('other')
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setUploadErr('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', docType)
    fd.append('source', 'admin')
    fd.append('projectId', projectId)
    const res = await fetch('/api/documents/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (!res.ok) { setUploadErr(data.error ?? 'שגיאה'); return }
    onUploaded(data.document)
    setFile(null)
    setShowForm(false)
  }

  const grouped = documents.reduce<Record<string, Document[]>>((acc, d) => {
    acc[d.status] = [...(acc[d.status] ?? []), d]
    return acc
  }, {})

  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex justify-between items-center">
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
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Upload size={15} aria-hidden="true" />
          העלה מסמך
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold">העלאת מסמך חדש</h3>
          <div>
            <label className="block text-sm font-medium mb-1">סוג מסמך</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} className={inputClass} aria-label="סוג מסמך">
              {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">קובץ (PDF / JPG / PNG)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm" aria-label="בחר קובץ" />
          </div>
          {uploadErr && <p className="text-sm text-destructive">{uploadErr}</p>}
          <div className="flex gap-2">
            <button onClick={handleUpload} disabled={!file || uploading}
              className="flex-1 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60">
              {uploading ? 'מעלה...' : 'העלה'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">ביטול</button>
          </div>
        </div>
      )}

      {documents.length === 0 && !showForm && <p className="text-muted-foreground">אין מסמכים עדיין</p>}

      {documents.length > 0 && (
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
      )}
    </div>
  )
}

// ─── Meetings Tab ─────────────────────────────────────────────────────────────

function MeetingsTab({ meetings, projectId, onCreated }: {
  meetings: Meeting[]
  projectId: string
  onCreated: (m: Meeting) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ title: '', date: '', start_time: '', duration: '60', location: '' })
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.date || !form.start_time) { setErr('יש למלא כותרת, תאריך ושעת התחלה'); return }
    setSaving(true); setErr('')
    const startDate = new Date(`${form.date}T${form.start_time}`)
    const endDate = new Date(startDate.getTime() + parseInt(form.duration) * 60000)
    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        title: form.title,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        location: form.location || undefined,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(data.error ?? 'שגיאה'); return }
    onCreated(data.meeting)
    setForm({ title: '', date: '', start_time: '', duration: '60', location: '' })
    setShowForm(false)
  }

  const now = new Date()
  const upcoming = meetings.filter(m => new Date(m.start_time) >= now)
  const past     = meetings.filter(m => new Date(m.start_time) < now)

  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring'

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
      <div className="flex justify-end">
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={15} aria-hidden="true" />
          פגישה חדשה
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-muted/30 border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold">פגישה חדשה</h3>
          <div>
            <label className="block text-sm font-medium mb-1">כותרת *</label>
            <input value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))}
              placeholder="לדוגמא: אסיפת דיירים" className={inputClass} aria-label="כותרת פגישה" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">תאריך *</label>
              <input type="date" value={form.date} onChange={e => setForm(s => ({ ...s, date: e.target.value }))}
                className={inputClass} dir="ltr" aria-label="תאריך" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">שעת התחלה *</label>
              <input type="time" value={form.start_time} onChange={e => setForm(s => ({ ...s, start_time: e.target.value }))}
                className={inputClass} dir="ltr" aria-label="שעת התחלה" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">משך הפגישה</label>
              <select value={form.duration} onChange={e => setForm(s => ({ ...s, duration: e.target.value }))}
                className={inputClass} aria-label="משך פגישה">
                <option value="30">30 דקות</option>
                <option value="60">שעה</option>
                <option value="90">שעה וחצי</option>
                <option value="120">שעתיים</option>
                <option value="180">3 שעות</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">מיקום (אופציונלי)</label>
            <input value={form.location} onChange={e => setForm(s => ({ ...s, location: e.target.value }))}
              placeholder="לדוגמא: משרד עו״ד, זום" className={inputClass} aria-label="מיקום" />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex-1 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60">
              {saving ? 'שומר...' : 'צור פגישה'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">ביטול</button>
          </div>
        </form>
      )}

      {meetings.length === 0 && !showForm && <p className="text-muted-foreground">אין פגישות עדיין</p>}

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

function TeamTab({ teamMembers, contacts: initialContacts, buildings, pm, projectId }: {
  teamMembers: TeamMember[]
  contacts: Contact[]
  buildings: Building[]
  pm: { full_name: string | null } | null
  projectId: string
}) {
  const buildingMap = Object.fromEntries(buildings.map(b => [b.id, b.address]))
  const [contacts,    setContacts]    = useState<Contact[]>(initialContacts)
  const [showImport,  setShowImport]  = useState(false)
  const [importText,  setImportText]  = useState('')
  const [parsed,      setParsed]      = useState<{ full_name: string; phone_raw: string; phone_wa: string; building: string | null }[]>([])
  const [parsing,     setParsing]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [importErr,   setImportErr]   = useState('')
  const [waGroupLink, setWaGroupLink] = useState('')
  const [waMsg,       setWaMsg]       = useState('שלום, אתם מוזמנים להצטרף למערכת UrbanOS לניהול הפרויקט שלנו.')

  async function handleFileUpload(file: File) {
    setParsing(true); setImportErr(''); setParsed([])
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/contacts/parse', { method: 'POST', body: fd })
    const data = await res.json()
    setParsing(false)
    if (!res.ok) { setImportErr(data.error ?? 'שגיאה בניתוח הקובץ'); return }
    setParsed(data.contacts ?? [])
  }

  function parseText() {
    const IL_PHONE_RE = /0[5-9]\d[-\s]?\d{3}[-\s]?\d{4}/g
    const lines = importText.split(/\r?\n/)
    const result: { full_name: string; phone_raw: string; phone_wa: string; building: string | null }[] = []
    for (const line of lines) {
      const t = line.trim(); if (!t) continue
      const phones = t.match(IL_PHONE_RE); if (!phones) continue
      const firstIdx = t.search(IL_PHONE_RE)
      const name = t.slice(0, firstIdx).replace(/^[\d\s.,;:\-–—|/\\()[\]{}]+/, '').trim()
      for (const phone of phones) {
        const digits = phone.replace(/[-\s]/g, '')
        result.push({ full_name: name || 'לא ידוע', phone_raw: phone, phone_wa: '972' + digits.slice(1), building: null })
      }
    }
    setParsed(result)
  }

  async function saveContacts() {
    if (parsed.length === 0) return
    setSaving(true)
    const res = await fetch('/api/contacts/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, contacts: parsed.map(c => ({ ...c, building_id: null })) }),
    })
    if (res.ok) {
      setContacts(prev => [...prev, ...parsed.map((c, i) => ({ id: `new-${i}-${Date.now()}`, full_name: c.full_name, phone_raw: c.phone_raw }))])
      setImportText(''); setParsed([]); setShowImport(false)
    }
    setSaving(false)
  }

  function waLink(phoneWa: string) {
    let text = waMsg
    if (waGroupLink.trim()) text += `\n\nהצטרפות לקבוצת ווצאפ: ${waGroupLink.trim()}`
    return `https://wa.me/${phoneWa}?text=${encodeURIComponent(text)}`
  }

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

      {/* Contacts with WhatsApp */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">אנשי קשר ({contacts.length})</h3>
          <button onClick={() => setShowImport(s => !s)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
            <Plus size={14} aria-hidden="true" />
            ייבוא אנשי קשר
          </button>
        </div>

        {/* WhatsApp settings */}
        {contacts.length > 0 && (
          <div className="mb-3 p-4 rounded-xl bg-muted/30 border border-border space-y-2">
            <p className="text-sm font-semibold">🟢 הגדרות ווצאפ לשליחה</p>
            <textarea value={waMsg} onChange={e => setWaMsg(e.target.value)} rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="הודעת הזמנה..." aria-label="הודעת ווצאפ" />
            <input value={waGroupLink} onChange={e => setWaGroupLink(e.target.value)}
              placeholder="קישור לקבוצת ווצאפ (אופציונלי)"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="קישור קבוצת ווצאפ" />
          </div>
        )}

        {/* Import form */}
        {showImport && (
          <div className="mb-4 p-4 rounded-2xl border border-border bg-muted/20 space-y-4">
            {/* File upload */}
            <div>
              <p className="text-sm font-semibold mb-2">📎 העלאת קובץ (CSV / Word / PDF) — ה-AI יקרא ויחלץ אוטומטית:</p>
              <label className="flex items-center justify-center gap-2 w-full py-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-muted/30 cursor-pointer transition-colors text-sm text-muted-foreground">
                <Upload size={18} aria-hidden="true" />
                {parsing ? 'מנתח קובץ...' : 'לחץ לבחירת קובץ'}
                <input type="file" accept=".csv,.doc,.docx,.pdf,.txt" className="sr-only"
                  disabled={parsing}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
                  aria-label="העלה קובץ אנשי קשר" />
              </label>
            </div>

            {/* OR divider + manual text */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              <span>או הכנס ידנית</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={4}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={'ישראל ישראלי 050-1234567\nרחל כהן 052-9876543'}
              aria-label="רשימת אנשי קשר ידנית" />
            <div className="flex gap-2">
              <button onClick={parseText} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">נתח טקסט</button>
              <button onClick={() => { setShowImport(false); setParsed([]); setImportErr('') }} className="px-3 py-2 rounded-lg text-sm hover:bg-muted">ביטול</button>
            </div>

            {importErr && <p className="text-sm text-destructive">{importErr}</p>}

            {/* Preview */}
            {parsed.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-green-600">✓ נמצאו {parsed.length} אנשי קשר:</p>
                <div className="max-h-48 overflow-y-auto divide-y divide-border border border-border rounded-lg">
                  {parsed.map((c, i) => (
                    <div key={i} className="px-3 py-2 grid grid-cols-3 gap-2 text-sm">
                      <span className="font-medium truncate">{c.full_name}</span>
                      <span dir="ltr" className="text-muted-foreground">{c.phone_raw}</span>
                      <span className="text-muted-foreground text-xs truncate">{c.building ?? '—'}</span>
                    </div>
                  ))}
                </div>
                <button onClick={saveContacts} disabled={saving}
                  className="w-full rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                  {saving ? 'שומר...' : `💾 שמור ${parsed.length} אנשי קשר`}
                </button>
              </div>
            )}
          </div>
        )}

        {contacts.length > 0 && (
          <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden">
            {contacts.map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{c.full_name}</span>
                <div className="flex items-center gap-3">
                  <a href={`tel:${c.phone_raw}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                    <Phone size={13} aria-hidden="true" />
                    <span dir="ltr">{c.phone_raw}</span>
                  </a>
                  <a href={waLink('972' + (c.phone_raw ?? '').replace(/[-\s]/g, '').slice(1))}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: 'rgba(37,211,102,0.12)', color: '#25d366' }}
                    aria-label={`שלח ווצאפ ל-${c.full_name}`}>
                    💬 שלח
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {contacts.length === 0 && !showImport && teamMembers.length === 0 && (
          <p className="text-muted-foreground">לא שויכו עדיין חברי צוות לפרויקט</p>
        )}
      </div>
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

// ─── Apartment Edit Modal ─────────────────────────────────────────────────────

function AptEditModal({ apt, residents, onClose, onSaved }: {
  apt: Apartment
  residents: TeamMember[]
  onClose: () => void
  onSaved: (updated: Partial<Apartment>) => void
}) {
  const [unitNumber, setUnitNumber] = useState(apt.unit_number)
  const [notes,      setNotes]      = useState(apt.consent_notes ?? '')
  const [ownerId,    setOwnerId]    = useState(apt.owner_id ?? '')
  const [saving,     setSaving]     = useState(false)
  const [err,        setErr]        = useState('')

  async function handleSave() {
    setSaving(true); setErr('')
    const res = await fetch(`/api/apartments/${apt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitNumber, notes, ownerId }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(data.error ?? 'שגיאה'); return }
    onSaved({ unit_number: unitNumber, consent_notes: notes || null, owner_id: ownerId || null })
    onClose()
  }

  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">עריכת דירה {apt.unit_number}</h3>
          <button onClick={onClose} aria-label="סגור" className="p-1 rounded-lg hover:bg-muted"><X size={18} /></button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">מספר/שם דירה</label>
          <input value={unitNumber} onChange={e => setUnitNumber(e.target.value)} className={inputClass} aria-label="מספר דירה" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">הערות</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inputClass} aria-label="הערות" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">שיוך דייר</label>
          <select value={ownerId} onChange={e => setOwnerId(e.target.value)} className={inputClass} aria-label="שיוך דייר">
            <option value="">— ללא דייר —</option>
            {residents.map(r => <option key={r.id} value={r.id}>{r.full_name ?? r.id} ({ROLE_LABELS_HE[r.role] ?? r.role})</option>)}
          </select>
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}
        <button onClick={handleSave} disabled={saving}
          className="w-full rounded-xl bg-primary text-primary-foreground px-4 py-2.5 font-semibold hover:opacity-90 disabled:opacity-60">
          {saving ? 'שומר...' : 'שמור'}
        </button>
      </div>
    </div>
  )
}

// ─── Tik Binyan Tab ──────────────────────────────────────────────────────────

const SEARCH_TYPE_LABELS: Record<string, string> = {
  file_number: 'מספר תיק', request_number: 'מספר בקשה',
  address: 'כתובת', gush_helka: 'גוש/חלקה',
}
const SYNC_STATUS_STYLE: Record<string, { label: string; color: string }> = {
  pending:  { label: 'ממתין',    color: '#6b7280' },
  syncing:  { label: 'מסנכרן...', color: '#3b82f6' },
  success:  { label: 'מסונכרן',  color: '#22c55e' },
  error:    { label: 'שגיאה',    color: '#ef4444' },
}

function TikBinyanTab({ projectId, initialData }: { projectId: string; initialData: TikBinyanRow | null }) {
  const [tik, setTik]          = useState(initialData)
  const [saving, setSaving]    = useState(false)
  const [syncing, setSyncing]  = useState(false)
  const [err, setErr]          = useState('')

  // Setup form
  const [municipality, setMunicipality] = useState(tik?.municipality ?? '')
  const [searchType, setSearchType]     = useState<string>(tik?.search_type ?? 'file_number')
  const [fileNumber, setFileNumber]     = useState(tik?.file_number ?? '')
  const [requestNum, setRequestNum]     = useState(tik?.request_number ?? '')
  const [address, setAddress]           = useState(tik?.address ?? '')
  const [gush, setGush]                 = useState(tik?.gush ?? '')
  const [helka, setHelka]               = useState(tik?.helka ?? '')

  async function handleSave() {
    if (!municipality) { setErr('יש לבחור עירייה'); return }
    setSaving(true); setErr('')
    const res = await fetch('/api/tik-binyan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId, municipality, search_type: searchType,
        file_number: fileNumber || undefined,
        request_number: requestNum || undefined,
        address: address || undefined,
        gush: gush || undefined, helka: helka || undefined,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(data.error ?? 'שגיאה'); return }
    setTik(data.tikBinyan)
    // Auto-sync after save
    triggerSync(data.tikBinyan.id)
  }

  async function triggerSync(id?: string) {
    const tikId = id ?? tik?.id
    if (!tikId) return
    setSyncing(true); setErr('')
    const res = await fetch('/api/tik-binyan/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tikBinyanId: tikId }),
    })
    const data = await res.json()
    setSyncing(false)
    if (!res.ok) { setErr(data.error ?? 'שגיאת סנכרון'); return }
    // Refresh tik data
    const refreshRes = await fetch(`/api/tik-binyan?project_id=${projectId}`)
    const refreshData = await refreshRes.json()
    if (refreshData.tikBinyan) setTik(refreshData.tikBinyan)
  }

  const inputClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring'
  const parsed = tik?.parsed_data as TikBinyanParsedData | undefined

  // ─── No tik configured: Setup form ───
  if (!tik) {
    return (
      <div className="space-y-4 max-w-lg">
        <div>
          <h3 className="font-bold text-lg mb-1">חיבור תיק בניין עירוני</h3>
          <p className="text-sm text-muted-foreground">חבר את הפרויקט למערכת תיקי הבניין של העירייה לקבלת עדכונים אוטומטיים</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">עירייה *</label>
          <select value={municipality} onChange={e => setMunicipality(e.target.value)} className={inputClass} aria-label="בחר עירייה">
            <option value="">— בחר עירייה —</option>
            {MUNICIPALITY_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">חיפוש לפי</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SEARCH_TYPE_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => setSearchType(key)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${searchType === key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {searchType === 'file_number' && (
          <div>
            <label className="block text-sm font-medium mb-1">מספר תיק</label>
            <input value={fileNumber} onChange={e => setFileNumber(e.target.value)} className={inputClass} placeholder="לדוגמא: 12345" dir="ltr" aria-label="מספר תיק" />
          </div>
        )}
        {searchType === 'request_number' && (
          <div>
            <label className="block text-sm font-medium mb-1">מספר בקשה</label>
            <input value={requestNum} onChange={e => setRequestNum(e.target.value)} className={inputClass} placeholder="לדוגמא: 2024-001" dir="ltr" aria-label="מספר בקשה" />
          </div>
        )}
        {searchType === 'address' && (
          <div>
            <label className="block text-sm font-medium mb-1">כתובת</label>
            <input value={address} onChange={e => setAddress(e.target.value)} className={inputClass} placeholder="לדוגמא: אבא הלל 96" aria-label="כתובת" />
          </div>
        )}
        {searchType === 'gush_helka' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">גוש</label>
              <input value={gush} onChange={e => setGush(e.target.value)} className={inputClass} dir="ltr" aria-label="גוש" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">חלקה</label>
              <input value={helka} onChange={e => setHelka(e.target.value)} className={inputClass} dir="ltr" aria-label="חלקה" />
            </div>
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}

        <button onClick={handleSave} disabled={saving}
          className="w-full rounded-xl bg-primary text-primary-foreground px-4 py-3 font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
          {saving ? 'שומר...' : 'שמור והתחל סנכרון'}
        </button>
      </div>
    )
  }

  // ─── Tik configured: Show data ───
  const statusStyle = SYNC_STATUS_STYLE[tik.sync_status] ?? SYNC_STATUS_STYLE.pending
  const munLabel = MUNICIPALITY_OPTIONS.find(m => m.value === tik.municipality)?.label ?? tik.municipality

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-bold text-lg">תיק בניין — {munLabel}</h3>
          <p className="text-sm text-muted-foreground">
            {SEARCH_TYPE_LABELS[tik.search_type]}: <strong dir="ltr">{tik.file_number || tik.request_number || tik.address || `${tik.gush}/${tik.helka}`}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: `${statusStyle.color}15`, color: statusStyle.color, border: `1px solid ${statusStyle.color}40` }}>
            {statusStyle.label}
          </span>
          <button onClick={() => triggerSync()} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
            {syncing ? 'מסנכרן...' : 'סנכרן עכשיו'}
          </button>
        </div>
      </div>

      {tik.last_sync_at && (
        <p className="text-xs text-muted-foreground">סנכרון אחרון: {new Date(tik.last_sync_at).toLocaleString('he-IL')}</p>
      )}
      {tik.sync_error && (
        <div className="rounded-xl px-4 py-3 text-sm bg-destructive/10 text-destructive border border-destructive/20">
          שגיאה: {tik.sync_error}
        </div>
      )}
      {err && <p className="text-sm text-destructive">{err}</p>}

      {/* Parsed data */}
      {parsed && parsed.permit_status && (
        <div className="space-y-4">
          {/* Status + key info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoCard label="סטטוס" value={parsed.permit_status} />
            <InfoCard label="סוג היתר" value={parsed.permit_type ?? '—'} />
            <InfoCard label="מבקש" value={parsed.applicant ?? '—'} />
            <InfoCard label="תאריך החלטה" value={parsed.decision_date ? new Date(parsed.decision_date).toLocaleDateString('he-IL') : '—'} />
          </div>

          {parsed.request_description && (
            <div className="p-4 rounded-2xl bg-muted/30 border border-border">
              <p className="text-sm font-semibold mb-1">תיאור הבקשה</p>
              <p className="text-sm text-muted-foreground">{parsed.request_description}</p>
            </div>
          )}

          {/* AI Summary */}
          {parsed.raw_summary && (
            <div className="p-4 rounded-2xl border border-border" style={{ background: 'rgba(59,130,246,0.05)' }}>
              <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                <Bot size={16} aria-hidden="true" style={{ color: '#3b82f6' }} />
                סיכום AI
                {parsed.confidence !== undefined && (
                  <span className="text-xs text-muted-foreground">({Math.round(parsed.confidence * 100)}% ביטחון)</span>
                )}
              </p>
              <p className="text-sm text-foreground leading-relaxed">{parsed.raw_summary}</p>
            </div>
          )}

          {/* Timeline */}
          {parsed.timeline && parsed.timeline.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">ציר זמן</h4>
              <div className="space-y-3 relative">
                <div className="absolute top-2 bottom-2 start-[7px] w-0.5 bg-border" />
                {parsed.timeline.map((item, i) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className="shrink-0 w-4 h-4 rounded-full bg-primary mt-0.5 z-10" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">{item.event}</span>
                        {item.date && <span className="text-xs text-muted-foreground" dir="ltr">{item.date}</span>}
                      </div>
                      {item.details && <p className="text-sm text-muted-foreground mt-0.5">{item.details}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditions */}
          {parsed.conditions && parsed.conditions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">תנאים</h4>
              <ul className="space-y-1.5">
                {parsed.conditions.map((c, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="shrink-0 text-primary">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Edit config */}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">ערוך הגדרות חיפוש</summary>
        <div className="mt-3 space-y-3 max-w-lg">
          <div>
            <label className="block text-sm font-medium mb-1">עירייה</label>
            <select value={municipality} onChange={e => setMunicipality(e.target.value)} className={inputClass} aria-label="עירייה">
              {MUNICIPALITY_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">מספר תיק</label>
            <input value={fileNumber} onChange={e => setFileNumber(e.target.value)} className={inputClass} dir="ltr" aria-label="מספר תיק" />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60">
            {saving ? 'שומר...' : 'עדכן וסנכרן'}
          </button>
        </div>
      </details>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-muted/30 border border-border">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-semibold text-sm truncate">{value}</p>
    </div>
  )
}

// ─── AI Chat Tab ──────────────────────────────────────────────────────────────

interface ChatMessage { role: 'user' | 'assistant'; content: string }

function AIChatTab({ project, signedPct, totalApts }: {
  project: Project
  signedPct: number
  totalApts: number
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const SUGGESTED = ['מה המצב הנוכחי?', 'מה עלי לעשות הבא?', 'מה אחוז החתימות הנדרש?', 'כיצד להתמודד עם מתנגדים?']

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const projectContext = {
      name: project.name,
      type: project.project_type,
      status: project.status,
      signedPercent: signedPct,
      totalApartments: totalApts,
    }

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: newMessages,
        projectContext,
      }),
    })

    if (!res.ok || !res.body) {
      setMessages(m => [...m, { role: 'assistant', content: 'שגיאה בתקשורת עם ה-AI' }])
      setLoading(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let aiText = ''
    setMessages(m => [...m, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          aiText += data
          setMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, content: aiText } : msg))
        }
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-[520px]">
      {/* Suggested chips */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTED.map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              className="px-3 py-1.5 rounded-full border border-border text-sm hover:bg-muted transition-colors">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pe-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-ee-sm'
                : 'bg-muted/60 border border-border rounded-es-sm'
            }`}>
              {msg.content || (loading && i === messages.length - 1 ? '...' : '')}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-muted/60 border border-border rounded-2xl rounded-es-sm px-4 py-3 text-sm text-muted-foreground">...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
          placeholder="שאל שאלה על הפרויקט..."
          className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={loading}
          aria-label="הודעה לעוזר AI"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          aria-label="שלח"
          className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          <Send size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
