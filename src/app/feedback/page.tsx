'use client'
import { useState, useEffect } from 'react'
import { AppHeader } from '@/components/AppHeader'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
function token() { return sessionStorage.getItem('access_token') ?? '' }

interface FeedbackData {
  sessions: { emoji: string; message_count: number; timestamp: string }[]
  negative_messages: { question: string; answer: string; sources: string[]; timestamp: string }[]
}

export default function FeedbackPage() {
  const [data, setData] = useState<FeedbackData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/feedback`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json()).then(setData).catch(() => setError('Erro ao carregar feedback'))
  }, [])

  async function handleExport() {
    const res = await fetch(`${API}/feedback/export`, { headers: { Authorization: `Bearer ${token()}` } })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'feedback.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (error) return <><AppHeader /><main id="main-content" className="p-6 text-error">{error}</main></>
  if (!data) return <><AppHeader /><main id="main-content" className="p-6 text-slate-text">Carregando…</main></>

  const emojiCount = { happy: 0, neutral: 0, sad: 0 }
  for (const s of data.sessions) emojiCount[s.emoji as keyof typeof emojiCount]++

  return (
    <>
      <AppHeader />
      <main id="main-content" className="max-w-3xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-ink pl-4 border-l-4 border-owl-orange">Feedback</h1>
          <button
            onClick={handleExport}
            className="border-[1.5px] border-owl-orange text-owl-orange-dark hover:bg-owl-orange hover:text-ink rounded-2xl py-2 px-4 text-sm font-semibold transition-colors min-h-[44px]"
          >
            Exportar CSV
          </button>
        </div>

        <section aria-label="Satisfação das sessões" className="bg-cream-card rounded-2xl border border-mist p-5 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink mb-4">Satisfação ({data.sessions.length} sessões)</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { emoji: '😊', label: 'Satisfeito',   count: emojiCount.happy,   bg: 'bg-success/10' },
              { emoji: '😐', label: 'Neutro',        count: emojiCount.neutral, bg: 'bg-owl-orange/10' },
              { emoji: '😞', label: 'Insatisfeito',  count: emojiCount.sad,     bg: 'bg-error/10' },
            ].map(({ emoji, label, count, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-4 flex flex-col items-center gap-1`}>
                <span className="text-3xl" aria-hidden="true">{emoji}</span>
                <span className="text-2xl font-bold text-ink">{count}</span>
                <span className="text-xs text-slate-text">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Respostas com avaliação negativa" className="bg-cream-card rounded-2xl border border-mist p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink mb-3">Respostas 👎 ({data.negative_messages.length})</h2>
          {data.negative_messages.length === 0
            ? <p className="text-slate-text text-sm">Nenhuma avaliação negativa ainda.</p>
            : (
              <ul className="space-y-3">
                {data.negative_messages.map((m, i) => (
                  <li key={i} className="border-l-4 border-error bg-error/5 rounded-r-xl pl-4 pr-3 py-3">
                    <p className="text-sm font-semibold text-ink">P: {m.question}</p>
                    <p className="text-sm text-slate-text mt-1">R: {m.answer}</p>
                    <p className="text-xs text-slate-text/60 mt-1">{m.sources.join(', ')}</p>
                  </li>
                ))}
              </ul>
            )
          }
        </section>
      </main>
    </>
  )
}
