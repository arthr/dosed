import { motion, AnimatePresence } from 'framer-motion'
import { Shield } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface ResistanceDisplayProps {
  /** Resistencia atuais do jogador */
  resistance: number
  /** Maximo de resistencia */
  maxResistance: number
  /** Tamanho dos icones */
  size?: 'sm' | 'md' | 'lg'
  /** Mostrar label "Resistencia:" */
  showLabel?: boolean
  /** Tipo de animacao ativa */
  animationType?: 'damage' | 'collapse' | null
}

const sizeClasses = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
}

/**
 * Exibe as vidas do jogador como icones de coracao
 * Coracoes cheios = vidas ativas, vazios = vidas perdidas
 * Animacao de bounce quando perde uma vida
 */
export function ResistanceDisplay({
  resistance,
  maxResistance,
  size = 'md',
  showLabel = true,
  animationType = null,
}: ResistanceDisplayProps) {
  // Ref para rastrear valor anterior
  const prevResistanceRef = useRef(resistance)
  const lostResistanceIndexRef = useRef<number | null>(null)
  
  // Detecta qual vida foi perdida
  useEffect(() => {
    if (resistance < prevResistanceRef.current) {
      // Perdeu uma resistencia - o indice da resistencia perdida e o novo valor de resistance
      // (porque lives e 0-indexed quando comparado com array)
      lostResistanceIndexRef.current = resistance
    }
    prevResistanceRef.current = resistance
  }, [resistance])

  // Variantes para coracao ativo
  const heartVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 20 }
    },
    exit: { 
      scale: [1, 1.3, 0],
      opacity: [1, 1, 0],
      rotate: [0, -10, 10, 0],
      transition: { duration: 0.4 }
    },
  }

  // Variante para bounce no colapso
  const collapseVariants = {
    idle: { y: 0, scale: 1 },
    collapse: {
      y: [0, -8, 0],
      scale: [1, 1.2, 0.9, 1],
      transition: { duration: 0.5, ease: 'easeOut' as const }
    },
  }

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="text-sm text-muted-foreground">Resistencia:</span>
      )}
      <div className="flex gap-1">
        <AnimatePresence mode="popLayout">
          {Array.from({ length: maxResistance }).map((_, index) => {
            const isActive = index < resistance
            const isLastLost = lostResistanceIndexRef.current === index && !isActive
            
            return (
              <motion.span
                key={`resistance-${index}-${isActive ? 'active' : 'inactive'}`}
                className={`${sizeClasses[size]} inline-block ${
                  isActive ? 'text-shield' : 'text-muted-foreground/30'
                }`}
                variants={isActive ? heartVariants : undefined}
                initial={isActive ? 'initial' : { scale: 1, opacity: 1 }}
                animate={
                  animationType === 'collapse' && isLastLost
                    ? collapseVariants.collapse
                    : isActive 
                      ? 'animate' 
                      : { scale: 1, opacity: 0.3 }
                }
                exit="exit"
                layout
                aria-label={isActive ? 'Resistencia ativa' : 'Resistencia perdida'}
              >
                {isActive ? <Shield size={18} fill='currentColor' /> : <Shield size={18} />}
              </motion.span>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
