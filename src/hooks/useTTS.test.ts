import { renderHook, act } from '@testing-library/react'
import { useTTS } from './useTTS'

// Flush all pending microtasks and React state updates
const flush = () => act(async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve()
})

const mockSpeak     = jest.fn()
const mockCancel    = jest.fn()
const mockGetVoices = jest.fn().mockReturnValue([])

type MockUtterance = {
  lang:        string
  rate:        number
  pitch:       number
  onstart:     (() => void) | null
  onend:       (() => void) | null
  onerror:     (() => void) | null
  onboundary:  ((e: { name: string }) => void) | null
}

let capturedUtterance: MockUtterance | null = null

interface MockAudioInstance {
  src:     string
  onended: (() => void) | null
  onerror: (() => void) | null
  pause:   jest.Mock
  play:    jest.Mock
}

let audioInstances: MockAudioInstance[] = []

function makeMockAudio(src: string): MockAudioInstance {
  const audio: MockAudioInstance = {
    src,
    onended: null,
    onerror: null,
    pause:   jest.fn(),
    play:    jest.fn(),
  }
  // play() fires onended synchronously so the async chain progresses with a single microtask flush
  audio.play.mockImplementation(() => {
    audio.onended?.()
    return Promise.resolve()
  })
  return audio
}

type UtteranceCtor = jest.Mock & { mock: { calls: Array<[string]> } }

