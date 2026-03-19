import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PROJECT_TYPE_LABELS, CONSENT_STATUS_LABELS } from '@/lib/supabase/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      insights: ['מפתח Gemini AI לא מוגדר — יש להוסיף GEMINI_API_KEY ל-.env.local'],
      alerts: [],
      tips: [],
    })
  }

  const { projectId } = await req.json()
  const admin = getSupabaseAdminClient()

  const [
    { data: project },
    { data: buildings },
    { data: milestones },
    { data: meetings },
  ] = await Promise.all([
    admin.from('projects').select('*').eq('id', projectId).single(),
    admin.from('buildings').select('*').eq('project_id', projectId),
    admin.from('project_milestones').select('*').eq('project_id', projectId).order('sort_order'),
    admin.from('meetings').select('title').eq('project_id', projectId).order('start_time', { ascending: false }).limit(5),
  ])

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const buildingIds = buildings?.map(b => b.id) ?? []
  const { data: apartments } = buildingIds.length > 0
    ? await admin.from('apartments').select('consent_status').in('building_id', buildingIds)
    : { data: [] }

  const total = apartments?.length ?? 0
  const signed = apartments?.filter(a => a.consent_status === 'signed').length ?? 0
  const objecting = apartments?.filter(a => a.consent_status === 'objecting').length ?? 0
  const signedPct = total > 0 ? Math.round((signed / total) * 100) : 0
  const threshold = project.project_type === 'tama38b' ? 80 : 66
  const completedMilestones = milestones?.filter(m => m.completed_at).length ?? 0
  const totalMilestones = milestones?.length ?? 0

  const prompt = `אתה מנתח נתוני פרויקט התחדשות עירונית בישראל. בהתבסס על הנתונים הבאים, ספק ניתוח מקיף.

פרויקט: ${project.name}
סוג: ${PROJECT_TYPE_LABELS[project.project_type as keyof typeof PROJECT_TYPE_LABELS] ?? project.project_type}
סטטוס: ${project.status}
בניינים: ${buildings?.length ?? 0}
דירות: ${total}
חתימות: ${signed}/${total} (${signedPct}%) — סף נדרש: ${threshold}%
מתנגדים: ${objecting}
אבני דרך שהושלמו: ${completedMilestones}/${totalMilestones}
פגישות אחרונות: ${meetings?.map(m => m.title).join(', ') || 'אין'}

ענה בפורמט JSON בלבד (ללא markdown, ללא קוד, ללא הסברים):
{"insights":["תובנה 1","תובנה 2","תובנה 3"],"alerts":["התראה 1"],"tips":["המלצה 1","המלצה 2","המלצה 3"]}

- insights: 3 תובנות מעמיקות על מצב הפרויקט
- alerts: עד 3 התראות על בעיות או סיכונים (אם אין — מערך ריק [])
- tips: 3 המלצות מעשיות לצעדים הבאים`

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const result = await model.generateContent(prompt)
  let text = result.response.text().trim()

  // Strip markdown code fences if Gemini wraps in ```json
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  try {
    return NextResponse.json(JSON.parse(text))
  } catch {
    return NextResponse.json({ insights: [text], alerts: [], tips: [] })
  }
}
