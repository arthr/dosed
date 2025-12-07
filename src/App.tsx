import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { GameLayout } from '@/components/layout/GameLayout'
import { useGameStore } from '@/stores/gameStore'
import { InfoPanel } from '@/components/game/InfoPanel'
import { GameBoard } from '@/components/game/GameBoard'

function GameContent() {
  const phase = useGameStore((state) => state.phase)
  const initGame = useGameStore((state) => state.initGame)
  const players = useGameStore((state) => state.players)
  const winner = useGameStore((state) => state.winner)
  const resetGame = useGameStore((state) => state.resetGame)
  const getGameStats = useGameStore((state) => state.getGameStats)

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
    return <GameBoard />
  }

  // Tela de fim de jogo
  if (phase === 'ended') {
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
