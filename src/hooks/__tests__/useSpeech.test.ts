import { renderHook, act } from '@testing-library/react'
import { useSpeech } from '../useSpeech'

const mockRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  interimResults: false,
  lang: '',
  continuous: false,
}

const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  speaking: false,
  getVoices: jest.fn(() => [{ lang: 'pt-BR', name: 'Google pt' }]),
}

beforeEach(() => {
  Object.defineProperty(window, 'SpeechRecognition', {
    value: jest.fn(() => mockRecognition),
    writable: true,
  })
  Object.defineProperty(window, 'webkitSpeechRecognition', {
    value: jest.fn(() => mockRecognition),
    writable: true,
  })
  Object.defineProperty(window, 'speechSynthesis', {
    value: mockSpeechSynthesis,
    writable: true,
  })
  jest.clearAllMocks()
})

test('supported é true quando SpeechRecognition existe', () => {
  const { result } = renderHook(() => useSpeech())
  expect(result.current.supported).toBe(true)
})

test('startListening chama recognition.start', () => {
  const { result } = renderHook(() => useSpeech())
  act(() => {
    result.current.startListening()
  })
  expect(mockRecognition.start).toHaveBeenCalled()
})

test('cancel chama speechSynthesis.cancel', () => {
  const { result } = renderHook(() => useSpeech())
  act(() => {
    result.current.cancel()
  })
  expect(mockSpeechSynthesis.cancel).toHaveBeenCalled()
})
