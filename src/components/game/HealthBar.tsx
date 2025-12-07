import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { getHealthBarColor } from '@/utils/constants'

interface HealthBarProps {
  /** Valor atual de resistencia */
  current: number
  /** Valor maximo de resistencia */
  max: number
  /** Mostrar label "Resistencia" */
  showLabel?: boolean
  /** Mostrar valores numericos */
  showValues?: boolean
  /** Altura da barra */
  height?: 'sm' | 'md' | 'lg'
  /** Tipo de animacao ativa */
  animationType?: 'damage' | 'heal' | null
}

const heightClasses = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

/**
 * Barra de resistencia com cores dinamicas e animacoes
 * Verde > 66%, Amarelo 33-66%, Vermelho < 33%
 * Animacao de pulse quando valor muda
 */
export function HealthBar({
  current,
  max,
  showLabel = true,
  showValues = true,
  height = 'md',
  animationType = null,
}: HealthBarProps) {
  const percentage = max > 0 ? (current / max) * 100 : 0
  const colorClass = getHealthBarColor(current, max)
  
  // Ref para rastrear valor anterior
  const prevCurrentRef = useRef(current)
  
  // Spring para animar a largura suavemente
  const springWidth = useSpring(percentage, {
    stiffness: 100,
    damping: 15,
  })
  
  // Transforma spring em string de porcentagem
  const widthStyle = useTransform(springWidth, (value) => `${value}%`)
  
  // Atualiza spring quando percentage muda
  useEffect(() => {
    springWidth.set(percentage)
  }, [percentage, springWidth])
  
  // Detecta mudanca de valor para animacao
  useEffect(() => {
    prevCurrentRef.current = current
  }, [current])

  // Variantes de animacao do container
  const containerVariants = {
    idle: { scale: 1 },
    damage: {
      scale: [1, 1.02, 0.98, 1],
      transition: { duration: 0.3 },
    },
    heal: {
      scale: [1, 1.03, 1],
      transition: { duration: 0.4 },
    },
  }

  // Variantes de animacao da barra interna
  const barVariants = {
    idle: { opacity: 1 },
    damage: {
      opacity: [1, 0.6, 1],
      transition: { duration: 0.3 },
    },
    heal: {
      opacity: [1, 1.2, 1],
      filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
      transition: { duration: 0.4 },
    },
  }

  return (
    <motion.div 
      className="space-y-1"
      variants={containerVariants}
      animate={animationType || 'idle'}
    >
      {(showLabel || showValues) && (
        <div className="flex justify-between text-sm">
          {showLabel && (
            <span className="text-muted-foreground">Resistencia</span>
          )}
          {showValues && (
            <motion.span 
              className="text-foreground tabular-nums"
              key={current}
              initial={{ scale: 1.2, color: animationType === 'damage' ? '#ef4444' : animationType === 'heal' ? '#10b981' : undefined }}
              animate={{ scale: 1, color: 'var(--foreground)' }}
              transition={{ duration: 0.3 }}
            >
              {current}/{max}
            </motion.span>
          )}
        </div>
      )}
      <div
        className={`${heightClasses[height]} bg-muted rounded-full overflow-hidden`}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Resistencia: ${current} de ${max}`}
      >
        <motion.div
          className={`h-full ${colorClass} rounded-full`}
          style={{ width: widthStyle }}
          variants={barVariants}
          animate={animationType || 'idle'}
        />
      </div>
    </motion.div>
  )
}
