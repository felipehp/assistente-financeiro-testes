'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import OwlAvatar from '@/components/OwlAvatar/OwlAvatar'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      const token = sessionStorage.getItem('access_token') ?? ''
      document.cookie = `access_token=${token}; path=/; SameSite=Strict`
      router.push('/chat')
    } catch {
      setError('Não foi possível acessar. Verifique seu usuário e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full rounded-2xl border-2 border-mist px-5 py-4 text-base bg-cream text-ink tracking-wide min-h-[52px] transition-colors focus-visible:border-owl-orange-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-owl-orange-dark"

  return (
    <>
      <main
        className="min-h-screen flex items-center justify-center px-5 py-8"
        style={{ background: 'linear-gradient(135deg, #FFFBF4 0%, #EDE8F8 100%)' }}
      >
        <div className="flex items-center gap-10 w-full max-w-3xl">
        <div className="bg-cream-card rounded-3xl shadow-xl px-14 py-14 w-full max-w-lg">
          <div className="flex flex-col items-center mb-10">
            <h1 className="text-2xl font-bold text-ink text-center leading-snug">Bem-vindo ao Banco Aurora</h1>
            <p className="text-base text-slate-text text-center mt-2 leading-relaxed">
              Assistente virtual do Banco Aurora
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-7">
            <div className="flex flex-col gap-2">
              <label htmlFor="login-username" className="text-base font-semibold text-ink">
                Usuário
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                aria-label="Nome de usuário"
                aria-required="true"
                placeholder="ex.: seu.nome"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="login-password" className="text-base font-semibold text-ink">
                Senha
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-label="Senha de acesso"
                  aria-required="true"
                  className={`${inputClass} pr-14`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-text hover:text-ink transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div role="alert" aria-live="assertive" aria-atomic="true">
              {error && (
                <p className="flex items-center gap-2 text-base text-ink bg-error/10 rounded-xl px-4 py-3 border border-error/30 leading-relaxed">
                  <span aria-hidden="true">⚠️</span> {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-disabled={loading}
              className="bg-owl-orange hover:bg-owl-orange-dark text-white rounded-2xl py-4 px-6 text-base font-semibold min-h-[52px] flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-owl-orange-dark focus-visible:ring-offset-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Entrando…
                </>
              ) : 'Entrar'}
            </button>
          </form>
        </div>

          <div className="hidden md:flex shrink-0 pointer-events-none scale-125 origin-center" aria-hidden="true">
            <OwlAvatar avatarState="neutral" movement="idle" />
          </div>
        </div>
      </main>
    </>
  )
}
