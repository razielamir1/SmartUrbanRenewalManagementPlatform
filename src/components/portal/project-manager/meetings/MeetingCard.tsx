import { MapPin, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import type { Meeting } from '@/lib/supabase/types'
import { CalendarExportButtons } from '@/components/shared/CalendarExportButtons'

interface Props {
  meeting: Meeting
}

export function MeetingCard({ meeting }: Props) {
  const start = new Date(meeting.start_time)
  const end = new Date(meeting.end_time)

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-2">
      <h3 className="text-base font-bold">{meeting.title}</h3>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock size={14} />
        <span>
          {format(start, 'EEEE, dd/MM/yyyy', { locale: he })}
          {' — '}
          {format(start, 'HH:mm')}–{format(end, 'HH:mm')}
        </span>
      </div>

      {meeting.location && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin size={14} />
          <span>{meeting.location}</span>
        </div>
      )}

      {meeting.description && (
        <p className="text-sm text-muted-foreground border-t border-border pt-2 mt-2">
          {meeting.description}
        </p>
      )}

      <CalendarExportButtons meeting={meeting} />
    </div>
  )
}