beforeEach(() => {
  jest.useFakeTimers()
  capturedUtterance = null
  audioInstances    = []
  mockSpeak.mockClear()
  mockCancel.mockClear()
  mockGetVoices.mockClear()

  Object.defineProperty(global, 'Audio', {
    value:        jest.fn().mockImplementation((src: string) => {
      const audio = makeMockAudio(src)
      audioInstances.push(audio)
      return audio
    }),
    writable:     true,
    configurable: true,
  })

  Object.defineProperty(window, 'speechSynthesis', {
    value:        { speak: mockSpeak, cancel: mockCancel, getVoices: mockGetVoices },
    writable:     true,
    configurable: true,
  })

  ;(global as typeof globalThis & { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
    jest.fn().mockImplementation(() => {
      capturedUtterance = {
        lang: '', rate: 1, pitch: 1,
        onstart: null, onend: null, onerror: null, onboundary: null,
      }
      return capturedUtterance
    })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('useTTS', () => {
  it('não chama speak quando text é null', () => {
    renderHook(() => useTTS(null))
    expect(mockSpeak).not.toHaveBeenCalled()
  })

  it('chama speak quando text não é null', async () => {
    renderHook(() => useTTS('Olá'))
    await flush()
    expect(mockSpeak).toHaveBeenCalledTimes(1)
  })

  it('configura lang=pt-BR, rate=0.95, pitch=1.1', async () => {
    renderHook(() => useTTS('Olá'))
    await flush()
    expect(capturedUtterance!.lang).toBe('pt-BR')
    expect(capturedUtterance!.rate).toBe(0.95)
    expect(capturedUtterance!.pitch).toBe(1.1)
  })

  it('isSpeaking começa false', () => {
    const { result } = renderHook(() => useTTS(null))
    expect(result.current.isSpeaking).toBe(false)
  })

  it('isSpeaking vira true ao iniciar sequência', async () => {
    const { result } = renderHook(() => useTTS('Olá'))
    await act(async () => { await Promise.resolve() })
    expect(result.current.isSpeaking).toBe(true)
  })

  it('isSpeaking vira false após onend + outro áudio', async () => {
    const { result } = renderHook(() => useTTS('Olá'))
    await flush()
    act(() => { capturedUtterance!.onend?.() })
    await flush()
    expect(result.current.isSpeaking).toBe(false)
  })

  it('isSpeaking vira false após onerror + outro áudio', async () => {
    const { result } = renderHook(() => useTTS('Olá'))
    await flush()
    act(() => { capturedUtterance!.onerror?.() })
    await flush()
    expect(result.current.isSpeaking).toBe(false)
  })

  it('beakOpen vira true em onboundary do tipo word', async () => {
    const { result } = renderHook(() => useTTS('Olá mundo'))
    await flush()
    act(() => { capturedUtterance!.onstart?.() })
    act(() => { capturedUtterance!.onboundary?.({ name: 'word' }) })
    expect(result.current.beakOpen).toBe(true)
  })

  it('beakOpen vira false após 180ms', async () => {
    const { result } = renderHook(() => useTTS('Olá mundo'))
    await flush()
    act(() => { capturedUtterance!.onstart?.() })
    act(() => { capturedUtterance!.onboundary?.({ name: 'word' }) })
    act(() => { jest.advanceTimersByTime(180) })
    expect(result.current.beakOpen).toBe(false)
  })

  it('onboundary do tipo sentence não abre o bico', async () => {
    const { result } = renderHook(() => useTTS('Frase.'))
    await flush()
    act(() => { capturedUtterance!.onstart?.() })
    act(() => { capturedUtterance!.onboundary?.({ name: 'sentence' }) })
    expect(result.current.beakOpen).toBe(false)
  })

  it('beakOpen vira false em onend mesmo que estivesse true', async () => {
    const { result } = renderHook(() => useTTS('Olá'))
    await flush()
    act(() => { capturedUtterance!.onstart?.() })
    act(() => { capturedUtterance!.onboundary?.({ name: 'word' }) })
    act(() => { capturedUtterance!.onend?.() })
    expect(result.current.beakOpen).toBe(false)
  })

  it('ativa fallback interval após 600ms sem onboundary', async () => {
    const { result } = renderHook(() => useTTS('Olá'))
    await flush()
    act(() => { capturedUtterance!.onstart?.() })
    act(() => { jest.advanceTimersByTime(600) })
    act(() => { jest.advanceTimersByTime(350) })
    expect(result.current.beakOpen).toBe(true)
    act(() => { jest.advanceTimersByTime(350) })
    expect(result.current.beakOpen).toBe(false)
  })

  it('cancela fala anterior ao receber novo text', async () => {
    const { rerender } = renderHook(
      ({ text }: { text: string | null }) => useTTS(text),
      { initialProps: { text: 'Texto 1' as string | null } },
    )
    await flush()
    rerender({ text: 'Texto 2' })
    await flush()
    expect(mockCancel).toHaveBeenCalled()
    expect(mockSpeak).toHaveBeenCalledTimes(2)
  })

  it('cancela fala quando text vira null', async () => {
    const { rerender } = renderHook(
      ({ text }: { text: string | null }) => useTTS(text),
      { initialProps: { text: 'Texto 1' as string | null } },
    )
    await flush()
    rerender({ text: null })
    expect(mockCancel).toHaveBeenCalled()
  })

  it('toca intro antes do TTS e outro depois', async () => {
    renderHook(() => useTTS('Olá'))
    await flush()
    act(() => { capturedUtterance!.onend?.() })
    await flush()
    expect(audioInstances).toHaveLength(2)
    expect(audioInstances[0].src).toBe('/audio/tts-intro.mp3')
    expect(audioInstances[1].src).toBe('/audio/tts-outro.mp3')
  })

  describe('stripMarkdown', () => {
    let UtteranceMock: UtteranceCtor

    beforeEach(() => {
      UtteranceMock = (global as typeof globalThis & { SpeechSynthesisUtterance: UtteranceCtor }).SpeechSynthesisUtterance
      UtteranceMock.mockClear()
    })

    const spokenText = async () => {
      await flush()
      return UtteranceMock.mock.calls[0]?.[0] as string
    }

    it('passa texto limpo sem onomatopeias', async () => {
      renderHook(() => useTTS('Olá'))
      expect(await spokenText()).toBe('Olá')
    })

    it('remove asteriscos de negrito e itálico', async () => {
      renderHook(() => useTTS('**Importante** e *itálico*'))
      expect(await spokenText()).toBe('Importante e itálico')
    })

    it('remove underscores de itálico e negrito', async () => {
      renderHook(() => useTTS('__negrito__ e _itálico_'))
      expect(await spokenText()).toBe('negrito e itálico')
    })

    it('remove heading markdown', async () => {
      renderHook(() => useTTS('## Título'))
      expect(await spokenText()).toBe('Título')
    })

    it('remove código inline', async () => {
      renderHook(() => useTTS('use `npm install`'))
      expect(await spokenText()).toBe('use npm install')
    })

    it('remove bloco de código', async () => {
      renderHook(() => useTTS('```\nconst x = 1\n```'))
      expect(await spokenText()).toBe('')
    })

    it('converte dupla quebra de linha em pausa', async () => {
      renderHook(() => useTTS('Linha 1\n\nLinha 2'))
      expect(await spokenText()).toBe('Linha 1. Linha 2')
    })

    it('remove links e mantém o label', async () => {
      renderHook(() => useTTS('[clique aqui](https://example.com)'))
      expect(await spokenText()).toBe('clique aqui')
    })
  })

  it('guard: retorna valores padrão quando speechSynthesis indisponível', () => {
    Object.defineProperty(window, 'speechSynthesis', {
      value: undefined, writable: true, configurable: true,
    })
    const { result } = renderHook(() => useTTS('Olá'))
    expect(result.current.isSpeaking).toBe(false)
    expect(result.current.beakOpen).toBe(false)
  })
})
