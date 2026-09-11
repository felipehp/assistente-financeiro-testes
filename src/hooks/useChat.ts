'use client'
import { useState, useCallback, useEffect } from 'react'
import type { ChatMessage, ChatResponse, AvatarState, Movement } from '@/types/chat'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const STORAGE_KEY = 'chat_history'

function makeId() {
  return Math.random().toString(36).slice(2)
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages())
  const [avatarState, setAvatarState] = useState<AvatarState>('neutral')
  const [movement, setMovement] = useState<Movement>('idle')
  const [isLoading, setIsLoading] = useState(false)
  const [quickReplies, setQuickReplies] = useState<string[]>([])

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  const clearMessages = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setMessages([])
    setAvatarState('neutral')
    setMovement('idle')
    setQuickReplies([])
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { id: makeId(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setMovement('thinking')
    setQuickReplies([])

    const history = messages.map(m => ({ role: m.role, content: m.content }))
    const token = sessionStorage.getItem('access_token') ?? ''

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: text, history }),
      })
      if (!res.ok || !res.body) throw new Error('Erro na resposta')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const lastAssistantId = makeId()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('event: done')) {
            setMovement('idle')
            setIsLoading(false)
            return
          }
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (!payload || payload === '{}') continue

          try {
            const chunk: ChatResponse = JSON.parse(payload)
            setAvatarState(chunk.avatar_state)
            setMovement(chunk.movement)
            if (chunk.quick_replies?.length) setQuickReplies(chunk.quick_replies)

            if (chunk.message) {
              setMessages(prev => {
                const existing = prev.find(m => m.id === lastAssistantId)
                if (existing) {
                  return prev.map(m => m.id === lastAssistantId
                    ? { ...m, content: m.content + chunk.message, sources: chunk.sources, quick_replies: chunk.quick_replies }
                    : m)
                }
                const newMsg: ChatMessage = {
                  id: lastAssistantId, role: 'assistant', content: chunk.message,
                  avatar_state: chunk.avatar_state, movement: chunk.movement,
                  quick_replies: chunk.quick_replies, sources: chunk.sources,
                }
                return [...prev, newMsg]
              })
            }
          } catch {
            // JSON inválido — ignorar
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        id: makeId(), role: 'assistant', content: 'Ops, não consegui me conectar. Tente novamente.',
        avatar_state: 'empathetic' as AvatarState, movement: 'idle' as Movement, sources: [],
      }])
    } finally {
      setMovement('idle')
      setIsLoading(false)
    }
  }, [messages])

  return { messages, avatarState, movement, isLoading, quickReplies, sendMessage, setAvatarState, setMovement, clearMessages }
}
