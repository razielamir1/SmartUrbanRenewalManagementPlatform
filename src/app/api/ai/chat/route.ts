import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
  }

  const { messages, projectContext } = await req.json()

  const systemPrompt = `אתה עוזר AI מומחה בתחום ההתחדשות העירונית בישראל. אתה עוזר למנהל פרויקט לנהל פרויקטים מסוג תמ"א 38, פינוי-בינוי והיתרי בנייה פרטיים.

פרטי הפרויקט הנוכחי:
${projectContext ? JSON.stringify(projectContext, null, 2) : 'לא סופקו פרטי פרויקט'}

הנחיות:
- ענה תמיד בעברית
- היה קצר, מעשי ומדויק
- כשמדובר בשיקולים משפטיים, ציין שמדובר במידע כללי בלבד ולא ייעוץ משפטי
- התמקד בהתחדשות עירונית בישראל (חוקים, רשויות, נהלים)
- כשמציינים אחוזי הסכמה, ציין את הסף הנדרש לפי סוג הפרויקט`

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
  })

  // Convert messages to Gemini history format (all except the last user message)
  const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const lastMessage = messages[messages.length - 1]?.content ?? ''

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const chat = model.startChat({ history })
        const result = await chat.sendMessageStream(lastMessage)

        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
