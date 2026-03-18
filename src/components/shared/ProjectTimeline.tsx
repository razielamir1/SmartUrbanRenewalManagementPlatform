import { CheckCircle, Circle, Clock } from 'lucide-react'
import type { Milestone, ProjectStatus } from '@/lib/supabase/types'

interface ProjectTimelineProps {
  milestones: Milestone[]
  currentStage: ProjectStatus
}

const STAGE_ORDER: ProjectStatus[] = [
  'pre_planning',
  'planning',
  'permits',
  'construction',
  'finishing',
  'key_delivery',
]

type StepState = 'completed' | 'current' | 'future'

function getStepState(milestoneStage: ProjectStatus, currentStage: ProjectStatus): StepState {
  const milestoneIdx = STAGE_ORDER.indexOf(milestoneStage)
  const currentIdx = STAGE_ORDER.indexOf(currentStage)
  if (milestoneIdx < currentIdx) return 'completed'
  if (milestoneIdx === currentIdx) return 'current'
  return 'future'
}

export function ProjectTimeline({ milestones, currentStage }: ProjectTimelineProps) {
  const sorted = [...milestones].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <nav aria-label="שלבי הפרויקט">
      {/* Desktop: horizontal scrollable */}
      <ol className="hidden md:flex items-start gap-0">
        {sorted.map((milestone, index) => {
          const state = getStepState(milestone.stage, currentStage)
          const isLast = index === sorted.length - 1

          return (
            <li key={milestone.id} className="flex items-start flex-1 min-w-0">
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center w-full">
                  {/* Step indicator */}
                  <StepIcon state={state} />
                  {/* Connector line */}
                  {!isLast && (
                    <div
                      className={`h-0.5 flex-1 mx-1 ${
                        state === 'completed' ? 'bg-green-500' : 'bg-muted'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </div>
                {/* Label */}
                <div className="mt-2 text-center px-1">
                  <p className={`text-sm font-medium leading-tight ${
                    state === 'current' ? 'text-primary' :
                    state === 'completed' ? 'text-green-700' :
                    'text-muted-foreground'
                  }`}>
                    {milestone.label}
                  </p>
                  {milestone.target_date && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(milestone.target_date).toLocaleDateString('he-IL')}
                    </p>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {/* Mobile: vertical list */}
      <ol className="flex flex-col gap-3 md:hidden">
        {sorted.map((milestone) => {
          const state = getStepState(milestone.stage, currentStage)
          return (
            <li key={milestone.id} className="flex items-center gap-3">
              <StepIcon state={state} />
              <div>
                <p className={`text-base font-medium ${
                  state === 'current' ? 'text-primary' :
                  state === 'completed' ? 'text-green-700' :
                  'text-muted-foreground'
                }`}>
                  {milestone.label}
                </p>
                {milestone.target_date && (
                  <p className="text-sm text-muted-foreground">
                    {new Date(milestone.target_date).toLocaleDateString('he-IL')}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function StepIcon({ state }: { state: StepState }) {
  if (state === 'completed') {
    return <CheckCircle className="text-green-500 shrink-0" size={28} aria-label="הושלם" />
  }
  if (state === 'current') {
    return (
      <div className="relative shrink-0" aria-label="שלב נוכחי">
        <Circle className="text-primary" size={28} />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="block w-3 h-3 rounded-full bg-primary animate-pulse" />
        </span>
      </div>
    )
  }
  return <Circle className="text-muted-foreground shrink-0" size={28} aria-label="טרם הגיע" />
}
