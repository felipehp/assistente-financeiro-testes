import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../useAuth'

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => {
  sessionStorage.clear()
  mockFetch.mockReset()
})

test('inicia sem usuário logado', () => {
  const { result } = renderHook(() => useAuth())
  expect(result.current.user).toBeNull()
  expect(result.current.token).toBeNull()
})

test('login salva token no sessionStorage', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ access_token: 'tok123', token_type: 'bearer', role: 'estudante' }),
  })
  const { result } = renderHook(() => useAuth())
  await act(async () => {
    await result.current.login('alice', 'pass')
  })
  expect(sessionStorage.getItem('access_token')).toBe('tok123')
  expect(result.current.user?.role).toBe('estudante')
})

test('logout remove token do sessionStorage', async () => {
  sessionStorage.setItem('access_token', 'tok')
  const { result } = renderHook(() => useAuth())
  act(() => { result.current.logout() })
  expect(sessionStorage.getItem('access_token')).toBeNull()
  expect(result.current.user).toBeNull()
})

test('login falho lança erro', async () => {
  mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })
  const { result } = renderHook(() => useAuth())
  await expect(act(async () => { await result.current.login('x', 'wrong') })).rejects.toThrow()
})
