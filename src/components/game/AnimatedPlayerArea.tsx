import { motion } from 'framer-motion'
import type { Player } from '@/types'
import { LivesDisplay } from './LivesDisplay'
import { FloatingNumber } from './FloatingNumber'
import { Card, CardContent, CardHeader } from '../ui/8bit/card'
import { cn } from '@/lib/utils'
import { Badge } from '../ui/8bit/badge'
import { ResistanceDisplay } from './ResistanceDisplay'

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
  const getResistanceAnimation = (): 'damage' | 'collapse' | null => {
    if (animationType === 'collapse') return 'collapse'
    return null
  }

  const getLivesAnimation = (): 'damage' | 'collapse' | null => {
    if (animationType === 'collapse') return 'collapse'
    return null
  }

  return (
    <motion.div
      className="relative"
      variants={variants}
      animate={animationType || 'idle'}
    >
      {/* FloatingNumber para mostrar dano/cura */}
      <FloatingNumber value={effectValue} />

      {/* Conteudo do card */}
      <Card className={cn(
        "py-2 gap-2",
        getBorderColor(),
        getBackgroundColor(),
      )}>
        {/* Header: Nome + Tag IA */}
        <CardHeader className="border-b pb-0! items-center">
          {/* <Avatar className="size-8" variant="pixel">
              <AvatarImage src="/avatars/orcdev.jpeg" alt={player.name} />
              <AvatarFallback className="text-[8px]">
                {player.name.charAt(0).toUpperCase() + player.name.charAt(1).toUpperCase()}
              </AvatarFallback>
            </Avatar> */}

          <div className="flex gap-1 items-center justify-between">
            <h3 className="font-medium truncate text-xs">{player.name}</h3>
            {player.isAI ? (
              <Badge variant="default" className="text-[8px] bg-accent text-game-accent">IA</Badge>
            ) : (
              <Badge variant="secondary" className="text-[8px]">Lv.25</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          {/* Lives com animacao de bounce */}
          <LivesDisplay
            showLabel={false}
            lives={player.lives}
            maxLives={player.maxLives}
            animationType={getLivesAnimation()}
          />

          {/* Resistance Bar com animacao de pulse */}
          <ResistanceDisplay
            showLabel={false}
            resistance={player.resistance}
            maxResistance={player.maxResistance}
            animationType={getResistanceAnimation()}
          />

          {/* Turn Indicator - sempre renderizado para manter altura consistente */}
          {/* <motion.div
            className="text-xs font-medium h-4 text-primary"
            initial={false}
            animate={{ opacity: isCurrentTurn ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            Seu turno
          </motion.div> */}
        </CardContent>
      </Card>
    </motion.div>
  )
}
