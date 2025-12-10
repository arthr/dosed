import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface NewRoundOverlayProps {
  /** Numero da rodada */
  round: number
  /** Callback quando animacao termina */
  onComplete: () => void
  /** Duracao de exibicao em ms (padrao: 1500) */
  displayDuration?: number
}

/**
 * Overlay animado que aparece quando uma nova rodada comeca
 * Auto-dismiss apos displayDuration
 */
export function NewRoundOverlay({
  round,
  onComplete,
  displayDuration = 1500,
}: NewRoundOverlayProps) {
  const hasCompletedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Auto-dismiss apos displayDuration
  useEffect(() => {
    if (hasCompletedRef.current) return

    const timer = setTimeout(() => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true
        onCompleteRef.current()
      }
    }, displayDuration)

    return () => clearTimeout(timer)
  }, [displayDuration])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-40"
    >
      <motion.div
        initial={{ scale: 0.8, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: [0.9, 1.05, 1] }}
          transition={{ duration: 0.5, times: [0, 0.6, 1] }}
          className="bg-linear-to-br from-primary/90 to-primary/70 text-primary-foreground px-8 py-4 rounded-xl shadow-2xl"
        >
          <div className="text-center">
            <p className="text-sm uppercase tracking-wider opacity-80">Nova Rodada</p>
            <p className="text-4xl font-normal">{round}</p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

