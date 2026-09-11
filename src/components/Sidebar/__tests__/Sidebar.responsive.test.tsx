/**
 * Task 7 – Sidebar Responsive Behaviour Tests
 *
 * jsdom does not apply CSS media queries, so both the desktop <aside> and the
 * mobile icon-bar are simultaneously present in the DOM.  Every test works
 * around that by querying elements through stable IDs (e.g. `sidebar-avatar-header`)
 * or through `aria-label` selectors that are unique to a particular region.
 *
 * Coverage map (matches the testing plan steps):
 *
 *  Step 2 – Desktop elements rendered
 *    · Desktop <aside aria-label="Painel de controle"> exists in the DOM
 *    · Avatar and Config section toggle buttons exist with correct aria attributes
 *    · Emotion / movement buttons are accessible
 *    · Callback props fire with the expected values
 *
 *  Step 4 – Mobile drawer
 *    · Icon bar buttons (owl / config) are in the DOM
 *    · Clicking owl icon opens the drawer
 *    · Clicking config icon opens the drawer with Config section expanded
 *    · Drawer close (X) button dismisses the drawer
 *    · Backdrop click dismisses the drawer
 *    · Drawer gone from DOM after closing
 *
 *  Step 5 – Collapsed-state persistence
 *    · Toggling a section writes the correct key/value to localStorage
 *    · On re-mount the stored value is read back to initialise collapsed state
 *    · Collapse state is preserved when the mobile drawer closes and re-opens
 *
 *  Accessibility invariants
 *    · aria-expanded is consistent with visible state
 *    · aria-controls points to an existing element in the DOM
 *    · inert attribute blocks interaction on collapsed panels
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Sidebar } from '../index'

// ---------------------------------------------------------------------------
// Mock fetch: ConfigControls calls GET /config on mount.  We return a promise
// that NEVER resolves so ConfigControls stays in its "loading" spinner state
// for the entire test and never triggers out-of-act state updates.
// This is safe because our tests only care about sidebar structure/behaviour,
// not about ConfigControls rendering its form fields.
// ---------------------------------------------------------------------------
global.fetch = jest.fn(() => new Promise<Response>(() => {/* intentionally never resolves */}))

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

interface MockStorage extends Storage {
  _data: Record<string, string>
}

function makeMockStorage(initial: Record<string, string> = {}): MockStorage {
  const store: Record<string, string> = { ...initial }
  const s: MockStorage = {
    _data: store,
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { Object.keys(store).forEach(k => delete store[k]) },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
  }
  return s
}

function installStorage(initial: Record<string, string> = {}): MockStorage {
  const storage = makeMockStorage(initial)
  Object.defineProperty(window, 'localStorage', { value: storage, writable: true })
  return storage
}

// ---------------------------------------------------------------------------
// Sidebar default props
// ---------------------------------------------------------------------------

const defaultProps = {
  visible: true,
  avatarState: 'neutral' as const,
  movement: 'idle' as const,
  onAvatarStateChange: jest.fn(),
  onMovementChange: jest.fn(),
}

function renderSidebar(overrides: Partial<typeof defaultProps> = {}) {
  return render(<Sidebar {...defaultProps} {...overrides} />)
}

// ---------------------------------------------------------------------------
// Helpers — target elements by stable HTML id to avoid media-query ambiguity
// ---------------------------------------------------------------------------

/** Returns the desktop sidebar <aside> element. */
function desktopAside(): HTMLElement {
  // The desktop aside is the one whose *direct* children contain #sidebar-avatar-header.
  // In practice it has a specific data-testid-free structure, so we find it via
  // its aria-label and verify it contains the section toggle we know is in the desktop tree.
  const all = screen.getAllByRole('complementary', { name: /painel de controle/i })
  // Desktop aside always contains #sidebar-avatar-header at some depth.
  return all.find(el => el.querySelector('#sidebar-avatar-header') !== null)!
}

/** Returns the Avatar section toggle button (by id, unique in DOM). */
function avatarToggle(): HTMLElement {
  const el = document.getElementById('sidebar-avatar-header')
  if (!el) throw new Error('#sidebar-avatar-header not found in DOM')
  return el as HTMLElement
}

/** Returns the Config section toggle button (by id, unique in DOM). */
function configToggle(): HTMLElement {
  const el = document.getElementById('sidebar-config-header')
  if (!el) throw new Error('#sidebar-config-header not found in DOM')
  return el as HTMLElement
}

/** Returns the drawer close button, which only exists while the drawer is open. */
function drawerCloseButton(): HTMLElement {
  return screen.getByRole('button', { name: /fechar painel/i })
}

