import { motion } from 'framer-motion'
import { Shield, Lock } from 'lucide-react'
import type { Player } from '@/types'
import { LivesDisplay } from './LivesDisplay'
import { FloatingNumber } from './FloatingNumber'
import { InventoryBar } from './InventoryBar'
import { PlayerToasts } from '../toasts/PlayerToasts'
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
  /** Tipo de efeito: resistance (verde/vermelho) ou life (rosa) */
  effectType?: 'resistance' | 'life'
  /** Callback ao clicar em um item do inventario */
  onItemClick?: (itemId: string) => void
  /** ID do item sendo usado (para highlight) */
  usingItemId?: string | null
}

// Cores para os efeitos de glow e borda
const COLORS = {
  // Glow durante feedback
  glow: {
    damage: 'rgba(239, 68, 68, 0.6)',      // red-500
    heal: 'rgba(16, 185, 129, 0.6)',       // emerald-500
    collapse: 'rgba(124, 58, 237, 0.7)',   // purple-500
    shield: 'rgba(234, 179, 8, 0.6)',      // yellow-500
  },
  // Borda durante feedback
  border: {
    damage: 'rgba(239, 68, 68, 0.8)',
    heal: 'rgba(16, 185, 129, 0.8)',
    collapse: 'rgba(124, 58, 237, 0.9)',
    shield: 'rgba(234, 179, 8, 0.9)',      // yellow-500
    turn: 'var(--primary)',
    idle: 'var(--border)',
  },
  // Background durante turno/feedback
  bg: {
    turn: 'rgba(var(--primary-rgb), 0.05)',
    damage: 'rgba(239, 68, 68, 0.05)',
    heal: 'rgba(16, 185, 129, 0.05)',
    collapse: 'rgba(124, 58, 237, 0.08)',
    shield: 'rgba(234, 179, 8, 0.08)',     // yellow-500
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
  effectType = 'resistance',
  onItemClick,
  usingItemId = null,
}: AnimatedPlayerAreaProps) {
  // Detecta efeitos ativos
  const shieldEffect = player.effects.find((e) => e.type === 'shield')
  const hasShield = !!shieldEffect
  const handcuffedEffect = player.effects.find((e) => e.type === 'handcuffed')
  const isHandcuffed = !!handcuffedEffect

  // Determina borda baseado em: feedback > shield > turno > idle
  const getBorderColor = () => {
    if (animationType === 'damage') return COLORS.border.damage
    if (animationType === 'heal') return COLORS.border.heal
    if (animationType === 'collapse') return COLORS.border.collapse
    if (hasShield) return COLORS.border.shield
    if (isCurrentTurn) return COLORS.border.turn
    return COLORS.border.idle
  }

  // Determina background baseado em: feedback > shield > turno > idle
  const getBackgroundColor = () => {
    if (animationType === 'damage') return COLORS.bg.damage
    if (animationType === 'heal') return COLORS.bg.heal
    if (animationType === 'collapse') return COLORS.bg.collapse
    if (hasShield) return COLORS.bg.shield
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

  // Glow para shield (quando nao ha animationType)
  const getShieldGlow = () => {
    if (!hasShield || animationType) return undefined
    return `0 0 15px 2px ${COLORS.glow.shield}`
  }

  // Variantes de animacao - movimento + glow sincronizados
  const variants = {
    idle: {
      x: 0,
      scale: 1,
      boxShadow: getShieldGlow() ?? '0 0 0 0 transparent',
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

  // Inventario da IA e apenas visualizacao (sempre desabilitado, sem callback)
  const isInventoryInteractive = !player.isAI && isCurrentTurn

  return (
    <div className="flex flex-col gap-2">
      {/* Toasts contextuais do jogador - acima do card */}
      <div className="min-h-[28px] flex items-end justify-center">
        <PlayerToasts playerId={player.id} />
      </div>

      <motion.div
        className="relative"
        variants={variants}
        animate={animationType || 'idle'}
      >
        {/* FloatingNumber para mostrar dano/cura/vida */}
        <FloatingNumber value={effectValue} type={effectType} />

        {/* Conteudo do card */}
        <Card className={cn(
          "py-2 gap-2",
          getBorderColor(),
          getBackgroundColor(),
        )}>
          {/* Header: Nome + Tags */}
          <CardHeader className="border-b pb-0! px-4 items-center">
            <div className="flex gap-1 items-center justify-between w-full">
              <h3 className="font-medium truncate text-xs">{player.name}</h3>
              <div className="flex gap-4 items-center">
                {/* Indicador de Shield */}
                {hasShield && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <Badge
                      variant="outline"
                      className="flex text-[8px] bg-yellow-500/20 border-yellow-500 text-yellow-500"
                    >
                      <Shield size={10} className="mr-0.5" />
                      {shieldEffect?.roundsRemaining}
                    </Badge>
                  </motion.div>
                )}
                {/* Indicador de Handcuffs */}
                {isHandcuffed && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <Badge
                      variant="outline"
                      className="flex text-[8px] bg-red-500/20 border-red-500 text-red-500"
                    >
                      <Lock size={10} className="mr-0.5" />
                      {handcuffedEffect?.roundsRemaining}
                    </Badge>
                  </motion.div>
                )}
                {/* Tag IA */}
                {player.isAI && (
                  <Badge variant="outline" className="text-[8px] bg-accent/80 text-game-accent border-game-accent">IA</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex justify-between items-center gap-2">
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

      {/* Barra de inventario (visivel para todos, interativo apenas para humano no seu turno) */}
      <InventoryBar
        items={player.inventory.items}
        usingItemId={usingItemId}
        disabled={!isInventoryInteractive}
        onItemClick={isInventoryInteractive ? onItemClick : undefined}
      />
    </div>
  )
}
