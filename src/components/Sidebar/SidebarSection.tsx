'use client'
import { ReactNode } from 'react'

interface SidebarSectionProps {
  title: string
  id: string
  children: ReactNode
  collapsed: boolean
  onToggle: () => void
}

export function SidebarSection({ title, id, children, collapsed, onToggle }: SidebarSectionProps) {
  return (
    <div className="border-b border-mist">
      <button
        id={`${id}-header`}
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls={`${id}-content`}
        className="w-full flex items-center justify-between px-4 py-3 text-[11px] font-bold text-slate-text uppercase tracking-widest hover:bg-mist/40 transition-colors"
      >
        <span>{title}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={`transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        id={`${id}-content`}
        role="region"
        aria-labelledby={`${id}-header`}
        inert={collapsed || undefined}
        className={`overflow-hidden transition-[max-height] duration-200 ${collapsed ? 'max-h-0' : 'max-h-[500px]'}`}
      >
        <div className="px-4 py-3 flex flex-col gap-2">
          {children}
        </div>
      </div>
    </div>
  )
}
