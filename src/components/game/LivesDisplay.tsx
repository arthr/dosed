import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface LivesDisplayProps {
  /** Vidas atuais do jogador */
  lives: number
  /** Maximo de vidas */
  maxLives: number
  /** Tamanho dos icones */
  size?: 'sm' | 'md' | 'lg'
  /** Mostrar label "Vidas:" */
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
export function LivesDisplay({
  lives,
  maxLives,
  size = 'md',
  showLabel = true,
  animationType = null,
}: LivesDisplayProps) {
  // Ref para rastrear valor anterior
  const prevLivesRef = useRef(lives)
  const lostLifeIndexRef = useRef<number | null>(null)
  
  // Detecta qual vida foi perdida
  useEffect(() => {
    if (lives < prevLivesRef.current) {
      // Perdeu uma vida - o indice da vida perdida e o novo valor de lives
      // (porque lives e 0-indexed quando comparado com array)
      lostLifeIndexRef.current = lives
    }
    prevLivesRef.current = lives
  }, [lives])

  // Variantes para coracao ativo
  const heartVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 20 }
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
      transition: { duration: 0.5, ease: 'easeOut' }
    },
  }

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="text-sm text-muted-foreground">Vidas:</span>
      )}
      <div className="flex gap-1">
        <AnimatePresence mode="popLayout">
          {Array.from({ length: maxLives }).map((_, index) => {
            const isActive = index < lives
            const isLastLost = lostLifeIndexRef.current === index && !isActive
            
            return (
              <motion.span
                key={`heart-${index}-${isActive ? 'active' : 'inactive'}`}
                className={`${sizeClasses[size]} inline-block ${
                  isActive ? 'text-health-full' : 'text-muted-foreground/30'
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
                aria-label={isActive ? 'Vida ativa' : 'Vida perdida'}
              >
                {isActive ? '\u2665' : '\u2661'}
              </motion.span>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
