import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Coins, Sparkles, RotateCcw } from 'lucide-react'
import type { ShapeQuest } from '@/types'
import { ShapeIcon } from './ShapeIcon'

interface ShapeQuestDisplayProps {
  /** Quest do jogador (null se nao houver) */
  quest: ShapeQuest | null
  /** Classes CSS adicionais */
  className?: string
  /** Indica se o quest foi recentemente resetado (para animacao de shake) */
  justReset?: boolean
}

/**
 * Exibe o objetivo de sequencia de shapes do jogador
 * Mostra progresso, shapes a consumir e recompensa
 */
export function ShapeQuestDisplay({ quest, className = '', justReset = false }: ShapeQuestDisplayProps) {
  // Estado local para controlar animacao de shake
  const [isShaking, setIsShaking] = useState(false)

  // Dispara animacao de shake quando justReset muda para true
  useEffect(() => {
    if (justReset) {
      setIsShaking(true)
      const timer = setTimeout(() => setIsShaking(false), 600)
      return () => clearTimeout(timer)
    }
  }, [justReset])

  if (!quest) return null

  // Quest completado - aguardando proxima rodada
  if (quest.completed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`
          relative overflow-hidden
          flex items-center gap-2 px-3 py-2
          bg-linear-to-r from-emerald-500/15 to-emerald-400/10
          border border-emerald-500/40 rounded-lg
          ${className}
        `}
      >
        {/* Efeito de brilho animado */}
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-transparent via-emerald-400/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Sparkles size={14} className="text-emerald-400 shrink-0" />
        </motion.div>
        <span className="text-[9px] text-emerald-300 font-normal relative z-10">
          Quest conluida!
        </span>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.3 }}
          className="flex items-center gap-0.5 text-amber-400 ml-auto"
        >
          <Coins size={12} />
          <span className="text-[9px] font-normal">+1</span>
        </motion.div>
      </motion.div>
    )
  }

  // Variantes de animacao de shake
  const shakeVariants = {
    idle: { x: 0 },
    shake: {
      x: [-4, 4, -4, 4, -2, 2, 0],
      transition: { duration: 0.5 },
    },
  }

  return (
    <motion.div
      className={`flex flex-col gap-1.5 ${className}`}
      variants={shakeVariants}
      animate={isShaking ? 'shake' : 'idle'}
    >
      {/* Header com label e recompensa */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-muted-foreground uppercase tracking-wider font-medium">
            Quest
          </span>
          {/* Indicador de reset */}
          <AnimatePresence>
            {isShaking && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="flex items-center gap-0.5 text-red-400"
              >
                <RotateCcw size={10} className="animate-spin" />
                <span className="text-[9px]">Reset!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sequencia de shapes */}
      <div className="flex items-center gap-2">
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
                transition={{ 
                  delay: index * 0.08,
                  type: 'spring',
                  stiffness: 300,
                  damping: 20
                }}
                className="relative flex items-center"
              >
                {/* Container da shape com efeitos */}
                <motion.div
                  className={`
                    relative p-1.5 rounded-lg transition-all duration-300
                    ${isCurrent ? 'bg-primary/10' : ''}
                    ${isCompleted ? 'bg-emerald-500/10' : ''}
                  `}
                  animate={isCurrent ? {
                    boxShadow: [
                      '0 0 0 2px var(--primary)',
                      '0 0 8px 2px var(--primary)',
                      '0 0 0 2px var(--primary)',
                    ],
                  } : {}}
                  transition={isCurrent ? {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  } : {}}
                >
                  {/* Glow effect para shape atual */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-primary/20"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}

                  <ShapeIcon
                    shape={shape}
                    size="sm"
                    className={`
                      relative z-10 transition-all duration-300
                      ${isCompleted ? 'grayscale opacity-70' : ''}
                      ${isPending ? 'opacity-40' : ''}
                      ${isCurrent ? 'scale-110' : ''}
                    `}
                  />

                  {/* Checkmark animado para shape completada */}
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="absolute -top-1.5 -right-1.5 bg-emerald-500 rounded-full p-0.5 shadow-lg shadow-emerald-500/30"
                    >
                      <Check size={8} className="text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </motion.div>

                {/* Seta entre shapes (exceto ultima) */}
                {index < quest.sequence.length - 1 && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: isCompleted ? 0.4 : 0.6, x: 0 }}
                    transition={{ delay: index * 0.08 + 0.1 }}
                    className={`
                      ml-1 text-xs font-normal
                      ${isCompleted ? 'text-emerald-500/60' : 'text-muted-foreground/60'}
                    `}
                  >
                    {'>'}
                  </motion.span>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
