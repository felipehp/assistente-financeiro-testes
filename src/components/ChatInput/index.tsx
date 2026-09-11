'use client'
import { useState } from 'react'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
  isListening: boolean
  isSpeaking: boolean
  speechSupported: boolean
  onToggleListen: () => void
  onToggleSpeak: () => void
  transcript?: string
}

export function ChatInput({
  onSend, disabled, isListening, isSpeaking,
  speechSupported, onToggleListen, onToggleSpeak, transcript = '',
}: Props) {
  const [text, setText] = useState('')
  const value = transcript || text

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    onSend(value.trim())
    setText('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="py-4 w-full"
    >
      <div className="flex items-center gap-2">
      {speechSupported && (
        <button
          type="button"
          aria-label={isListening ? 'Parar gravação' : 'Iniciar microfone'}
          onClick={onToggleListen}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
            isListening
              ? 'bg-error text-white animate-pulse'
              : 'bg-mist hover:bg-owl-orange-soft text-ink'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
            <path d="M5 10a7 7 0 0114 0M12 19v3M9 22h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      <input
        type="text"
        value={value}
        onChange={e => setText(e.target.value)}
        placeholder="Digite ou fale sua dúvida…"
        disabled={disabled}
        className="flex-1 rounded-2xl border border-mist px-5 py-4 text-base bg-cream min-h-[56px] placeholder:text-slate-text/60 disabled:opacity-60 focus-visible:border-owl-orange-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-owl-orange-dark"
        aria-label="Mensagem para o AURA"
      />

      {speechSupported && (
        <button
          type="button"
          aria-label={isSpeaking ? 'Silenciar AURA' : 'AURA falar em voz alta'}
          onClick={onToggleSpeak}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
            isSpeaking
              ? 'bg-owl-orange text-ink'
              : 'bg-mist hover:bg-owl-orange-soft text-ink'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Enviar mensagem"
        className="w-11 h-11 rounded-full bg-owl-orange hover:bg-owl-orange-dark text-ink flex items-center justify-center disabled:opacity-50 transition-colors flex-shrink-0"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      </div>
    </form>
  )
}
