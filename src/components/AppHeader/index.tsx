'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface AppHeaderProps {
  onLogout?: () => void
}

export function AppHeader({ onLogout }: AppHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  const isChatPage = pathname === '/chat'
  const isAdmin = user?.role && ['admin', 'professor'].includes(user.role)
  const isAdminPage = ['/ingest', '/feedback', '/config'].includes(pathname ?? '')
  const isIngestActive = pathname === '/ingest'
  const isFeedbackActive = pathname === '/feedback'
  const isConfigActive = pathname === '/config'

  function handleLogout() {
    if (onLogout) { onLogout(); return }
    document.cookie = 'access_token=; path=/; max-age=0'
    logout()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 h-16 bg-cream-card border-b border-mist shadow-sm flex items-center px-4 gap-3">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-owl-orange text-ink px-4 py-2 rounded-btn z-50"
      >
        Ir para o conteúdo
      </a>

      <span className="font-bold text-ink text-lg">Banco Aurora</span>

      <nav className="ml-auto flex items-center gap-3 text-sm" aria-label="Navegação principal">
        {mounted && (
          <>
            {isAdmin && isChatPage && (
              <>
                <Link
                  href="/ingest"
                  className={`text-sm hover:underline ${isIngestActive ? 'text-ink font-semibold' : 'text-violet'}`}
                >
                  Base de Conhecimento
                </Link>
                <Link
                  href="/feedback"
                  className={`text-sm hover:underline ${isFeedbackActive ? 'text-ink font-semibold' : 'text-violet'}`}
                >
                  Feedback
                </Link>
              </>
            )}
            {user?.role === 'admin' && isChatPage && (
              <Link
                href="/config"
                className={`text-sm hover:underline ${isConfigActive ? 'text-ink font-semibold' : 'text-violet'}`}
              >
                Configurações
              </Link>
            )}
            {isAdminPage && (
              <Link
                href="/chat"
                className="flex items-center gap-1 text-sm text-owl-orange-dark font-semibold hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Voltar ao Chat
              </Link>
            )}
          </>
        )}
        {mounted && user && (
          <>
            <span aria-hidden="true" className="w-px h-5 bg-mist shrink-0" />
            <span
              aria-label={`Usuário: ${user.username}`}
              role="status"
              className="flex items-center gap-1.5 select-none"
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-slate-text">
                <circle cx="8" cy="5" r="3" fill="currentColor" />
                <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
              <span className="text-sm font-semibold text-ink max-w-[120px] truncate">
                {user.username}
              </span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-text border border-mist hover:border-error/50 hover:text-error hover:bg-error/5 transition-colors min-h-[36px]"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sair
            </button>
          </>
        )}
      </nav>
    </header>
  )
}
