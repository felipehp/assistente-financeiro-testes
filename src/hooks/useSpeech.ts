'use client'
import { useState, useCallback, useRef, useEffect } from 'react'

// Minimal type declarations for the Web Speech API (not yet fully in TypeScript's DOM lib)
interface SpeechRecognitionResultItem {
  transcript: string
  confidence: number
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionResultItem
  length: number
  isFinal: boolean
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}
interface ISpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  continuous: boolean
  start(): void
  stop(): void
  addEventListener(type: 'result', listener: (e: SpeechRecognitionEvent) => void): void
  addEventListener(type: 'end', listener: () => void): void
}
interface ISpeechRecognitionConstructor {
  new(): ISpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor
    webkitSpeechRecognition?: ISpeechRecognitionConstructor
  }
}

export function useSpeech() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  const supported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  useEffect(() => {
    if (!supported) return

    const SRClass =
      window.SpeechRecognition ?? window.webkitSpeechRecognition!
    const recognition = new SRClass()
    recognition.lang = 'pt-BR'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.addEventListener('result', (e: SpeechRecognitionEvent) => {
      const current = Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript).join('')
      setTranscript(current)
    })
    recognition.addEventListener('end', () => setIsListening(false))

    recognitionRef.current = recognition
  }, [supported])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return
    setTranscript('')
    recognitionRef.current.start()
    setIsListening(true)
  }, [isListening])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const speak = useCallback((text: string, onBoundary?: () => void) => {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.9
    utterance.pitch = 1.05

    const voices = window.speechSynthesis.getVoices()
    const ptVoice = voices.find((v) => v.lang.startsWith('pt'))
    if (ptVoice) utterance.voice = ptVoice

    if (onBoundary) {
      utterance.onboundary = onBoundary
    }
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }, [])

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])

  return {
    isListening,
    isSpeaking,
    transcript,
    supported,
    startListening,
    stopListening,
    speak,
    cancel,
  }
}
