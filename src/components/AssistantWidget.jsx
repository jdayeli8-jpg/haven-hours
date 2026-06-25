import { useState, useRef, useEffect } from 'react'

// Recepcionista de AI (24/7) para los clientes. Burbujita flotante abajo a la derecha.
// Habla con /api/assistant (función segura). El saludo es solo visual: NO se manda a la API.
const GREETING =
  "Hi! 👋 I’m the Haven & Hours assistant. Ask me anything — pricing, pickup, dry cleaning, or how it works."

export default function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([]) // turnos reales {role, content} (sin el saludo)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, loading, open])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (data.ok && data.reply) {
        setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
      } else {
        setError(data.error || 'Sorry, something went wrong. Please try again.')
      }
    } catch {
      setError('Couldn’t connect. Please try again, or email hello@havenandhours.com.')
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      {/* Panel de chat */}
      {open && (
        <div className="mb-3 flex h-[30rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-ink/10 bg-ivory shadow-2xl">
          {/* Encabezado */}
          <div className="flex items-center justify-between bg-iris px-4 py-3 text-white">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/70">Haven &amp; Hours</p>
              <p className="text-sm font-bold">Ask us anything</p>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-white/80 hover:bg-white/15 hover:text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <Bubble role="assistant">{GREETING}</Bubble>
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role}>
                {m.content}
              </Bubble>
            ))}
            {loading && (
              <Bubble role="assistant">
                <span className="inline-flex gap-1">
                  <Dot /> <Dot /> <Dot />
                </span>
              </Bubble>
            )}
            {error && (
              <p className="text-center text-[12px] text-[#8C3A2B]">{error}</p>
            )}
          </div>

          {/* Entrada */}
          <div className="flex items-end gap-2 border-t border-ink/10 px-3 py-3">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type your question…"
              className="max-h-24 flex-1 resize-none rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-iris"
            />
            <button
              type="button"
              aria-label="Send message"
              onClick={send}
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-iris text-white transition disabled:opacity-40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </div>
          <p className="bg-ivory pb-2 text-center text-[10px] text-stone2">
            Assistant may not be perfect — we’ll confirm anything important.
          </p>
        </div>
      )}

      {/* Botón flotante */}
      <button
        type="button"
        aria-label={open ? 'Close chat' : 'Open chat'}
        onClick={() => setOpen((v) => !v)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-iris text-white shadow-xl transition hover:bg-iris-deep"
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
          </svg>
        )}
      </button>
    </div>
  )
}

function Bubble({ role, children }) {
  const isUser = role === 'user'
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          isUser
            ? 'max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-iris px-3 py-2 text-sm text-white'
            : 'max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-ink shadow-sm'
        }
      >
        {children}
      </div>
    </div>
  )
}

function Dot() {
  return <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-stone2" />
}
