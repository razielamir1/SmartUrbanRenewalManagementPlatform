import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { MUNICIPALITIES } from '@/lib/tik-binyan/municipalities'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 30 // seconds (Vercel function timeout)

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role as string | undefined
  if (role !== 'admin' && role !== 'project_manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { tikBinyanId } = await request.json() as { tikBinyanId: string }
  if (!tikBinyanId) return NextResponse.json({ error: 'tikBinyanId required' }, { status: 400 })

  const admin = getSupabaseAdminClient()

  // Load tik record
  const { data: tik, error: tikErr } = await admin
    .from('tik_binyan')
    .select('*')
    .eq('id', tikBinyanId)
    .single()

  if (tikErr || !tik) return NextResponse.json({ error: 'Tik not found' }, { status: 404 })

  // Mark as syncing
  await admin.from('tik_binyan').update({ sync_status: 'syncing', sync_error: null }).eq('id', tikBinyanId)

  // Build URL
  const config = MUNICIPALITIES[tik.municipality]
  if (!config) {
    await admin.from('tik_binyan').update({ sync_status: 'error', sync_error: 'עירייה לא נתמכת' }).eq('id', tikBinyanId)
    return NextResponse.json({ error: 'Municipality not supported' }, { status: 400 })
  }

  const url = config.build_url({
    file_number: tik.file_number ?? undefined,
    request_number: tik.request_number ?? undefined,
    address: tik.address ?? undefined,
    gush: tik.gush ?? undefined,
    helka: tik.helka ?? undefined,
  })

  // Fetch HTML
  let html: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'he-IL,he;q=0.9,en;q=0.5',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'שגיאה בגישה לאתר העירייה'
    await admin.from('tik_binyan').update({ sync_status: 'error', sync_error: msg }).eq('id', tikBinyanId)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  // Truncate HTML to ~30KB for Gemini
  const truncatedHtml = html.slice(0, 30000)

  // Parse with Gemini AI
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    await admin.from('tik_binyan').update({ sync_status: 'error', sync_error: 'GEMINI_API_KEY not configured' }).eq('id', tikBinyanId)
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 })
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `אתה מנתח מערכות תיקי בניין עירוניים בישראל.
מה-HTML הבא של אתר העירייה, חלץ את כל המידע הרלוונטי על בקשת ההיתר/תיק הבניין.

החזר אך ורק JSON תקני (ללא markdown, ללא הסברים) בפורמט הבא:
{
  "permit_status": "סטטוס הבקשה (אושר/בטיפול/נדחה/ממתין/לא נמצא)",
  "permit_type": "סוג ההיתר או null",
  "decision_date": "YYYY-MM-DD או null",
  "applicant": "שם המבקש או null",
  "request_description": "תיאור הבקשה או null",
  "timeline": [{"date": "YYYY-MM-DD", "event": "שם האירוע", "details": "פרטים נוספים"}],
  "conditions": ["תנאי 1", "תנאי 2"],
  "raw_summary": "סיכום חופשי בעברית של מצב התיק והממצאים",
  "confidence": 0.85
}

אם הדף לא מכיל מידע על תיק בניין (למשל דף חיפוש ריק), החזר:
{"permit_status": "לא נמצא", "permit_type": null, "decision_date": null, "applicant": null, "request_description": null, "timeline": [], "conditions": [], "raw_summary": "לא נמצא מידע על תיק הבניין בדף שנטען. ייתכן שפרטי החיפוש שגויים.", "confidence": 0.1}

ה-HTML:
${truncatedHtml}`

  try {
    const result = await model.generateContent(prompt)
    let text = result.response.text().trim()
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsedData = JSON.parse(text)

    await admin.from('tik_binyan').update({
      parsed_data: parsedData,
      sync_status: 'success',
      sync_error: null,
      last_sync_at: new Date().toISOString(),
    }).eq('id', tikBinyanId)

    return NextResponse.json({ parsedData, syncedAt: new Date().toISOString() })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'שגיאה בניתוח AI'
    await admin.from('tik_binyan').update({ sync_status: 'error', sync_error: msg }).eq('id', tikBinyanId)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
