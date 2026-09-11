'use client'
import { useState } from 'react'
import type { AvatarState, Movement } from '@/types/chat'
import { useSidebarState } from './useSidebarState'
import { SidebarSection } from './SidebarSection'
import { ConfigControls } from '@/components/ConfigControls'

// ── Avatar section data ────────────────────────────────────────────────────

const AVATAR_STATES: { value: AvatarState; label: string }[] = [
  { value: 'neutral',     label: 'Neutro' },
  { value: 'happy',       label: 'Feliz' },
  { value: 'encouraging', label: 'Encorajador' },
  { value: 'empathetic',  label: 'Empático' },
  { value: 'thoughtful',  label: 'Pensativo' },
]

const MOVEMENTS: { value: Movement; label: string }[] = [
  { value: 'idle',    label: 'Repouso' },
  { value: 'talking', label: 'Falando' },
  { value: 'thinking', label: 'Pensando' },
]

// ── Props ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  visible: boolean
  avatarState: AvatarState
  movement: Movement
  onAvatarStateChange: (state: AvatarState) => void
  onMovementChange: (movement: Movement) => void
}

// ── Avatar section content ─────────────────────────────────────────────────

interface AvatarSectionContentProps {
  avatarState: AvatarState
  movement: Movement
  onAvatarStateChange: (state: AvatarState) => void
  onMovementChange: (movement: Movement) => void
}

function AvatarSectionContent({
  avatarState,
  movement,
  onAvatarStateChange,
  onMovementChange,
}: AvatarSectionContentProps) {
  return (
    <>
      {/* Emotion buttons */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-text uppercase tracking-widest">
          Emoção
        </span>
        <div className="flex flex-wrap gap-1.5">
          {AVATAR_STATES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onAvatarStateChange(value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors min-h-[28px] ${
                avatarState === value
                  ? 'bg-owl-orange text-white border-owl-orange'
                  : 'text-owl-orange-dark border-owl-orange/30 hover:border-owl-orange bg-owl-orange-soft/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Movement buttons */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-text uppercase tracking-widest">
          Movimento
        </span>
        <div className="flex flex-wrap gap-1.5">
          {MOVEMENTS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onMovementChange(value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors min-h-[28px] ${
                movement === value
                  ? 'bg-violet text-white border-violet'
                  : 'text-violet-dark border-violet/30 hover:border-violet bg-violet-soft/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// ── Sidebar panel content (shared between desktop and mobile drawer) ────────

interface SidebarContentProps extends AvatarSectionContentProps {
  avatarCollapsed: boolean
  onAvatarToggle: () => void
  configCollapsed: boolean
  onConfigToggle: () => void
}

function SidebarContent({
  avatarState,
  movement,
  onAvatarStateChange,
  onMovementChange,
  avatarCollapsed,
  onAvatarToggle,
  configCollapsed,
  onConfigToggle,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {/* Avatar section */}
      <SidebarSection
        id="sidebar-avatar"
        title="Avatar"
        collapsed={avatarCollapsed}
        onToggle={onAvatarToggle}
      >
        <AvatarSectionContent
          avatarState={avatarState}
          movement={movement}
          onAvatarStateChange={onAvatarStateChange}
          onMovementChange={onMovementChange}
        />
      </SidebarSection>

      {/* Config section */}
      <SidebarSection
        id="sidebar-config"
        title="Configurações"
        collapsed={configCollapsed}
        onToggle={onConfigToggle}
      >
        <ConfigControls />
      </SidebarSection>
    </div>
  )
}

// ── Main Sidebar component ─────────────────────────────────────────────────

export function Sidebar({
  visible,
  avatarState,
  movement,
  onAvatarStateChange,
  onMovementChange,
}: SidebarProps) {
  const avatarSection = useSidebarState('sidebar-avatar-collapsed', false)
  const configSection = useSidebarState('sidebar-config-collapsed', true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (!visible) return null

  const contentProps: SidebarContentProps = {
    avatarState,
    movement,
    onAvatarStateChange,
    onMovementChange,
    avatarCollapsed: avatarSection.collapsed,
    onAvatarToggle: avatarSection.toggle,
    configCollapsed: configSection.collapsed,
    onConfigToggle: configSection.toggle,
  }

  return (
    <>
      {/* ── Desktop sidebar (md and above) ──────────────────────────────── */}
      <aside
        aria-label="Painel de controle"
        className="hidden md:flex flex-col w-[200px] shrink-0 border-r border-mist bg-cream-card h-[calc(100vh-64px)] sticky top-[64px]"
      >
        <SidebarContent {...contentProps} />
      </aside>

      {/* ── Mobile: icon bar on left edge (below md) ─────────────────────── */}
      <div className="md:hidden fixed left-0 top-[64px] z-30 flex flex-col gap-2 py-3 px-1.5 bg-cream-card border-r border-mist h-[calc(100vh-64px)]">
        {/* Avatar icon button */}
        <button
          type="button"
          aria-label="Abrir controles do avatar"
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-mist/50 transition-colors text-slate-text hover:text-ink"
        >
          <span aria-hidden="true" className="text-lg leading-none">&#x1F989;</span>
          <span className="text-[9px] font-medium leading-none">Avatar</span>
        </button>

        {/* Config icon button */}
        <button
          type="button"
          aria-label="Abrir configurações"
          onClick={() => { configSection.setCollapsed(false); setDrawerOpen(true) }}
          className="flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-mist/50 transition-colors text-slate-text hover:text-ink"
        >
          <span aria-hidden="true" className="text-lg leading-none">&#x2699;&#xFE0F;</span>
          <span className="text-[9px] font-medium leading-none">Config</span>
        </button>
      </div>

      {/* ── Mobile drawer overlay ─────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-ink/40"
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer panel */}
          <aside
            aria-label="Painel de controle"
            className="md:hidden fixed left-0 top-[64px] z-50 flex flex-col w-[260px] bg-cream-card border-r border-mist h-[calc(100vh-64px)] shadow-xl overflow-hidden"
          >
            {/* Drawer header with close button */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-mist shrink-0">
              <span className="text-[11px] font-bold text-slate-text uppercase tracking-widest">
                Controles
              </span>
              <button
                type="button"
                aria-label="Fechar painel"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-mist/50 transition-colors text-slate-text hover:text-ink"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M2 2l10 10M12 2L2 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <SidebarContent {...contentProps} />
          </aside>
        </>
      )}
    </>
  )
}
