import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { GameLayout } from '@/components/layout/GameLayout'
import {
  useGameActions,
  useGamePhase,
  usePlayers,
  useWinner,
  useGameStats,
} from '@/hooks'
import { InfoPanel } from '@/components/game/InfoPanel'
import { GameBoard } from '@/components/game/GameBoard'
import { GameOverDialog } from '@/components/game/GameOverDialog'

function GameContent() {
  // State
  const phase = useGamePhase()
  const { player1, player2 } = usePlayers()
  const winner = useWinner()
  const stats = useGameStats()

  // Actions
  const { startGame, restartGame } = useGameActions()

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

        <Button size="lg" onClick={() => startGame()} className="px-8">
          Iniciar Partida
        </Button>

        {/* Info/Tutorial Panel */}
        <InfoPanel />
      </div>
    )
  }

  // Tela de jogo ativo (inclui dialog de fim de jogo)
  return (
    <>
      <GameBoard />

      {/* Dialog de fim de jogo */}
      <GameOverDialog
        open={phase === 'ended'}
        winner={winner}
        players={{ player1, player2 }}
        stats={stats}
        onRestart={restartGame}
      />
    </>
  )
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
