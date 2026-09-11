import { TextEncoder, TextDecoder } from 'util'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ReadableStream } = require('stream/web')
Object.assign(global, { TextEncoder, TextDecoder, ReadableStream })

import { renderHook, act } from '@testing-library/react'
import { useChat } from '../useChat'

const mockFetch = jest.fn()
global.fetch = mockFetch

function makeSSEStream(lines: string[]) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller: ReadableStreamDefaultController) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line + '\n'))
      }
      controller.close()
    }
  })
}

beforeEach(() => {
  mockFetch.mockReset()
  sessionStorage.setItem('access_token', 'fake.eyJzdWIiOiJ1Iiwicm9sZSI6ImVzdHVkYW50ZSIsImV4cCI6OTk5OTk5OTk5OX0.sig')
})

test('sendMessage adiciona mensagem do usuário imediatamente', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true, body: makeSSEStream([
      'data: {"message":"Olá!","avatar_state":"happy","movement":"talking","quick_replies":[],"sources":[]}',
      'event: done',
      'data: {}',
    ])
  })
  const { result } = renderHook(() => useChat())
  await act(async () => { await result.current.sendMessage('oi') })
  expect(result.current.messages.some(m => m.role === 'user' && m.content === 'oi')).toBe(true)
  expect(result.current.messages.some(m => m.role === 'assistant' && m.content === 'Olá!')).toBe(true)
})

test('sendMessage envia Authorization header', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true, body: makeSSEStream(['event: done', 'data: {}'])
  })
  const { result } = renderHook(() => useChat())
  await act(async () => { await result.current.sendMessage('oi') })
  const [, options] = mockFetch.mock.calls[0]
  expect(options.headers['Authorization']).toMatch(/^Bearer /)
})
