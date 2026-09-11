'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useChat } from '@/hooks/useChat'
import { useSpeech } from '@/hooks/useSpeech'
import { useTTS } from '@/hooks/useTTS'
import { AppHeader } from '@/components/AppHeader'
import { Sidebar } from '@/components/Sidebar'
import OwlAvatar from '@/components/OwlAvatar/OwlAvatar'
import { ChatBubble } from '@/components/ChatBubble'
import { ChatInput } from '@/components/ChatInput'
import { LgpdModal } from '@/components/LgpdModal'
import QuickReply from '@/components/QuickReply/QuickReply'
import { SessionRatingToast } from '@/components/SessionRatingToast'
import type { AvatarState } from '@/types/chat'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const STAGE_COLORS: Record<AvatarState, string> = {
  neutral:     '#FEF0E0',
  happy:       '#FEF0E0',
  encouraging: '#EDE8F8',
  empathetic:  '#EDE8F8',
  thoughtful:  '#E4E0F0',
}

export default function ChatPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])
  const { messages, avatarState, movement, isLoading, quickReplies, sendMessage, setAvatarState, setMovement, clearMessages } = useChat()
  const { isListening, isSpeaking: speechIsSpeaking, transcript, supported, startListening, stopListening } = useSpeech()
  const [audioEnabled, setAudioEnabled] = useState(false)
  const lastAssistantText = !isLoading
    ? messages.filter((m) => m.role === 'assistant').at(-1)?.content ?? null
    : null
  const { isSpeaking: ttsIsSpeaking, beakOpen } = useTTS(audioEnabled ? lastAssistantText : null)
  const effectiveMovement = ttsIsSpeaking ? 'talking' : movement
  const [showLgpdModal, setShowLgpdModal] = useState(false)
  const [lgpdAccepted, setLgpdAccepted] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (messages.length > 0) { setShowRating(true); e.preventDefault() }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [messages.length])

  function handleToggleListen() {
    if (!lgpdAccepted) { setShowLgpdModal(true); return }
    if (isListening) stopListening(); else startListening()
  }

  function handleToggleSpeak() {
    setAudioEnabled(a => !a)
  }

  function handleSend(text: string) { sendMessage(text) }

  function handleFeedback(messageId: string, rating: 'up' | 'down') {
    const msg = messages.find(m => m.id === messageId)
    if (!msg) return
    const tok = sessionStorage.getItem('access_token') ?? ''
    fetch(`${API}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
      body: JSON.stringify({
        type: 'message', message_id: messageId,
        question: messages.at(-2)?.content ?? '',
        answer: msg.content, sources: msg.sources ?? [], rating,
      }),
    }).catch(() => {})
  }

  function submitSessionRating(emoji: 'happy' | 'neutral' | 'sad') {
    const tok = sessionStorage.getItem('access_token') ?? ''
    fetch(`${API}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
      body: JSON.stringify({ type: 'session', emoji, message_count: messages.length }),
    }).catch(() => {})
    clearMessages()
    setShowRating(false)
  }

  function handleLogout() {
    if (messages.length > 0) { setShowRating(true); return }
    clearMessages()
    document.cookie = 'access_token=; path=/; max-age=0'
    logout()
    router.push('/login')
  }

  function handleClearChat() {
    clearMessages()
  }

  return (
    <>
      <AppHeader onLogout={handleLogout} />

      <div className="flex h-[calc(100vh-64px)] bg-cream">
        {/* Sidebar */}
        <Sidebar
          visible={mounted && user?.role === 'admin'}
          avatarState={avatarState}
          movement={movement}
          onAvatarStateChange={setAvatarState}
          onMovementChange={setMovement}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Zona de palco AURA */}
          <div
            className="flex flex-col items-center pt-5 pb-3 shrink-0"
            style={{ backgroundColor: STAGE_COLORS[avatarState], transition: 'background-color 0.4s ease' }}
          >
            <OwlAvatar
              avatarState={avatarState}
              movement={effectiveMovement}
              beakOpen={beakOpen}
            />
          </div>

          {/* Mensagens */}
          <main
            id="main-content"
            className="flex-1 overflow-y-auto px-4 py-4"
            aria-live="polite"
            aria-label="Conversa com AURA"
          >
            <div className="max-w-3xl mx-auto w-full">
              {messages.length > 0 && (
                <div className="flex justify-end mb-2">
                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="flex items-center gap-1.5 text-xs text-slate-text hover:text-error border border-mist hover:border-error/40 hover:bg-error/5 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Limpar conversa
                  </button>
                </div>
              )}
              {messages.map(msg => (
                <ChatBubble key={msg.id} message={msg} onFeedback={handleFeedback} currentOwlState={avatarState} />
              ))}
              {isLoading && (
                <div className="flex items-end gap-2 mb-4">
                  <div className="w-10 h-10 shrink-0" />
                  <div aria-label="Carregando resposta" className="flex gap-1 p-3">
                    <span className="w-2 h-2 bg-owl-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-owl-orange rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-owl-orange rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </main>

          {/* Quick replies + Input */}
          <div className="shrink-0 bg-cream-card border-t border-mist shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
            <div className="max-w-3xl mx-auto w-full px-4">
              {quickReplies.length > 0 && (
                <QuickReply options={quickReplies} onSelect={handleSend} />
              )}
              <ChatInput
                onSend={handleSend}
                disabled={isLoading}
                isListening={isListening}
                isSpeaking={audioEnabled || speechIsSpeaking || ttsIsSpeaking}
                speechSupported={mounted && supported}
                onToggleListen={handleToggleListen}
                onToggleSpeak={handleToggleSpeak}
                transcript={transcript}
              />
            </div>
          </div>
        </div>
      </div>

      {showLgpdModal && (
        <LgpdModal
          onAccept={() => { setLgpdAccepted(true); setShowLgpdModal(false); startListening() }}
          onDecline={() => setShowLgpdModal(false)}
        />
      )}
      {showRating && (
        <SessionRatingToast
          onRate={emoji => {
            submitSessionRating(emoji)
            document.cookie = 'access_token=; path=/; max-age=0'
            logout()
            router.push('/login')
          }}
          onDismiss={() => {
            clearMessages()
            setShowRating(false)
            document.cookie = 'access_token=; path=/; max-age=0'
            logout()
            router.push('/login')
          }}
        />
      )}
    </>
  )
}
