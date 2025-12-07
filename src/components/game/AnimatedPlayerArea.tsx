import { motion } from 'framer-motion'
import type { Player } from '@/types'
import { LivesDisplay } from './LivesDisplay'
import { HealthBar } from './HealthBar'

interface AnimatedPlayerAreaProps {
  player: Player
  isCurrentTurn?: boolean
  /** Tipo de animacao a exibir */
  animationType?: 'damage' | 'heal' | 'collapse' | null
}

/**
 * Area do jogador com animacoes de feedback
 * Shake para dano, pulse verde para cura, shake intenso para colapso
 */
export function AnimatedPlayerArea({
  player,
  isCurrentTurn = false,
  animationType = null,
}: AnimatedPlayerAreaProps) {
  // Variantes de animacao do container
  const variants = {
    idle: { x: 0, scale: 1 },
    damage: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.4 },
    },
    heal: {
      scale: [1, 1.02, 1],
      transition: { duration: 0.3 },
    },
    collapse: {
      x: [0, -15, 15, -15, 15, -10, 10, 0],
      scale: [1, 0.98, 1],
      transition: { duration: 0.6 },
    },
  }

  // Classe de borda baseada no tipo de animacao
  const getBorderClass = () => {
    if (animationType === 'damage') return 'ring-2 ring-red-500/50'
    if (animationType === 'heal') return 'ring-2 ring-emerald-500/50'
    if (animationType === 'collapse') return 'ring-4 ring-purple-500/70'
    return ''
  }

  // Mapeia animationType do container para os componentes filhos
  const getHealthBarAnimation = (): 'damage' | 'heal' | null => {
    if (animationType === 'damage' || animationType === 'collapse') return 'damage'
    if (animationType === 'heal') return 'heal'
    return null
  }

  const getLivesAnimation = (): 'damage' | 'collapse' | null => {
    if (animationType === 'collapse') return 'collapse'
    return null
  }

  return (
    <motion.div
      className={`space-y-3 ${getBorderClass()} rounded-lg transition-shadow duration-300`}
      variants={variants}
      animate={animationType || 'idle'}
    >
      {/* Header: Nome + Tag IA */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{player.name}</h3>
        {player.isAI && (
          <span className="text-xs text-muted-foreground">(IA)</span>
        )}
      </div>

      {/* Lives com animacao de bounce */}
      <LivesDisplay
        lives={player.lives}
        maxLives={player.maxLives}
        animationType={getLivesAnimation()}
      />

      {/* Resistance Bar com animacao de pulse */}
      <HealthBar
        current={player.resistance}
        max={player.maxResistance}
        animationType={getHealthBarAnimation()}
      />

      {/* Turn Indicator */}
      {isCurrentTurn && (
        <motion.div
          className="text-xs text-primary font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Seu turno
        </motion.div>
      )}
    </motion.div>
  )
}
