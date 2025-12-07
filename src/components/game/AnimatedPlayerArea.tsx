import { motion } from 'framer-motion'
import type { Player } from '@/types'
import { LivesDisplay } from './LivesDisplay'
import { HealthBar } from './HealthBar'
import { FloatingNumber } from './FloatingNumber'

interface AnimatedPlayerAreaProps {
  player: Player
  isCurrentTurn?: boolean
  /** Tipo de animacao a exibir */
  animationType?: 'damage' | 'heal' | 'collapse' | null
  /** Valor do efeito (dano negativo, cura positivo) para FloatingNumber */
  effectValue?: number | null
}

// Cores para os efeitos de glow e borda
const COLORS = {
  // Glow durante feedback
  glow: {
    damage: 'rgba(239, 68, 68, 0.6)',      // red-500
    heal: 'rgba(16, 185, 129, 0.6)',       // emerald-500
    collapse: 'rgba(124, 58, 237, 0.7)',   // purple-500
  },
  // Borda durante feedback
  border: {
    damage: 'rgba(239, 68, 68, 0.8)',
    heal: 'rgba(16, 185, 129, 0.8)',
    collapse: 'rgba(124, 58, 237, 0.9)',
    turn: 'var(--primary)',
    idle: 'var(--border)',
  },
  // Background durante turno/feedback
  bg: {
    turn: 'rgba(var(--primary-rgb), 0.05)',
    damage: 'rgba(239, 68, 68, 0.05)',
    heal: 'rgba(16, 185, 129, 0.05)',
    collapse: 'rgba(124, 58, 237, 0.08)',
    idle: 'transparent',
  },
}

/**
 * Card do jogador auto-suficiente
 * Controla: container, border, padding, animacoes, glow
 * Single Responsibility: tudo relacionado a area do player
 */
export function AnimatedPlayerArea({
  player,
  isCurrentTurn = false,
  animationType = null,
  effectValue = null,
}: AnimatedPlayerAreaProps) {
  // Determina borda baseado em: feedback > turno > idle
  const getBorderColor = () => {
    if (animationType === 'damage') return COLORS.border.damage
    if (animationType === 'heal') return COLORS.border.heal
    if (animationType === 'collapse') return COLORS.border.collapse
    if (isCurrentTurn) return COLORS.border.turn
    return COLORS.border.idle
  }

  // Determina background baseado em: feedback > turno > idle
  const getBackgroundColor = () => {
    if (animationType === 'damage') return COLORS.bg.damage
    if (animationType === 'heal') return COLORS.bg.heal
    if (animationType === 'collapse') return COLORS.bg.collapse
    if (isCurrentTurn) return COLORS.bg.turn
    return COLORS.bg.idle
  }

  // Gera boxShadow para glow
  const getGlowShadow = (intensity: number = 1) => {
    if (!animationType) return '0 0 0 0 transparent'
    const color = COLORS.glow[animationType]
    const size = animationType === 'collapse' ? 25 : 20
    return `0 0 ${size * intensity}px ${4 * intensity}px ${color}`
  }

  // Variantes de animacao - movimento + glow sincronizados
  const variants = {
    idle: { 
      x: 0, 
      scale: 1,
      boxShadow: '0 0 0 0 transparent',
    },
    damage: {
      x: [0, -8, 8, -8, 8, 0],
      boxShadow: [
        '0 0 0 0 transparent',
        getGlowShadow(1.2),
        getGlowShadow(0.6),
        getGlowShadow(1.2),
        getGlowShadow(0.3),
      ],
      transition: { duration: 0.5 },
    },
    heal: {
      scale: [1, 1.015, 1],
      boxShadow: [
        '0 0 0 0 transparent',
        getGlowShadow(1.5),
        getGlowShadow(0.8),
      ],
      transition: { duration: 0.5 },
    },
    collapse: {
      x: [0, -12, 12, -12, 12, -8, 8, 0],
      scale: [1, 0.98, 1],
      boxShadow: [
        '0 0 0 0 transparent',
        getGlowShadow(1.5),
        getGlowShadow(0.7),
        getGlowShadow(1.5),
        getGlowShadow(0.4),
      ],
      transition: { duration: 0.7 },
    },
  }

  // Mapeia animationType para os componentes filhos
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
      className="p-4 rounded-lg border relative"
      style={{
        borderColor: getBorderColor(),
        backgroundColor: getBackgroundColor(),
      }}
      variants={variants}
      animate={animationType || 'idle'}
    >
      {/* FloatingNumber para mostrar dano/cura */}
      <FloatingNumber value={effectValue} />

      {/* Conteudo do card */}
      <div className="space-y-3">
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

        {/* Turn Indicator - sempre renderizado para manter altura consistente */}
        <motion.div
          className="text-xs font-medium h-4"
          initial={false}
          animate={{ 
            opacity: isCurrentTurn ? 1 : 0,
            color: isCurrentTurn ? 'var(--primary)' : 'transparent',
          }}
          transition={{ duration: 0.2 }}
        >
          Seu turno
        </motion.div>
      </div>
    </motion.div>
  )
}
