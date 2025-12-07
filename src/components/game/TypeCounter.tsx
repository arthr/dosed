import type { PillType } from '@/types'
import { PILL_LABELS } from '@/utils/constants'

interface TypeCounterProps {
  /** Contagem de cada tipo de pilula */
  counts: Record<PillType, number>
}

const typeStyles: Record<PillType, { bg: string; text: string }> = {
  SAFE: { bg: 'bg-pill-safe/20', text: 'text-pill-safe' },
  DMG_LOW: { bg: 'bg-pill-dmg-low/20', text: 'text-pill-dmg-low' },
  DMG_HIGH: { bg: 'bg-pill-dmg-high/20', text: 'text-pill-dmg-high' },
  FATAL: { bg: 'bg-pill-fatal/20', text: 'text-pill-fatal' },
  HEAL: { bg: 'bg-pill-heal/20', text: 'text-pill-heal' },
}

/**
 * Exibe a contagem publica de tipos de pilulas na mesa
 * Mostra quantas de cada tipo existem sem revelar quais sao quais
 */
export function TypeCounter({ counts }: TypeCounterProps) {
  const types: PillType[] = ['SAFE', 'DMG_LOW', 'DMG_HIGH', 'FATAL', 'HEAL']

  return (
    <div className="flex flex-wrap justify-center gap-2 text-xs">
      {types.map((type) => {
        const { bg, text } = typeStyles[type]
        const count = counts[type]
        
        // Oculta tipos com contagem 0
        if (count === 0) return null

        return (
          <span
            key={type}
            className={`px-2 py-1 rounded ${bg} ${text} font-medium`}
          >
            {PILL_LABELS[type]}: {count}
          </span>
        )
      })}
    </div>
  )
}

