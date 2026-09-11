interface QuickReplyProps {
  options: string[]
  onSelect: (option: string) => void
}

export default function QuickReply({ options, onSelect }: QuickReplyProps) {
  if (options.length === 0) return null
  return (
    <div
      className="flex flex-wrap gap-2 px-4 pb-2 pt-1"
      role="group"
      aria-label="Opções rápidas de resposta"
    >
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className="rounded-full border-[1.5px] border-owl-orange text-owl-orange-dark bg-cream-card px-4 py-2 text-sm hover:bg-owl-orange hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-owl-orange-dark min-h-[44px]"
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
