'use client'
import { useState, useEffect } from 'react'

const FEMALE_VOICE_KEYWORDS = ['maria', 'luciana', 'vitória', 'vitoria', 'camila', 'fernanda', 'isabela']

const AUDIO_INTRO = '/audio/tts-intro.mp3'
const AUDIO_OUTRO = '/audio/tts-outro.mp3'

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.+?)\]\(.*?\)/g, '$1')
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/___(.+?)___/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/-{3,}/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function pickFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  const ptVoices = voices.filter(v => v.lang.startsWith('pt'))
  const female = ptVoices.find(v =>
    FEMALE_VOICE_KEYWORDS.some(kw => v.name.toLowerCase().includes(kw))
  )
  return female ?? ptVoices.find(v => v.lang === 'pt-BR') ?? ptVoices[0] ?? null
}

function playAudio(src: string, signal: { cancelled: boolean }): Promise<void> {
  return new Promise((resolve) => {
    if (signal.cancelled) { resolve(); return }
    const audio = new Audio(src)
    const done = () => resolve()
    audio.onended = done
    audio.onerror = done
    audio.play().catch(done)
    // store reference for external cancellation
    ;(signal as typeof signal & { audio?: HTMLAudioElement }).audio = audio
  })
}

export function useTTS(text: string | null): { isSpeaking: boolean; beakOpen: boolean } {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [beakOpen,   setBeakOpen]   = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    if (text === null) {
      window.speechSynthesis.cancel()
      return
    }

    const signal: { cancelled: boolean; audio?: HTMLAudioElement } = { cancelled: false }

    let fallbackId:    ReturnType<typeof setInterval>  | null = null
    let fallbackCheck: ReturnType<typeof setTimeout>   | null = null
    let beakCloseId:   ReturnType<typeof setTimeout>   | null = null
    let fallbackBeak   = false

    const stopTimers = () => {
      if (fallbackId)    { clearInterval(fallbackId);   fallbackId    = null }
      if (fallbackCheck) { clearTimeout(fallbackCheck); fallbackCheck = null }
      if (beakCloseId)   { clearTimeout(beakCloseId);   beakCloseId   = null }
    }

    const run = async () => {
      setIsSpeaking(true)

      // Intro audio
      await playAudio(AUDIO_INTRO, signal)
      if (signal.cancelled) return

      // TTS
      const spokenText = stripMarkdown(text)
      window.speechSynthesis.cancel()
      const utterance  = new SpeechSynthesisUtterance(spokenText)
      utterance.lang   = 'pt-BR'
      utterance.rate   = 0.95
      utterance.pitch  = 1.1

      const voice = pickFemaleVoice()
      if (voice) utterance.voice = voice

      let boundaryFired = false

      utterance.onstart = () => {
        fallbackCheck = setTimeout(() => {
          if (!boundaryFired) {
            fallbackId = setInterval(() => {
              fallbackBeak = !fallbackBeak
              setBeakOpen(fallbackBeak)
            }, 350)
          }
        }, 600)
      }

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (event.name !== 'word') return
        boundaryFired = true
        if (fallbackId) { clearInterval(fallbackId); fallbackId = null }
        if (beakCloseId) { clearTimeout(beakCloseId); beakCloseId = null }
        setBeakOpen(true)
        beakCloseId = setTimeout(() => setBeakOpen(false), 180)
      }

      await new Promise<void>((resolve) => {
        const finish = () => { stopTimers(); setBeakOpen(false); resolve() }
        utterance.onend   = finish
        utterance.onerror = finish
        window.speechSynthesis.speak(utterance)
      })

      if (signal.cancelled) return

      // Outro audio
      await playAudio(AUDIO_OUTRO, signal)

      if (!signal.cancelled) {
        setIsSpeaking(false)
      }
    }

    run()

    return () => {
      signal.cancelled = true
      signal.audio?.pause()
      window.speechSynthesis.cancel()
      stopTimers()
      setIsSpeaking(false)
      setBeakOpen(false)
    }
  }, [text])

  return { isSpeaking, beakOpen }
}
