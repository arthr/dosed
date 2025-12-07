import { motion, AnimatePresence } from 'framer-motion'

interface FloatingNumberProps {
  /** Valor a exibir (positivo para cura, negativo para dano) */
  value: number | null
  /** Callback quando animacao termina */
  onComplete?: () => void
}

/**
 * Numero flutuante que aparece e sobe quando ha dano/cura
 * Vermelho para dano, verde para cura
 */
export function FloatingNumber({ value, onComplete }: FloatingNumberProps) {
  if (value === null || value === 0) return null

  const isPositive = value > 0
  const displayValue = isPositive ? `+${value}` : `${value}`
  const colorClass = isPositive ? 'text-emerald-400' : 'text-red-400'

  return (
    <AnimatePresence>
      {value !== null && value !== 0 && (
        <motion.div
          key={value + Date.now()}
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -40, scale: 1.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          onAnimationComplete={onComplete}
          className={`absolute -top-2 right-0 text-2xl font-bold ${colorClass} pointer-events-none drop-shadow-lg`}
        >
          {displayValue}
        </motion.div>
      )}
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

