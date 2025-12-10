import { HashRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/8bit/tooltip'
import { Button } from '@/components/ui/8bit/button'
import { GameLayout } from '@/components/layout/GameLayout'
import { useGameActions, useGamePhase, useGameStats, useWinner, usePlayers } from '@/hooks'
import { InfoPanel } from '@/components/game/InfoPanel'
import { GameBoard } from '@/components/game/GameBoard'
import { ItemSelectionScreen } from '@/components/game/ItemSelectionScreen'
import { OverlayManager } from '@/components/overlays'
import { ToastManager } from '@/components/toasts'
import { useOverlayStore } from '@/stores/overlayStore'
import { DevPage } from '@/components/dev'
import { useEffect } from 'react'

function GameContent() {
  // State
  const phase = useGamePhase()
  const winner = useWinner()
  const stats = useGameStats()
  const { player1, player2 } = usePlayers()

  // Actions
  const { startGame } = useGameActions()

  // Overlay store - para abrir GameOver
  const openGameOver = useOverlayStore((s) => s.openGameOver)

  // Abre overlay de GameOver quando jogo termina
  useEffect(() => {
    if (phase === 'ended' && winner !== null) {
      openGameOver(winner, { player1, player2 }, stats)
    }
  }, [phase, winner, player1, player2, stats, openGameOver])

  // Tela inicial - Setup
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-normal text-foreground">
            Bem-vindo ao Dosed!
          </h2>
          <p className="text-muted-foreground">
            Escolha uma pílula. Sobreviva. Seja o último!
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

  // Tela de selecao de itens (pre-jogo)
  if (phase === 'itemSelection') {
    return <ItemSelectionScreen />
  }

  // Tela de jogo ativo
  return <GameBoard />
}

function GamePage() {
  return (
    <>
      <GameLayout>
        <GameContent />
      </GameLayout>

      {/* Sistemas globais de UI */}
      <OverlayManager />
      <ToastManager />
    </>
  )
}

function App() {
  return (
    <HashRouter>
      <TooltipProvider>
        <Routes>
          <Route path="/" element={<GamePage />} />
          <Route path="/dev" element={<DevPage />} />
        </Routes>
      </TooltipProvider>
    </HashRouter>
  )
}

export default App
