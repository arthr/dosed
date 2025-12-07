import type { PillType } from '@/types'
import { Badge } from '@/components/ui/8bit/badge'
import { PILL_LABELS } from '@/utils/constants'

interface TypeCounterProps {
  /** Contagem de cada tipo de pilula */
  counts: Record<PillType, number>
}

const typeStyles: Record<PillType, string> = {
  SAFE: 'bg-pill-safe/20 text-pill-safe hover:bg-pill-safe/30 border-pill-safe/30',
  DMG_LOW: 'bg-pill-dmg-low/20 text-pill-dmg-low hover:bg-pill-dmg-low/30 border-pill-dmg-low/30',
  DMG_HIGH: 'bg-pill-dmg-high/20 text-pill-dmg-high hover:bg-pill-dmg-high/30 border-pill-dmg-high/30',
  FATAL: 'bg-pill-fatal/20 text-pill-fatal hover:bg-pill-fatal/30 border-pill-fatal/30',
  HEAL: 'bg-pill-heal/20 text-pill-heal hover:bg-pill-heal/30 border-pill-heal/30',
}

/**
 * Exibe a contagem publica de tipos de pilulas na mesa
 * Mostra quantas de cada tipo existem sem revelar quais sao quais
 */
export function TypeCounter({ counts }: TypeCounterProps) {
  const types: PillType[] = ['SAFE', 'DMG_LOW', 'DMG_HIGH', 'FATAL', 'HEAL']

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {types.map((type) => {
        const count = counts[type]
        
        // Oculta tipos com contagem 0
        if (count === 0) return null

        return (
          <Badge
            key={type}
            variant="outline"
            className={`${typeStyles[type]} font-medium`}
          >
            {PILL_LABELS[type]}: {count}
          </Badge>
        )
      })}
    </div>
  )
}
