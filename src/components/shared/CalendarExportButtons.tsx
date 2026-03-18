import { Calendar, ExternalLink, Download } from 'lucide-react'
import { format } from 'date-fns'
import type { Meeting } from '@/lib/supabase/types'

function toIcsDate(iso: string): string {
  return format(new Date(iso), "yyyyMMdd'T'HHmmss'Z'")
}

function buildGoogleUrl(meeting: Meeting): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: meeting.title,
    dates: `${toIcsDate(meeting.start_time)}/${toIcsDate(meeting.end_time)}`,
    details: meeting.description ?? '',
    location: meeting.location ?? '',
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

function buildOutlookUrl(meeting: Meeting): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: meeting.title,
    startdt: new Date(meeting.start_time).toISOString(),
    enddt: new Date(meeting.end_time).toISOString(),
    body: meeting.description ?? '',
    location: meeting.location ?? '',
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`
}

interface Props {
  meeting: Meeting
}

const btnClass =
  'inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors'

export function CalendarExportButtons({ meeting }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <a
        href={buildGoogleUrl(meeting)}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
        aria-label="הוסף ל-Google Calendar"
      >
        <Calendar size={13} />
        Google
        <ExternalLink size={11} className="text-muted-foreground" />
      </a>

      <a
        href={buildOutlookUrl(meeting)}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
        aria-label="הוסף ל-Outlook"
      >
        <Calendar size={13} />
        Outlook
        <ExternalLink size={11} className="text-muted-foreground" />
      </a>

      <a
        href={`/api/meetings/${meeting.id}/ics`}
        download={`meeting-${meeting.id}.ics`}
        className={btnClass}
        aria-label="הורד קובץ ICS לאפל ואחרים"
      >
        <Download size={13} />
        Apple / ICS
      </a>
    </div>
  )
}
