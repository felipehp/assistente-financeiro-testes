'use client'
import { useEffect, useRef } from 'react'

interface Props {
  onAccept: () => void
  onDecline: () => void
}

export function LgpdModal({ onAccept, onDecline }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => { dialogRef.current?.showModal() }, [])

  return (
    <dialog
      ref={dialogRef}
      className="rounded-2xl p-6 max-w-sm w-full bg-cream-card shadow-xl border border-mist"
      aria-labelledby="lgpd-title"
    >
      <h2 id="lgpd-title" className="text-lg font-bold text-ink mb-3">Ativação de Microfone</h2>
      <p className="text-sm text-slate-text mb-4 leading-relaxed">
        O reconhecimento de voz usa a Web Speech API do Google. Seu áudio será enviado para servidores do Google para transcrição. Nenhum dado é armazenado pelo Banco Aurora.
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onDecline}
          className="rounded-xl px-4 py-2.5 border border-mist text-ink hover:bg-mist/30 transition-colors min-h-[44px]"
        >
          Cancelar
        </button>
        <button
          onClick={onAccept}
          className="rounded-xl px-4 py-2.5 bg-owl-orange hover:bg-owl-orange-dark text-ink transition-colors min-h-[44px] font-semibold"
        >
          Entendi e aceito
        </button>
      </div>
    </dialog>
  )
}
