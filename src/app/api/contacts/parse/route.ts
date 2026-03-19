export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { extractTextFromFile } from '@/lib/contacts/parse-file.server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/csv',
  'application/csv',
  'text/plain',
  'application/pdf',
]

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role as string | undefined
  if (role !== 'project_manager' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'לא נבחר קובץ' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'הקובץ גדול מדי (מקסימום 10MB)' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'סוג קובץ לא נתמך. ניתן להעלות Word, CSV, PDF, TXT בלבד' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Step 1: Extract raw text from file
  const rawText = await extractTextFromFile(buffer, file.type)

  if (!rawText.trim()) {
    return NextResponse.json({ error: 'לא נמצא טקסט בקובץ' }, { status: 422 })
  }

  // Step 2: AI parsing with Gemini
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 })
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `אתה עוזר שמחלץ פרטי אנשי קשר מטקסטים בעברית.
מהטקסט הבא, חלץ את כל אנשי הקשר.
החזר אך ורק מערך JSON תקני (ללא markdown, ללא הסברים) בפורמט:
[{"full_name":"שם מלא","phone":"0501234567","building":"מספר בניין או כתובת אם מוזכר, אחרת null"}]

אם יש מספר טלפון ישראלי (050/052/053/054/055/058/072/073/074/076/077/078/079) — כלול את איש הקשר.
נקה מספרי טלפון להפוך לפורמט 050XXXXXXX (רק ספרות).

הטקסט:
${rawText.slice(0, 8000)}`

  let aiContacts: { full_name: string; phone: string; building: string | null }[] = []

  try {
    const result = await model.generateContent(prompt)
    let text = result.response.text().trim()
    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    aiContacts = JSON.parse(text)
    if (!Array.isArray(aiContacts)) throw new Error('not array')
  } catch {
    // Fallback to regex-based parsing
    const { extractPhonePairs } = await import('@/lib/contacts/parse-phones')
    const fallback = extractPhonePairs(rawText)
    return NextResponse.json({
      contacts: fallback.map(c => ({
        full_name: c.full_name,
        phone_raw: c.phone_raw,
        phone_wa: c.phone_wa,
        building: null,
      })),
      ai: false,
    })
  }

  if (aiContacts.length === 0) {
    return NextResponse.json({ error: 'לא נמצאו אנשי קשר בקובץ' }, { status: 422 })
  }

  // Normalize to our format
  const contacts = aiContacts
    .filter(c => c.phone && c.phone.length >= 9)
    .map(c => {
      const digits = c.phone.replace(/\D/g, '')
      const phone_wa = digits.startsWith('0') ? '972' + digits.slice(1) : '972' + digits
      return {
        full_name: c.full_name?.trim() || 'לא ידוע',
        phone_raw: c.phone.trim(),
        phone_wa,
        building: c.building ?? null,
      }
    })

  return NextResponse.json({ contacts, ai: true })
}
