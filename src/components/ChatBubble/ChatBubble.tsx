'use client'
import { useState } from 'react'
import type { ChatMessage, AvatarState } from '@/types/chat'
import OwlAvatar from '@/components/OwlAvatar/OwlAvatar'

interface Props {
  message: ChatMessage
  onFeedback: (messageId: string, rating: 'up' | 'down') => void
  currentOwlState?: AvatarState
}

function OwlAvatarThumb({ state }: { state: AvatarState }) {
  return (
    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-owl-orange/30 relative">
      <div style={{
        position: 'absolute',
        top: '35%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(0.208)',
        transformOrigin: 'center center',
      }}>
        <OwlAvatar avatarState={state} movement="idle" />
      </div>
    </div>
  )
}

function UserAvatarThumb() {
  return (
    <div
      data-testid="user-avatar-thumb"
      className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-violet/20 border-2 border-violet/30 flex items-center justify-center"
    >
      <svg viewBox="0 0 40 40" width="32" height="32" aria-hidden="true" className="text-violet opacity-70">
        <circle cx="20" cy="14" r="7" fill="currentColor" />
        <ellipse cx="20" cy="34" rx="12" ry="9" fill="currentColor" />
      </svg>
    </div>
  )
}

export function ChatBubble({ message, onFeedback, currentOwlState }: Props) {
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const isAssistant = message.role === 'assistant'
  const hasSources = isAssistant && message.sources && message.sources.length > 0
  const sourceCount = message.sources?.length ?? 0

  return (
    <div className={`flex items-end gap-2 ${isAssistant ? 'justify-start' : 'justify-end'} mb-4`}>
      {isAssistant && (
        <OwlAvatarThumb state={message.avatar_state ?? currentOwlState ?? 'neutral'} />
      )}
      <article
        aria-label={`Mensagem de ${isAssistant ? 'AURA' : 'você'}`}
        className={`max-w-[80%] rounded-2xl px-5 py-4 text-base leading-relaxed group ${
          isAssistant
            ? 'bg-owl-orange-soft border-l-4 border-owl-orange rounded-tl-sm'
            : 'bg-violet-soft border-r-4 border-violet rounded-tr-sm'
        }`}
      >
        <p className="text-ink">{message.content}</p>

        {hasSources && (
          <div className="mt-2">
            <button
              onClick={() => setSourcesOpen(o => !o)}
              className="text-slate-text text-sm flex items-center gap-1 hover:text-owl-orange transition-colors"
              aria-expanded={sourcesOpen}
            >
              📄 {sourceCount} {sourceCount === 1 ? 'fonte' : 'fontes'} {sourcesOpen ? '▴' : '▾'}
            </button>
            {sourcesOpen && (
              <p className="text-sm text-slate-text mt-1">
                {message.sources!.join(' · ')}
              </p>
            )}
          </div>
        )}

        {isAssistant && (
          <div className="flex gap-2 mt-2">
            <button
              aria-label="Resposta útil"
              onClick={() => onFeedback(message.id, 'up')}
              className="text-lg hover:scale-110 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center opacity-60 hover:opacity-100"
            >
              👍
            </button>
            <button
              aria-label="Resposta não útil"
              onClick={() => onFeedback(message.id, 'down')}
              className="text-lg hover:scale-110 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center opacity-60 hover:opacity-100"
            >
              👎
            </button>
          </div>
        )}
      </article>
      {!isAssistant && <UserAvatarThumb />}
    </div>
  )
}