// =============================================================================
// Test suites
// =============================================================================

// ── visible=false ─────────────────────────────────────────────────────────────
describe('Sidebar – visible=false', () => {
  it('renders nothing when visible is false', () => {
    installStorage()
    const { container } = renderSidebar({ visible: false })
    expect(container.firstChild).toBeNull()
  })
})

// ── Step 2 – Desktop layout elements ─────────────────────────────────────────
describe('Sidebar – desktop layout elements', () => {
  beforeEach(() => { installStorage() })

  it('renders a complementary landmark with label "Painel de controle"', () => {
    renderSidebar()
    // At least one desktop aside must exist
    expect(screen.getAllByRole('complementary', { name: /painel de controle/i }).length).toBeGreaterThanOrEqual(1)
  })

  it('desktop aside contains the Avatar section toggle (#sidebar-avatar-header)', () => {
    renderSidebar()
    const aside = desktopAside()
    expect(aside).toBeInTheDocument()
    expect(aside.querySelector('#sidebar-avatar-header')).toBeInTheDocument()
  })

  it('desktop aside contains the Config section toggle (#sidebar-config-header)', () => {
    renderSidebar()
    const aside = desktopAside()
    expect(aside.querySelector('#sidebar-config-header')).toBeInTheDocument()
  })

  it('Avatar section starts expanded – aria-expanded="true" by default', () => {
    renderSidebar()
    expect(avatarToggle()).toHaveAttribute('aria-expanded', 'true')
  })

  it('Config section starts collapsed – aria-expanded="false" by default', () => {
    renderSidebar()
    expect(configToggle()).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking Avatar toggle collapses the section (aria-expanded becomes false)', () => {
    renderSidebar()
    fireEvent.click(avatarToggle())
    expect(avatarToggle()).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking Avatar toggle twice restores expanded state', () => {
    renderSidebar()
    fireEvent.click(avatarToggle())
    fireEvent.click(avatarToggle())
    expect(avatarToggle()).toHaveAttribute('aria-expanded', 'true')
  })

  it('clicking Config toggle expands the Config section', () => {
    renderSidebar()
    fireEvent.click(configToggle())
    expect(configToggle()).toHaveAttribute('aria-expanded', 'true')
  })

  it('aria-controls on Avatar toggle points to an element that exists in the DOM', () => {
    renderSidebar()
    const controlsId = avatarToggle().getAttribute('aria-controls')
    expect(controlsId).toBeTruthy()
    expect(document.getElementById(controlsId!)).toBeInTheDocument()
  })

  it('aria-controls on Config toggle points to an element that exists in the DOM', () => {
    renderSidebar()
    const controlsId = configToggle().getAttribute('aria-controls')
    expect(controlsId).toBeTruthy()
    expect(document.getElementById(controlsId!)).toBeInTheDocument()
  })
})

// ── Step 2 – Avatar and movement buttons ─────────────────────────────────────
describe('Sidebar – emotion and movement controls', () => {
  beforeEach(() => { installStorage() })

  it('renders all five emotion buttons when Avatar section is expanded', () => {
    renderSidebar()
    // These are inside the avatar section content; we scope to the desktop aside.
    const aside = desktopAside()
    expect(aside.querySelector('[type="button"]')).not.toBeNull()
    // Check by text content, which is unique per emotion label
    const labels = ['Neutro', 'Feliz', 'Encorajador', 'Empático', 'Pensativo']
    labels.forEach(label => {
      // At least one button with this text somewhere in the DOM
      const found = Array.from(document.querySelectorAll('button')).some(
        btn => btn.textContent?.trim() === label,
      )
      expect(found).toBe(true)
    })
  })

  it('renders all three movement buttons when Avatar section is expanded', () => {
    renderSidebar()
    const labels = ['Repouso', 'Falando', 'Pensando']
    labels.forEach(label => {
      const found = Array.from(document.querySelectorAll('button')).some(
        btn => btn.textContent?.trim() === label,
      )
      expect(found).toBe(true)
    })
  })

  it('clicking "Feliz" fires onAvatarStateChange("happy")', () => {
    const onAvatarStateChange = jest.fn()
    renderSidebar({ onAvatarStateChange })
    const felizBtn = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.trim() === 'Feliz',
    )!
    fireEvent.click(felizBtn)
    expect(onAvatarStateChange).toHaveBeenCalledWith('happy')
  })

  it('clicking "Pensando" fires onMovementChange("thinking")', () => {
    const onMovementChange = jest.fn()
    renderSidebar({ onMovementChange })
    const pensandoBtn = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.trim() === 'Pensando',
    )!
    fireEvent.click(pensandoBtn)
    expect(onMovementChange).toHaveBeenCalledWith('thinking')
  })

  it('clicking "Neutro" fires onAvatarStateChange("neutral")', () => {
    const onAvatarStateChange = jest.fn()
    renderSidebar({ onAvatarStateChange })
    const neutroBtn = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.trim() === 'Neutro',
    )!
    fireEvent.click(neutroBtn)
    expect(onAvatarStateChange).toHaveBeenCalledWith('neutral')
  })

  it('clicking "Repouso" fires onMovementChange("idle")', () => {
    const onMovementChange = jest.fn()
    renderSidebar({ onMovementChange })
    const repBtn = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.trim() === 'Repouso',
    )!
    fireEvent.click(repBtn)
    expect(onMovementChange).toHaveBeenCalledWith('idle')
  })
})

