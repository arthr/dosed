import { useRef } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { usePillConsumption } from '@/hooks/usePillConsumption'
import { AnimatedPlayerArea } from './AnimatedPlayerArea'
import { PillPool } from './PillPool'
import { TurnIndicator } from './TurnIndicator'
import { PillReveal } from './PillReveal'
import { GameFeedback, useGameFeedback, type FeedbackEvent } from './GameFeedback'

/**
 * GameBoard - Tabuleiro principal do jogo
 * Compoe PlayerAreas, PillPool e TurnIndicator com animacoes
 */
export function GameBoard() {
  // State do store
  const players = useGameStore((s) => s.players)
  const currentTurn = useGameStore((s) => s.currentTurn)
  const pillPool = useGameStore((s) => s.pillPool)
  const typeCounts = useGameStore((s) => s.typeCounts)
  const round = useGameStore((s) => s.round)

  const player1 = players.player1
  const player2 = players.player2

  // Hook de consumo de pilula
  const {
    phase,
    revealedPill,
    effect,
    feedbackType,
    targetPlayer,
    isProcessing,
    startConsumption,
    confirmReveal,
    completeFeedback,
    getFeedbackMessage,
  } = usePillConsumption()

  // Hook de feedback visual
  const { currentFeedback, showFeedback, clearFeedback } = useGameFeedback()

  // Ref para armazenar dados do feedback (capturados antes da animacao de saida)
  const pendingFeedbackRef = useRef<Omit<FeedbackEvent, 'id'> | null>(null)

  // Jogador atual
  const currentPlayer = players[currentTurn]
  const isHumanTurn = !currentPlayer.isAI

  // Handler para click na pilula
  const handlePillSelect = (pillId: string) => {
    if (isProcessing) return
    if (!isHumanTurn) return // IA escolhe automaticamente
    startConsumption(pillId)
  }

  // Handler quando usuario confirma (click/countdown) - antes da animacao de saida
  const handleRevealConfirm = () => {
    // Captura os dados do feedback ANTES de mudar o estado
    if (feedbackType && revealedPill?.type) {
      pendingFeedbackRef.current = {
        type: feedbackType,
        message: getFeedbackMessage(),
        pillType: revealedPill.type,
        value: effect?.damageDealt || effect?.healReceived || undefined,
      }
    }

    // Aplica o efeito no store e muda fase para 'feedback'
    // Isso faz o PillReveal comecar a animacao de saida
    confirmReveal()
  }

  // Handler quando animacao de saida do PillReveal termina (lifecycle callback)
  const handleRevealExitComplete = () => {
    // Usa os dados capturados na ref (garantia que nao sao stale)
    if (pendingFeedbackRef.current) {
      showFeedback(pendingFeedbackRef.current)
      pendingFeedbackRef.current = null
    }
  }

  // Handler para feedback completo
  const handleFeedbackComplete = () => {
    clearFeedback()
    completeFeedback()
  }

  // Determina animacao do jogador baseado no efeito
  const getPlayerAnimation = (playerId: 'player1' | 'player2') => {
    if (phase !== 'feedback' || targetPlayer !== playerId) return null

    if (feedbackType === 'collapse') return 'collapse'
    if (feedbackType === 'damage' || feedbackType === 'fatal') return 'damage'
    if (feedbackType === 'heal') return 'heal'
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
        {/* Player 1 - Esquerda */}
        <div
          className={`
            p-4 rounded-lg border
            ${currentTurn === 'player1' ? 'border-primary bg-primary/5' : 'border-border'}
          `}
        >
          <AnimatedPlayerArea
            player={player1}
            isCurrentTurn={currentTurn === 'player1'}
            animationType={getPlayerAnimation('player1')}
          />
        </div>

        {/* Pill Pool - Centro */}
        <PillPool
          pills={pillPool}
          typeCounts={typeCounts}
          onSelectPill={handlePillSelect}
          disabled={isProcessing || !isHumanTurn}
          instructionMessage={
            isHumanTurn
              ? 'Clique em uma pilula para consumi-la'
              : 'Aguardando IA...'
          }
        />

        {/* Player 2 - Direita */}
        <div
          className={`
            p-4 rounded-lg border
            ${currentTurn === 'player2' ? 'border-primary bg-primary/5' : 'border-border'}
          `}
        >
          <AnimatedPlayerArea
            player={player2}
            isCurrentTurn={currentTurn === 'player2'}
            animationType={getPlayerAnimation('player2')}
          />
        </div>
      </div>

      {/* Overlay de revelacao - so mostra na fase 'revealing' */}
      <PillReveal
        pill={phase === 'revealing' ? revealedPill : null}
        onComplete={handleRevealConfirm}
        onExitComplete={handleRevealExitComplete}
      />

      {/* Feedback visual */}
      <GameFeedback event={currentFeedback} onComplete={handleFeedbackComplete} />
    </div>
  )
}
