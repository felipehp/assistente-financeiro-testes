'use client'

interface Props {
  onRate: (emoji: 'happy' | 'neutral' | 'sad') => void
  onDismiss: () => void
}

const OPTIONS: { value: 'happy' | 'neutral' | 'sad'; label: string; emoji: string }[] = [
  { value: 'sad',     label: 'Insatisfeito', emoji: '😞' },
  { value: 'neutral', label: 'Neutro',       emoji: '😐' },
  { value: 'happy',   label: 'Satisfeito',   emoji: '😊' },
]

export function SessionRatingToast({ onRate, onDismiss }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-rating-title"
      className="fixed bottom-4 right-4 bg-cream-card rounded-2xl border border-mist shadow-xl p-5 z-50 max-w-xs"
    >
      <p id="session-rating-title" className="text-sm font-semibold text-ink mb-3">
        Como foi sua experiência?
      </p>
      <div className="flex justify-around mb-4">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            aria-label={opt.label}
            onClick={() => onRate(opt.value)}
            className="text-3xl hover:scale-125 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {opt.emoji}
          </button>
        ))}
      </div>
      <button
        onClick={onDismiss}
        className="text-xs text-slate-text hover:text-ink w-full text-center min-h-[36px]"
      >
        Pular
      </button>
    </div>
  )
}
