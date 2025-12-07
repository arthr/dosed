import { useGameStore } from '@/stores/gameStore'
import { usePillConsumption } from '@/hooks/usePillConsumption'
import { useAIPlayer } from '@/hooks/useAIPlayer'
import { AnimatedPlayerArea } from './AnimatedPlayerArea'
import { PillPool } from './PillPool'
import { TurnIndicator } from './TurnIndicator'

/**
 * GameBoard - Tabuleiro principal do jogo
 * Compoe PlayerAreas, PillPool e TurnIndicator
 *
 * Overlays (PillReveal, GameOver, NewRound) sao gerenciados pelo OverlayManager
 * Toasts sao gerenciados pelo ToastManager
 */
export function GameBoard() {
  // State do store
  const players = useGameStore((s) => s.players)
  const currentTurn = useGameStore((s) => s.currentTurn)
  const pillPool = useGameStore((s) => s.pillPool)
  const typeCounts = useGameStore((s) => s.typeCounts)
  const round = useGameStore((s) => s.round)
  const gamePhase = useGameStore((s) => s.phase)

  const player1 = players.player1
  const player2 = players.player2

  // Hook de consumo de pilula
  const {
    phase,
    effect,
    feedbackType,
    targetPlayer,
    isProcessing,
    startConsumption,
  } = usePillConsumption()

  // Jogador atual
  const currentPlayer = players[currentTurn]
  const isHumanTurn = !currentPlayer.isAI
  const isRoundEnding = gamePhase === 'roundEnding'

  // Hook da IA - joga automaticamente quando e turno dela
  useAIPlayer({
    currentPlayer,
    pillPool,
    phase,
    gamePhase,
    startConsumption,
  })

  // Handler para click na pilula
  const handlePillSelect = (pillId: string) => {
    if (isProcessing) return
    if (!isHumanTurn) return // IA escolhe automaticamente
    startConsumption(pillId)
  }

  // Determina animacao do jogador baseado no efeito
  const getPlayerAnimation = (playerId: 'player1' | 'player2') => {
    if (phase !== 'feedback' || targetPlayer !== playerId) return null

    if (feedbackType === 'collapse') return 'collapse'
    if (feedbackType === 'damage' || feedbackType === 'fatal') return 'damage'
    if (feedbackType === 'heal') return 'heal'
    return null
  }

  // Calcula o valor do efeito para FloatingNumber (negativo para dano, positivo para cura)
  const getEffectValue = (playerId: 'player1' | 'player2'): number | null => {
    if (phase !== 'feedback' || targetPlayer !== playerId) return null
    if (!effect) return null

    if (effect.damageDealt > 0) return -effect.damageDealt
    if (effect.healReceived > 0) return effect.healReceived
    return null
  }

  if (!player1 || !player2) return null

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Turn Indicator no topo */}
      <TurnIndicator
        currentPlayer={currentPlayer}
        round={round}
        isHumanTurn={isHumanTurn}
      />

      {/* Layout principal: Player1 | Pills | Player2 */}
      <div className="grid grid-cols-[1fr_2fr_1fr] gap-6 items-start">
        {/* Player 1 - Esquerda (card auto-suficiente) */}
        <AnimatedPlayerArea
          player={player1}
          isCurrentTurn={currentTurn === 'player1'}
          animationType={getPlayerAnimation('player1')}
          effectValue={getEffectValue('player1')}
        />

        {/* Pill Pool - Centro */}
        <PillPool
          pills={pillPool}
          typeCounts={typeCounts}
          round={round}
          onSelectPill={handlePillSelect}
          disabled={isProcessing || !isHumanTurn || isRoundEnding}
          instructionMessage={
            isRoundEnding
              ? 'Preparando proxima rodada...'
              : isHumanTurn
                ? 'Clique em uma pilula para consumi-la'
                : 'Aguardando IA...'
          }
        />

        {/* Player 2 - Direita (card auto-suficiente) */}
        <AnimatedPlayerArea
          player={player2}
          isCurrentTurn={currentTurn === 'player2'}
          animationType={getPlayerAnimation('player2')}
          effectValue={getEffectValue('player2')}
        />
      </div>
    </div>
  )
}
