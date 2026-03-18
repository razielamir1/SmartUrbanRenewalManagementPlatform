'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  projectContext: Record<string, unknown>
}

const SUGGESTED_QUESTIONS = [
  'מה המצב הנוכחי של הפרויקט?',
  'מה עלי לעשות בשלב הבא?',
  'מה אחוז החתימות הנדרש לפרויקט שלי?',
  'כיצד להתמודד עם דיירים מתנגדים?',
  'מה לוח הזמנים הממוצע לפרויקט כזה?',
  'אילו מסמכים נדרשים בשלב ההיתרים?',
]

export function AIChatClient({ projectContext }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, projectContext }),
      })

      if (!res.ok || !res.body) {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: 'שגיאה בתקשורת עם השרת.' }
          return updated
        })
        setStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') continue
          try {
            const { text, error } = JSON.parse(payload)
            if (error) {
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: `שגיאה: ${error}` }
                return updated
              })
              break
            }
            if (text) {
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: updated[updated.length - 1].content + text,
                }
                return updated
              })
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'שגיאת רשת — נסו שוב.' }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">עוזר AI</h1>
        <p className="text-muted-foreground mt-0.5">שאלו כל שאלה על הפרויקט, ההתחדשות העירונית, ומה עושים הלאה</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border">
              <Bot size={24} className="text-primary shrink-0" aria-hidden="true" />
              <p className="text-base">שלום! אני עוזר ה-AI שלך לניהול פרויקטי התחדשות עירונית. מה תרצה לדעת?</p>
            </div>
            <p className="text-sm text-muted-foreground font-medium">שאלות מוצעות:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-2 text-sm rounded-xl bg-card border border-border hover:border-primary hover:text-primary transition-colors text-start"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'
            }`}>
              {msg.role === 'user'
                ? <User size={16} aria-hidden="true" />
                : <Bot size={16} className="text-primary" aria-hidden="true" />
              }
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border'
            }`}>
              {msg.content || (streaming && i === messages.length - 1 ? (
                <span className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              ) : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border pt-4">
        <div className="flex gap-3 items-end bg-card rounded-2xl border border-border p-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="הקלידו שאלה... (Enter לשליחה, Shift+Enter לשורה חדשה)"
            rows={1}
            disabled={streaming}
            className="flex-1 resize-none bg-transparent text-base focus:outline-none min-h-[2rem] max-h-32 overflow-y-auto disabled:opacity-60"
            aria-label="הקלידו שאלה לעוזר ה-AI"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="shrink-0 p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
            aria-label="שלח הודעה"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          מידע זה הוא כללי בלבד ואינו מהווה ייעוץ משפטי
        </p>
      </div>
    </div>
  )
}
