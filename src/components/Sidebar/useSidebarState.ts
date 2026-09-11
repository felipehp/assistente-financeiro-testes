import { useState, useEffect, useCallback } from 'react'

export interface SidebarState {
  collapsed: boolean
  toggle: () => void
  setCollapsed: (value: boolean) => void
  mounted: boolean
}

/**
 * Persisted collapse/expand state for a sidebar section.
 * `key` is expected to be stable for the lifetime of the consumer.
 * Use `mounted` to gate transitions and avoid hydration flashes.
 */
export function useSidebarState(
  key: string,
  defaultCollapsed = true,
): SidebarState {
  // Lazy initialiser reads localStorage once on first render, so no setState
  // inside an effect is needed for the stored value.
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultCollapsed
    try {
      const stored = localStorage.getItem(key)
      if (stored === 'true') return true
      if (stored === 'false') return false
    } catch (e) {
      console.warn(`useSidebarState: read failed for "${key}"`, e)
    }
    return defaultCollapsed
  })

  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  const persist = useCallback(
    (value: boolean) => {
      if (typeof window === 'undefined') return
      try {
        localStorage.setItem(key, String(value))
      } catch (e) {
        console.warn(`useSidebarState: write failed for "${key}"`, e)
      }
    },
    [key],
  )

  const setCollapsed = useCallback(
    (value: boolean) => {
      setCollapsedState(value)
      persist(value)
    },
    [persist],
  )

  const toggle = useCallback(() => {
    setCollapsedState(prev => {
      const next = !prev
      persist(next)
      return next
    })
  }, [persist])

  return { collapsed, toggle, setCollapsed, mounted }
}
