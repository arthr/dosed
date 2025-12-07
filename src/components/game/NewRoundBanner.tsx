import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface NewRoundBannerProps {
  /** Se deve mostrar o banner */
  show: boolean
  /** Numero da rodada */
  round: number
  /** Callback quando animacao termina */
  onComplete?: () => void
  /** Duracao de exibicao em ms (padrao: 1500) */
  displayDuration?: number
}

/**
 * Banner animado que aparece quando uma nova rodada comeca
 */
export function NewRoundBanner({
  show,
  round,
  onComplete,
  displayDuration = 1500,
}: NewRoundBannerProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Controla visibilidade com auto-hide
  useEffect(() => {
    if (show) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, displayDuration)
      return () => clearTimeout(timer)
    }
  }, [show, displayDuration])

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: [0.9, 1.05, 1] }}
            transition={{ duration: 0.5, times: [0, 0.6, 1] }}
            className="bg-linear-to-br from-primary/90 to-primary/70 text-primary-foreground px-8 py-4 rounded-xl shadow-2xl"
          >
            <div className="text-center">
              <p className="text-sm uppercase tracking-wider opacity-80">Nova Rodada</p>
              <p className="text-4xl font-bold">{round}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

