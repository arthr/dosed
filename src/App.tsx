import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
  GameLayout,
  GameAreaLayout,
  PlayerContainer,
  TableContainer,
} from '@/components/layout/GameLayout'
import { useGameStore } from '@/stores/gameStore'
import { InfoPanel } from '@/components/game/InfoPanel'
import { PlayerArea } from '@/components/game/PlayerArea'
import { PillGrid } from '@/components/game/Pill'
import { TypeCounter } from '@/components/game/TypeCounter'

function GameContent() {
  const phase = useGameStore((state) => state.phase)
  const initGame = useGameStore((state) => state.initGame)
  const consumePill = useGameStore((state) => state.consumePill)
  const players = useGameStore((state) => state.players)
  const currentTurn = useGameStore((state) => state.currentTurn)
  const pillPool = useGameStore((state) => state.pillPool)
  const typeCounts = useGameStore((state) => state.typeCounts)
  const round = useGameStore((state) => state.round)

  // Tela inicial - Setup
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">
            Bem-vindo ao Side Effects
          </h2>
          <p className="text-muted-foreground">
            Escolha uma pilula. Sobreviva. Seja o ultimo.
          </p>
        </div>

        <Button size="lg" onClick={() => initGame()} className="px-8">
          Iniciar Partida
        </Button>

        {/* Info/Tutorial Panel */}
        <InfoPanel />
      </div>
    )
  }

  // Tela de jogo ativo
  if (phase === 'playing') {
    const player1 = players.player1
    const player2 = players.player2

    return (
      <GameAreaLayout
        statusArea={
          <div className="text-center space-y-1">
            <span className="text-sm text-muted-foreground">Rodada {round}</span>
            <h3 className="text-lg font-semibold text-foreground">
              Turno de {players[currentTurn].name}
            </h3>
          </div>
        }
        playerArea={
          <PlayerContainer isCurrentTurn={currentTurn === 'player1'} position="left">
            <PlayerArea player={player1} isCurrentTurn={currentTurn === 'player1'} />
          </PlayerContainer>
        }
        opponentArea={
          <PlayerContainer isCurrentTurn={currentTurn === 'player2'} position="right">
            <PlayerArea player={player2} isCurrentTurn={currentTurn === 'player2'} />
          </PlayerContainer>
        }
        tableArea={
          <TableContainer>
            <div className="space-y-4">
              <h3 className="text-center font-semibold text-foreground">
                Mesa de Pilulas
              </h3>

              {/* Type Counts */}
              <TypeCounter counts={typeCounts} />

              {/* Pills Grid */}
              <PillGrid
                pills={pillPool}
                onSelectPill={consumePill}
                disabled={players[currentTurn].isAI}
              />

              <p className="text-center text-xs text-muted-foreground">
                {players[currentTurn].isAI 
                  ? 'Aguardando jogada da IA...' 
                  : 'Clique em uma pilula para consumi-la'
                }
              </p>
            </div>
          </TableContainer>
        }
      />
    )
  }

  // Tela de fim de jogo
  if (phase === 'ended') {
    const { winner, resetGame, getGameStats } = useGameStore.getState()
    const stats = getGameStats()

    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <h2 className="text-3xl font-bold text-foreground">
          Fim de Jogo!
        </h2>
        <p className="text-xl text-primary">
          {winner ? `${players[winner].name} venceu!` : 'Empate!'}
        </p>

        <div className="text-sm text-muted-foreground space-y-1 text-center">
          <p>Rodadas: {stats.totalRounds}</p>
          <p>Pilulas consumidas: {stats.pillsConsumed}</p>
          <p>Colapsos: {stats.totalCollapses}</p>
        </div>

        <Button onClick={resetGame}>Jogar Novamente</Button>
      </div>
    )
  }

  return null
}

function App() {
  return (
    <TooltipProvider>
      <GameLayout>
        <GameContent />
      </GameLayout>
    </TooltipProvider>
  )
}

export default App
