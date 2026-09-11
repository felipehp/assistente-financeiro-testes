'use client'
import { useState, useCallback } from 'react'
import type { AuthUser, LoginResponse, Role } from '@/types/auth'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function decodeRole(token: string): Role | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role as Role
  } catch {
    return null
  }
}

function decodeUsername(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub as string
  } catch {
    return ''
  }
}

function initAuth(): { token: string | null; user: AuthUser | null } {
  if (typeof window === 'undefined') return { token: null, user: null }
  const stored = sessionStorage.getItem('access_token')
  if (stored) {
    const role = decodeRole(stored)
    if (role) return { token: stored, user: { username: decodeUsername(stored), role } }
  }
  return { token: null, user: null }
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => initAuth().token)
  const [user, setUser] = useState<AuthUser | null>(() => initAuth().user)

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) throw new Error('Credenciais inválidas')
    const data: LoginResponse = await res.json()
    sessionStorage.setItem('access_token', data.access_token)
    setToken(data.access_token)
    setUser({ username, role: data.role })
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('access_token')
    setToken(null)
    setUser(null)
  }, [])

  return { user, token, login, logout }
}
