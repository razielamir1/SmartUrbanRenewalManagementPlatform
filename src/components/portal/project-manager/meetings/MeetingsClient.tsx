'use client'

import { CalendarDays } from 'lucide-react'
import { useMeetings } from '@/lib/hooks/useMeetings'
import { CreateMeetingForm } from './CreateMeetingForm'
import { MeetingCard } from './MeetingCard'

interface Props {
  projectId: string
}

export function MeetingsClient({ projectId }: Props) {
  const { data: meetings, isLoading } = useMeetings(projectId)

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      {/* Create form */}
      <div>
        <CreateMeetingForm projectId={projectId} />
      </div>

      {/* Meetings list */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">פגישות קרובות</h2>

        {isLoading && (
          <p className="text-muted-foreground animate-pulse">טוען פגישות...</p>
        )}

        {!isLoading && (!meetings || meetings.length === 0) && (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <CalendarDays size={40} className="opacity-30" />
            <p className="text-base">אין פגישות קרובות.</p>
          </div>
        )}

        {meetings?.map(meeting => (
          <MeetingCard key={meeting.id} meeting={meeting} />
        ))}
      </div>
    </div>
  )
}
