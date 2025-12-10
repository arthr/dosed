import { motion, AnimatePresence } from 'framer-motion'
import { Check, Coins } from 'lucide-react'
import type { ShapeQuest } from '@/types'
import { ShapeIcon } from './ShapeIcon'

interface ShapeQuestDisplayProps {
  /** Quest do jogador (null se nao houver) */
  quest: ShapeQuest | null
  /** Classes CSS adicionais */
  className?: string
}

/**
 * Exibe o objetivo de sequencia de shapes do jogador
 * Mostra progresso, shapes a consumir e recompensa
 */
export function ShapeQuestDisplay({ quest, className = '' }: ShapeQuestDisplayProps) {
  if (!quest) return null

  // Quest completado - aguardando proxima rodada
  if (quest.completed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          flex items-center gap-2 px-2 py-1.5
          bg-emerald-500/10 border border-emerald-500/30 rounded
          ${className}
        `}
      >
        <Check size={14} className="text-emerald-500 shrink-0" />
        <span className="text-[10px] text-emerald-400 font-medium">
          Quest completo! Aguarde proxima rodada
        </span>
      </motion.div>
    )
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Header com label e recompensa */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Objetivo
        </span>
        <div className="flex items-center gap-1 text-[10px] text-amber-400">
          <Coins size={10} />
          <span>+1</span>
        </div>
      </div>

      {/* Sequencia de shapes */}
      <div className="flex items-center gap-1">
        <AnimatePresence mode="popLayout">
          {quest.sequence.map((shape, index) => {
            const isCompleted = index < quest.progress
            const isCurrent = index === quest.progress
            const isPending = index > quest.progress

            return (
              <motion.div
                key={`${quest.id}-shape-${index}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                {/* Container da shape */}
                <div
                  className={`
                    relative p-1 rounded transition-all duration-200
                    ${isCurrent ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                    ${isCompleted ? 'opacity-60' : ''}
                    ${isPending ? 'opacity-40' : ''}
                  `}
                >
                  <ShapeIcon
                    shape={shape}
                    size="sm"
                    className={isCompleted ? 'grayscale' : ''}
                  />

                  {/* Checkmark para shape completada */}
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5"
                    >
                      <Check size={8} className="text-white" />
                    </motion.div>
                  )}
                </div>

                {/* Seta entre shapes (exceto ultima) */}
                {index < quest.sequence.length - 1 && (
                  <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground">
                    {'>'}
                  </span>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

