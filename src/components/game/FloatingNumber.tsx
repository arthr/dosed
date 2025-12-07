import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

interface FloatingNumberProps {
  /** Valor a exibir (positivo para cura, negativo para dano) */
  value: number | null
  /** Callback quando animacao termina */
  onComplete?: () => void
}

/**
 * Numero flutuante que aparece e sobe quando ha dano/cura
 * Vermelho para dano, verde para cura
 * 
 * Usa um ID interno para controlar quando uma nova animacao deve iniciar,
 * evitando problemas com StrictMode e re-renders.
 */
export function FloatingNumber({ value, onComplete }: FloatingNumberProps) {
  // ID unico para cada "sessao" de animacao
  const [animationId, setAnimationId] = useState<number | null>(null)
  const [displayValue, setDisplayValue] = useState<number | null>(null)
  
  // Ref para evitar dupla execucao no StrictMode
  const hasTriggeredRef = useRef(false)
  const prevValueRef = useRef<number | null>(null)

  useEffect(() => {
    const isValidValue = value !== null && value !== 0
    const wasValidValue = prevValueRef.current !== null && prevValueRef.current !== 0

    // Detecta transicao de null/0 para valor valido
    if (isValidValue && !wasValidValue) {
      // Evita dupla execucao no StrictMode
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true
        setAnimationId(Date.now())
        setDisplayValue(value)
      }
    } else if (!isValidValue && wasValidValue) {
      // Reset quando value volta a null/0
      hasTriggeredRef.current = false
    }

    prevValueRef.current = value
  }, [value])

  // Quando animacao completa, limpa o estado
  const handleAnimationComplete = () => {
    setAnimationId(null)
    setDisplayValue(null)
    hasTriggeredRef.current = false
    onComplete?.()
  }

  if (animationId === null || displayValue === null) return null

  const isPositive = displayValue > 0
  const formattedValue = isPositive ? `+${displayValue}` : `${displayValue}`
  const colorClass = isPositive ? 'text-emerald-400' : 'text-red-400'

  return (
    <AnimatePresence>
      <motion.div
        key={animationId}
        initial={{ opacity: 1, y: 0, scale: 1 }}
        animate={{ opacity: 0, y: -40, scale: 1.2 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' as const }}
        onAnimationComplete={handleAnimationComplete}
        className={`absolute -top-2 right-0 text-2xl font-bold ${colorClass} pointer-events-none drop-shadow-lg`}
      >
        {formattedValue}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Wrapper que posiciona o FloatingNumber relativamente ao pai
 */
interface FloatingNumberContainerProps {
  children: React.ReactNode
  value: number | null
  onComplete?: () => void
}

export function FloatingNumberContainer({
  children,
  value,
  onComplete,
}: FloatingNumberContainerProps) {
  return (
    <div className="relative">
      {children}
      <FloatingNumber value={value} onComplete={onComplete} />
    </div>
  )
}
