import { motion, AnimatePresence } from 'framer-motion'
import type { Player } from '@/types'

interface TurnIndicatorProps {
  /** Jogador do turno atual */
  currentPlayer: Player
  /** Numero da rodada */
  round: number
  /** Se o turno e do jogador humano (para mensagem contextual) */
  isHumanTurn?: boolean
}

// Variantes estaticas para rodada (vertical)
const roundVariants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
}

// Variantes estaticas para turno (scale + fade)
// Animacao simetrica evita problemas com direcao dinamica
const turnVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
}

// Variantes para mensagem IA
const aiMessageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  pulse: { 
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const }
  },
}

/**
 * Indicador de turno e rodada com animacoes de transicao
 * Exibe de quem e o turno atual e instrucoes contextuais
 */
export function TurnIndicator({
  currentPlayer,
  round,
  isHumanTurn = true,
}: TurnIndicatorProps) {
  const isAIThinking = !isHumanTurn && currentPlayer.isAI

  return (
    <div className="text-center space-y-1">
      {/* Rodada - anima quando muda */}
      <AnimatePresence mode="wait">
        <motion.span
          key={round}
          variants={roundVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2 }}
          className="text-sm text-muted-foreground inline-block"
        >
          Rodada {round}
        </motion.span>
      </AnimatePresence>

      {/* Nome do jogador - anima quando muda turno */}
      <AnimatePresence mode="wait">
        <motion.h3
          key={currentPlayer.id}
          variants={turnVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ 
            duration: 0.25,
            type: 'spring' as const, 
            stiffness: 300,
            damping: 25,
          }}
          className="text-lg font-semibold text-foreground"
        >
          Turno de{' '}
          <span className={currentPlayer.isAI ? 'text-orange-400' : 'text-primary'}>
            {currentPlayer.name}
          </span>
        </motion.h3>
      </AnimatePresence>

      {/* Mensagem de IA pensando - altura fixa para evitar layout shift */}
      <div className="h-4">
        <AnimatePresence>
          {isAIThinking && (
            <motion.p
              key="ai-thinking"
              variants={aiMessageVariants}
              initial="hidden"
              animate="pulse"
              exit="hidden"
              className="text-xs text-muted-foreground"
            >
              A IA esta pensando...
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
