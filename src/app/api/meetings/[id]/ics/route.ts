export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

function toIcsDate(iso: string): string {
  // Format to YYYYMMDDTHHmmssZ (UTC)
  return format(new Date(iso), "yyyyMMdd'T'HHmmss'Z'")
}

function escapeIcs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !meeting) {
    return NextResponse.json({ error: 'פגישה לא נמצאה' }, { status: 404 })
  }

  const now = toIcsDate(new Date().toISOString())
  const start = toIcsDate(meeting.start_time)
  const end = toIcsDate(meeting.end_time)

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PinuiBinui//Meeting//HE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${meeting.id}@pinuibinui`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(meeting.title)}`,
    meeting.description ? `DESCRIPTION:${escapeIcs(meeting.description)}` : '',
    meeting.location ? `LOCATION:${escapeIcs(meeting.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="meeting-${id}.ics"`,
    },
  })
}
