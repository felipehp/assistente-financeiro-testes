import { renderHook, act } from '@testing-library/react'
import { useSidebarState } from '../useSidebarState'

// ---------------------------------------------------------------------------
// localStorage mock helpers
// ---------------------------------------------------------------------------

function mockLocalStorage(store: Record<string, string> = {}) {
  const data: Record<string, string> = { ...store }
  return {
    getItem: jest.fn((k: string) => data[k] ?? null),
    setItem: jest.fn((k: string, v: string) => { data[k] = v }),
    removeItem: jest.fn((k: string) => { delete data[k] }),
    clear: jest.fn(() => { Object.keys(data).forEach(k => delete data[k]) }),
    get length() { return Object.keys(data).length },
    key: jest.fn((i: number) => Object.keys(data)[i] ?? null),
  }
}

function throwingLocalStorage() {
  return {
    getItem: jest.fn(() => { throw new DOMException('QuotaExceeded') }),
    setItem: jest.fn(() => { throw new DOMException('QuotaExceeded') }),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(() => null),
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSidebarState', () => {
  let originalLocalStorage: Storage

  beforeAll(() => {
    originalLocalStorage = window.localStorage
  })

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    })
    jest.restoreAllMocks()
  })

  // -------------------------------------------------------------------------
  // 1. Default initialisation
  // -------------------------------------------------------------------------

  it('returns defaultCollapsed=true before mount', () => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage(),
      writable: true,
    })

    const { result } = renderHook(() => useSidebarState('test-key'))

    // Before the effect fires we can only check the type; after act() it resolves.
    act(() => {})

    expect(typeof result.current.collapsed).toBe('boolean')
    expect(result.current.mounted).toBe(true)
    expect(result.current.collapsed).toBe(true) // default
  })

  it('accepts a custom defaultCollapsed=false', () => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage(),
      writable: true,
    })

    const { result } = renderHook(() => useSidebarState('custom-key', false))
    act(() => {})

    expect(result.current.collapsed).toBe(false)
  })

  it('exposes toggle, setCollapsed and mounted in the return object', () => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage(),
      writable: true,
    })

    const { result } = renderHook(() => useSidebarState('api-key'))
    act(() => {})

    expect(typeof result.current.toggle).toBe('function')
    expect(typeof result.current.setCollapsed).toBe('function')
    expect(typeof result.current.mounted).toBe('boolean')
  })

  // -------------------------------------------------------------------------
  // 2. Loading persisted value from localStorage on mount
  // -------------------------------------------------------------------------

  it('reads "false" from localStorage and sets collapsed to false', () => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage({ 'sidebar-nav': 'false' }),
      writable: true,
    })

    const { result } = renderHook(() =>
      useSidebarState('sidebar-nav', true),
    )
    act(() => {})

    expect(result.current.collapsed).toBe(false)
  })

  it('reads "true" from localStorage and sets collapsed to true', () => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage({ 'sidebar-nav': 'true' }),
      writable: true,
    })

    const { result } = renderHook(() =>
      useSidebarState('sidebar-nav', false),
    )
    act(() => {})

    expect(result.current.collapsed).toBe(true)
  })

  // -------------------------------------------------------------------------
  // 3. Toggle — persists new value and flips state
  // -------------------------------------------------------------------------

  it('toggle flips collapsed from true to false and writes to localStorage', () => {
    const storage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      writable: true,
    })

    const { result } = renderHook(() => useSidebarState('tog-key', true))
    act(() => {})
    expect(result.current.collapsed).toBe(true)

    act(() => { result.current.toggle() })

    expect(result.current.collapsed).toBe(false)
    expect(storage.setItem).toHaveBeenLastCalledWith('tog-key', 'false')
  })

  it('toggle flips collapsed from false to true and writes to localStorage', () => {
    const storage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      writable: true,
    })

    const { result } = renderHook(() => useSidebarState('tog-key', false))
    act(() => {})

    act(() => { result.current.toggle() })

    expect(result.current.collapsed).toBe(true)
    expect(storage.setItem).toHaveBeenLastCalledWith('tog-key', 'true')
  })

  it('calling toggle twice returns to original value', () => {
    const storage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      writable: true,
    })

    const { result } = renderHook(() => useSidebarState('double-tog', true))
    act(() => {})

    act(() => { result.current.toggle() })
    act(() => { result.current.toggle() })

    expect(result.current.collapsed).toBe(true)
  })

  // -------------------------------------------------------------------------
  // 4. Invalid / missing storage values fall back to default
  // -------------------------------------------------------------------------

  it('ignores unrecognised stored value and keeps default', () => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage({ 'bad-key': 'TRUE' }),
      writable: true,
    })

    const { result } = renderHook(() => useSidebarState('bad-key', false))
    act(() => {})

    // 'TRUE' is not exactly 'true' or 'false' — default (false) must be kept
    expect(result.current.collapsed).toBe(false)
  })

  it('keeps default when localStorage returns null (no stored entry)', () => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage(),
      writable: true,
    })

    const { result } = renderHook(() => useSidebarState('missing-key', true))
    act(() => {})

    expect(result.current.collapsed).toBe(true)
  })

  // -------------------------------------------------------------------------
  // 5. localStorage error handling — read throws
  // -------------------------------------------------------------------------

  it('does not throw when localStorage.getItem throws, and still sets mounted', () => {
    Object.defineProperty(window, 'localStorage', {
      value: throwingLocalStorage(),
      writable: true,
    })

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderHook(() =>
      useSidebarState('err-read-key', true),
    )
    act(() => {})

    expect(result.current.mounted).toBe(true)
    expect(result.current.collapsed).toBe(true) // default preserved
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('read failed'),
      expect.anything(),
    )
  })

  // -------------------------------------------------------------------------
  // 6. localStorage error handling — write throws (via toggle)
  // -------------------------------------------------------------------------

  it('does not throw when localStorage.setItem throws during toggle', () => {
    const storage = mockLocalStorage()
    storage.setItem.mockImplementation(() => {
      throw new DOMException('QuotaExceeded')
    })
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      writable: true,
    })

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderHook(() => useSidebarState('err-write-key', true))
    act(() => {})

    expect(() => {
      act(() => { result.current.toggle() })
    }).not.toThrow()

    // State still flips in memory even when persistence fails
    expect(result.current.collapsed).toBe(false)
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('write failed'),
      expect.anything(),
    )
  })

  // -------------------------------------------------------------------------
  // 7. setCollapsed direct setter
  // -------------------------------------------------------------------------

  it('setCollapsed sets state directly to true', () => {
    const storage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      writable: true,
    })

    const { result } = renderHook(() => useSidebarState('set-key', false))
    act(() => {})

    act(() => { result.current.setCollapsed(true) })

    expect(result.current.collapsed).toBe(true)
    expect(storage.setItem).toHaveBeenLastCalledWith('set-key', 'true')
  })

  it('setCollapsed sets state directly to false', () => {
    const storage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      writable: true,
    })

    const { result } = renderHook(() => useSidebarState('set-key', true))
    act(() => {})

    act(() => { result.current.setCollapsed(false) })

    expect(result.current.collapsed).toBe(false)
    expect(storage.setItem).toHaveBeenLastCalledWith('set-key', 'false')
  })

  // -------------------------------------------------------------------------
  // 8. Referential stability — toggle and setCollapsed are memoised
  // -------------------------------------------------------------------------

  it('toggle reference is stable across re-renders', () => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage(),
      writable: true,
    })

    const { result, rerender } = renderHook(() =>
      useSidebarState('stable-key'),
    )
    act(() => {})

    const firstToggle = result.current.toggle
    rerender()

    expect(result.current.toggle).toBe(firstToggle)
  })

  it('setCollapsed reference is stable across re-renders', () => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage(),
      writable: true,
    })

    const { result, rerender } = renderHook(() =>
      useSidebarState('stable-key'),
    )
    act(() => {})

    const firstSet = result.current.setCollapsed
    rerender()

    expect(result.current.setCollapsed).toBe(firstSet)
  })
})
