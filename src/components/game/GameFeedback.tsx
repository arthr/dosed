import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { PillType } from '@/types'
import { PILL_LABELS } from '@/utils/constants'

/**
 * Tipos de feedback visual
 */
export type FeedbackType = 'damage' | 'heal' | 'collapse' | 'safe' | 'fatal'

export interface FeedbackEvent {
  id: string
  type: FeedbackType
  message: string
  pillType?: PillType
  value?: number
}

interface GameFeedbackProps {
  event: FeedbackEvent | null
  onComplete?: () => void
}

const feedbackStyles: Record<FeedbackType, { bg: string; text: string; icon: string }> = {
  damage: { bg: 'bg-red-500/90', text: 'text-white', icon: '-' },
  heal: { bg: 'bg-emerald-500/90', text: 'text-white', icon: '+' },
  collapse: { bg: 'bg-purple-600/90', text: 'text-white', icon: '!' },
  safe: { bg: 'bg-green-500/90', text: 'text-white', icon: '~' },
  fatal: { bg: 'bg-purple-900/90', text: 'text-white', icon: 'X' },
}

/**
 * Componente de feedback visual para eventos do jogo
 * Exibe notificacoes animadas no centro da tela
 */
export function GameFeedback({ event, onComplete }: GameFeedbackProps) {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={() => {
            setTimeout(() => onComplete?.(), 800)
          }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
        >
          <div
            className={`
              ${feedbackStyles[event.type].bg}
              ${feedbackStyles[event.type].text}
              px-6 py-4 rounded-xl shadow-2xl
              flex flex-col items-center gap-2
            `}
          >
            {event.value !== undefined && (
              <span className="text-4xl font-bold">
                {feedbackStyles[event.type].icon}{Math.abs(event.value)}
              </span>
            )}
            <span className="text-lg font-medium">{event.message}</span>
            {event.pillType && (
              <span className="text-sm opacity-80">
                {PILL_LABELS[event.pillType]}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Hook para gerenciar feedback do jogo
 */
export function useGameFeedback() {
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackEvent | null>(null)
  const [queue, setQueue] = useState<FeedbackEvent[]>([])

  const showFeedback = (event: Omit<FeedbackEvent, 'id'>) => {
    const newEvent: FeedbackEvent = {
      ...event,
      id: `${Date.now()}-${Math.random()}`,
    }
    setQueue((prev) => [...prev, newEvent])
  }

  const clearFeedback = () => {
    setCurrentFeedback(null)
  }

  // Processa a fila de feedbacks
  useEffect(() => {
    if (!currentFeedback && queue.length > 0) {
      setCurrentFeedback(queue[0])
      setQueue((prev) => prev.slice(1))
    }
  }, [currentFeedback, queue])

  return {
    currentFeedback,
    showFeedback,
    clearFeedback,
  }
}