// ── Step 4 – Mobile icon bar ──────────────────────────────────────────────────
describe('Sidebar – mobile icon bar', () => {
  beforeEach(() => { installStorage() })

  it('renders the owl icon button (aria-label "Abrir controles do avatar")', () => {
    renderSidebar()
    expect(screen.getByRole('button', { name: /abrir controles do avatar/i })).toBeInTheDocument()
  })

  it('renders the config icon button (aria-label "Abrir configurações")', () => {
    renderSidebar()
    expect(screen.getByRole('button', { name: /abrir configurações/i })).toBeInTheDocument()
  })
})

// ── Step 4 – Mobile drawer open / close ──────────────────────────────────────
describe('Sidebar – mobile drawer open and close', () => {
  beforeEach(() => { installStorage() })

  it('clicking owl icon button opens the drawer overlay', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /abrir controles do avatar/i }))
    expect(screen.getByRole('button', { name: /fechar painel/i })).toBeInTheDocument()
  })

  it('drawer header shows the label "CONTROLES"', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /abrir controles do avatar/i }))
    expect(screen.getByText(/controles/i)).toBeInTheDocument()
  })

  it('drawer has an accessible complementary landmark', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /abrir controles do avatar/i }))
    // Now there should be ≥2 complementary regions (desktop aside + mobile drawer)
    expect(
      screen.getAllByRole('complementary', { name: /painel de controle/i }).length,
    ).toBeGreaterThanOrEqual(2)
  })

  it('clicking the X close button removes the drawer from the DOM', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /abrir controles do avatar/i }))
    fireEvent.click(drawerCloseButton())
    expect(screen.queryByRole('button', { name: /fechar painel/i })).toBeNull()
  })

  it('clicking the backdrop removes the drawer from the DOM', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /abrir controles do avatar/i }))
    const backdrop = document.querySelector('[aria-hidden="true"].fixed.inset-0')
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop!)
    expect(screen.queryByRole('button', { name: /fechar painel/i })).toBeNull()
  })

  it('backdrop is removed from DOM after the drawer closes', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /abrir controles do avatar/i }))
    fireEvent.click(drawerCloseButton())
    expect(document.querySelector('[aria-hidden="true"].fixed.inset-0')).toBeNull()
  })

  it('clicking config icon opens drawer with Config section expanded (aria-expanded=true)', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /abrir configurações/i }))
    // The Config toggle in the drawer should now be expanded
    const configToggles = Array.from(
      document.querySelectorAll('#sidebar-config-header'),
    ) as HTMLElement[]
    expect(configToggles.length).toBeGreaterThanOrEqual(1)
    const anyExpanded = configToggles.some(el => el.getAttribute('aria-expanded') === 'true')
    expect(anyExpanded).toBe(true)
  })

  it('drawer shows Avatar section content (emotion buttons)', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /abrir controles do avatar/i }))
    // Avatar section is expanded by default; emotion buttons appear
    const neutroButtons = Array.from(document.querySelectorAll('button')).filter(
      btn => btn.textContent?.trim() === 'Neutro',
    )
    expect(neutroButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('drawer can be reopened after being closed', () => {
    renderSidebar()
    const owlBtn = screen.getByRole('button', { name: /abrir controles do avatar/i })
    fireEvent.click(owlBtn)
    fireEvent.click(drawerCloseButton())
    fireEvent.click(owlBtn)
    expect(screen.getByRole('button', { name: /fechar painel/i })).toBeInTheDocument()
  })
})

