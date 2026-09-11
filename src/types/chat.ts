export type AvatarState = 'neutral' | 'happy' | 'encouraging' | 'empathetic' | 'thoughtful'
export type Movement = 'idle' | 'talking' | 'thinking'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  avatar_state?: AvatarState
  movement?: Movement
  quick_replies?: string[]
  sources?: string[]
}

export interface ChatResponse {
  message: string
  avatar_state: AvatarState
  movement: Movement
  quick_replies?: string[]
  sources?: string[]
}
