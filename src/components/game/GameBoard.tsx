import { useGameStore } from '@/stores/gameStore'
import {
  GameAreaLayout,
  PlayerContainer,
  TableContainer,
} from '@/components/layout/GameLayout'
import { PlayerArea } from './PlayerArea'
import { PillPool } from './PillPool'
import { TurnIndicator } from './TurnIndicator'

/**
 * Tabuleiro completo do jogo
 * Compoe: Areas dos jogadores, Mesa de pilulas, Indicador de turno
 * Conectado ao gameStore via hooks
 */
export function GameBoard() {
  const players = useGameStore((state) => state.players)
  const currentTurn = useGameStore((state) => state.currentTurn)
  const pillPool = useGameStore((state) => state.pillPool)
  const typeCounts = useGameStore((state) => state.typeCounts)
  const round = useGameStore((state) => state.round)
  const consumePill = useGameStore((state) => state.consumePill)

  const player1 = players.player1
  const player2 = players.player2
  const currentPlayer = players[currentTurn]
  const isHumanTurn = !currentPlayer.isAI

  // Mensagem de instrucao baseada no estado
  const getInstructionMessage = () => {
    if (currentPlayer.isAI) {
      return 'Aguardando jogada da IA...'
    }
    return 'Clique em uma pilula para consumi-la'
  }

  return (
    <GameAreaLayout
      statusArea={
        <TurnIndicator
          currentPlayer={currentPlayer}
          round={round}
          isHumanTurn={isHumanTurn}
        />
      }
      playerArea={
        <PlayerContainer
          isCurrentTurn={currentTurn === 'player1'}
          position="left"
        >
          <PlayerArea
            player={player1}
            isCurrentTurn={currentTurn === 'player1'}
          />
        </PlayerContainer>
      }
      opponentArea={
        <PlayerContainer
          isCurrentTurn={currentTurn === 'player2'}
          position="right"
        >
          <PlayerArea
            player={player2}
            isCurrentTurn={currentTurn === 'player2'}
          />
        </PlayerContainer>
      }
      tableArea={
        <TableContainer>
          <PillPool
            pills={pillPool}
            typeCounts={typeCounts}
            onSelectPill={consumePill}
            disabled={!isHumanTurn}
            instructionMessage={getInstructionMessage()}
          />
        </TableContainer>
      }
    />
  )
}