// ── Step 5 – Collapse-state persistence ──────────────────────────────────────
describe('Sidebar – section collapse state persists to localStorage', () => {
  it('collapsing Avatar writes sidebar-avatar-collapsed="true" to localStorage', () => {
    const storage = installStorage()
    const spy = jest.spyOn(storage, 'setItem')

    renderSidebar()
    fireEvent.click(avatarToggle())

    expect(spy).toHaveBeenCalledWith('sidebar-avatar-collapsed', 'true')
  })

  it('expanding Config writes sidebar-config-collapsed="false" to localStorage', () => {
    const storage = installStorage()
    const spy = jest.spyOn(storage, 'setItem')

    renderSidebar()
    fireEvent.click(configToggle())

    expect(spy).toHaveBeenCalledWith('sidebar-config-collapsed', 'false')
  })

  it('re-mount with stored "true" for avatar: Avatar toggle starts collapsed', () => {
    installStorage({ 'sidebar-avatar-collapsed': 'true' })
    renderSidebar()
    expect(avatarToggle()).toHaveAttribute('aria-expanded', 'false')
  })

  it('re-mount with stored "false" for config: Config toggle starts expanded', () => {
    installStorage({ 'sidebar-config-collapsed': 'false' })
    renderSidebar()
    expect(configToggle()).toHaveAttribute('aria-expanded', 'true')
  })

  it('collapse state survives drawer close + reopen cycle', () => {
    installStorage()
    renderSidebar()

    // Open drawer and collapse Avatar inside it (shared state with desktop toggle)
    fireEvent.click(screen.getByRole('button', { name: /abrir controles do avatar/i }))
    // Collapse the Avatar section via the desktop toggle (same useSidebarState instance)
    fireEvent.click(avatarToggle())
    // Close the drawer
    fireEvent.click(drawerCloseButton())
    // Reopen the drawer
    fireEvent.click(screen.getByRole('button', { name: /abrir controles do avatar/i }))

    // All #sidebar-avatar-header elements should show collapsed
    const toggles = Array.from(
      document.querySelectorAll('#sidebar-avatar-header'),
    ) as HTMLElement[]
    expect(toggles.length).toBeGreaterThanOrEqual(1)
    const allCollapsed = toggles.every(el => el.getAttribute('aria-expanded') === 'false')
    expect(allCollapsed).toBe(true)
  })

  it('toggle is idempotent: two collapses then two expands returns to initial state', () => {
    installStorage()
    renderSidebar()

    // Avatar starts expanded
    expect(avatarToggle()).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(avatarToggle()) // collapse
    fireEvent.click(avatarToggle()) // expand
    expect(avatarToggle()).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(avatarToggle()) // collapse
    fireEvent.click(avatarToggle()) // expand
    expect(avatarToggle()).toHaveAttribute('aria-expanded', 'true')
  })
})

// ── Accessibility invariants ──────────────────────────────────────────────────
describe('Sidebar – accessibility invariants', () => {
  beforeEach(() => { installStorage() })

  it('Avatar panel has inert removed when expanded', () => {
    renderSidebar()
    const panel = document.getElementById('sidebar-avatar-content')!
    expect(panel.hasAttribute('inert')).toBe(false)
  })

  it('Config panel has inert applied when collapsed (default)', () => {
    renderSidebar()
    const panel = document.getElementById('sidebar-config-content')!
    expect(panel.hasAttribute('inert')).toBe(true)
  })

  it('Avatar panel gets inert after being collapsed', () => {
    renderSidebar()
    fireEvent.click(avatarToggle())
    const panel = document.getElementById('sidebar-avatar-content')!
    expect(panel.hasAttribute('inert')).toBe(true)
  })

  it('Config panel loses inert after being expanded', () => {
    renderSidebar()
    fireEvent.click(configToggle())
    const panel = document.getElementById('sidebar-config-content')!
    expect(panel.hasAttribute('inert')).toBe(false)
  })

  it('all interactive sidebar buttons have a non-negative tabIndex (keyboard accessible)', () => {
    renderSidebar()
    const aside = desktopAside()
    const buttons = Array.from(aside.querySelectorAll('button'))
    buttons.forEach(btn => {
      const ti = btn.getAttribute('tabindex')
      if (ti !== null) {
        expect(Number(ti)).toBeGreaterThanOrEqual(0)
      }
    })
  })

  it('mobile owl icon button has a visible accessible name', () => {
    renderSidebar()
    const owlBtn = screen.getByRole('button', { name: /abrir controles do avatar/i })
    expect(owlBtn).toHaveAccessibleName()
  })

  it('mobile config icon button has a visible accessible name', () => {
    renderSidebar()
    const cfgBtn = screen.getByRole('button', { name: /abrir configurações/i })
    expect(cfgBtn).toHaveAccessibleName()
  })
})
