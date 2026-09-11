import type { ChatMessage, AvatarState } from '../chat'
import type { Role, AuthUser } from '../auth'

test('AvatarState cobre os 5 estados', () => {
  const states: AvatarState[] = ['neutral', 'happy', 'encouraging', 'empathetic', 'thoughtful']
  expect(states).toHaveLength(5)
})

test('ChatMessage tem campo sources', () => {
  const msg: ChatMessage = {
    id: '1', role: 'assistant', content: 'Olá',
    avatar_state: 'happy', movement: 'talking',
    quick_replies: [], sources: ['normas.pdf'],
  }
  expect(msg.sources).toEqual(['normas.pdf'])
})

test('Role cobre os 3 perfis', () => {
  const roles: Role[] = ['estudante', 'professor', 'admin']
  expect(roles).toHaveLength(3)
})

test('AuthUser tem username e role', () => {
  const user: AuthUser = { username: 'alice', role: 'admin' }
  expect(user.username).toBe('alice')
})
