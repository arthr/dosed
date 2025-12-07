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

/**
 * Indicador de turno e rodada com animacoes de transicao
 * Exibe de quem e o turno atual e instrucoes contextuais
 */
export function TurnIndicator({
  currentPlayer,
  round,
  isHumanTurn = true,
}: TurnIndicatorProps) {
  return (
    <div className="text-center space-y-1">
      {/* Rodada - anima quando muda */}
      <AnimatePresence mode="wait">
        <motion.span
          key={round}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
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
          initial={{ opacity: 0, x: currentPlayer.id === 'player1' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: currentPlayer.id === 'player1' ? 20 : -20 }}
          transition={{ duration: 0.3, type: 'spring' as const, stiffness: 200 }}
          className="text-lg font-semibold text-foreground"
        >
          Turno de{' '}
          <span className={currentPlayer.isAI ? 'text-orange-400' : 'text-primary'}>
            {currentPlayer.name}
          </span>
        </motion.h3>
      </AnimatePresence>

      {/* Mensagem de IA pensando - sempre renderizado para manter altura consistente */}
      <motion.p
        className="text-xs text-muted-foreground h-4"
        initial={false}
        animate={{ 
          opacity: !isHumanTurn && currentPlayer.isAI ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
      >
        <motion.span
          animate={!isHumanTurn && currentPlayer.isAI ? { opacity: [0.5, 1, 0.5] } : { opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          A IA esta pensando...
        </motion.span>
      </motion.p>
    </div>
  )
}
