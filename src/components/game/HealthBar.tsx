import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { getHealthBarColor, getHealthBarHexColor } from '@/utils/constants'

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
 * Animacao de pulse e gradiente quando valor muda
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
  const hexColor = getHealthBarHexColor(current, max)
  
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

  // Variantes de animacao da barra interna com gradiente
  const barVariants = {
    idle: { 
      opacity: 1,
      background: hexColor,
    },
    damage: {
      opacity: [1, 0.7, 1],
      background: [
        hexColor,
        '#ef4444',  // red flash
        hexColor,
      ],
      boxShadow: [
        '0 0 0 0 transparent',
        '0 0 10px 2px rgba(239, 68, 68, 0.5)',
        '0 0 0 0 transparent',
      ],
      transition: { duration: 0.4 },
    },
    heal: {
      opacity: 1,
      background: [
        hexColor,
        '#10b981',  // emerald flash
        hexColor,
      ],
      boxShadow: [
        '0 0 0 0 transparent',
        '0 0 15px 3px rgba(16, 185, 129, 0.6)',
        '0 0 5px 1px rgba(16, 185, 129, 0.3)',
      ],
      transition: { duration: 0.5 },
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
              className="tabular-nums font-medium"
              key={current}
              initial={{ 
                scale: 1.3, 
                color: animationType === 'damage' ? '#ef4444' : animationType === 'heal' ? '#10b981' : '#e5e5e5'
              }}
              animate={{ scale: 1, color: '#e5e5e5' }}
              transition={{ duration: 0.4, type: 'spring' as const }}
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
          className={`h-full rounded-full ${!animationType ? colorClass : ''}`}
          style={{ width: widthStyle }}
          variants={barVariants}
          animate={animationType || 'idle'}
        />
      </div>
    </motion.div>
  )
}
