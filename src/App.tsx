import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/8bit/tooltip'
import { Button } from '@/components/ui/8bit/button'
import { GameLayout } from '@/components/layout/GameLayout'
import { useGameActions, useGamePhase, useGameStats, useWinner, usePlayers, useMultiplayer } from '@/hooks'
import { InfoPanel } from '@/components/game/InfoPanel'
import { GameBoard } from '@/components/game/GameBoard'
import { ItemSelectionScreen } from '@/components/game/ItemSelectionScreen'
import { DifficultySelect } from '@/components/game/DifficultySelect'
import { LobbyScreen, WaitingRoom } from '@/components/multiplayer'
import { OverlayManager } from '@/components/overlays'
import { ToastManager } from '@/components/toasts'
import { useOverlayStore } from '@/stores/overlayStore'
import { DevPage } from '@/components/dev'
import type { DifficultyLevel, GameMode } from '@/types'

function GameContent() {
  // State
  const phase = useGamePhase()
  const winner = useWinner()
  const stats = useGameStats()
  const { player1, player2 } = usePlayers()

  // Multiplayer state
  const { isMultiplayer, room, reset: resetMultiplayer } = useMultiplayer()

  // Estado local para modo e dificuldade selecionados
  const [selectedMode, setSelectedMode] = useState<GameMode>('single_player')
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('normal')

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

  // Se multiplayer e sala esta em waiting (host aguardando guest)
  if (isMultiplayer && room?.status === 'waiting') {
    return <WaitingRoom onCancel={() => resetMultiplayer()} />
  }

  // Tela inicial - Setup
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-normal text-foreground">
            Bem-vindo ao Dosed!
          </h2>
          <p className="text-muted-foreground">
            Escolha uma pilula. Sobreviva. Seja o ultimo!
          </p>
        </div>

        {/* Selector de modo de jogo */}
        <div className="flex gap-2">
          <Button
            variant={selectedMode === 'single_player' ? 'default' : 'outline'}
            onClick={() => setSelectedMode('single_player')}
            className="min-w-[140px]"
          >
            Single Player
          </Button>
          <Button
            variant={selectedMode === 'multiplayer' ? 'default' : 'outline'}
            onClick={() => setSelectedMode('multiplayer')}
            className="min-w-[140px]"
          >
            Multiplayer
          </Button>
        </div>

        {/* Conteudo baseado no modo selecionado */}
        {selectedMode === 'single_player' ? (
          <>
            {/* Seletor de dificuldade */}
            <DifficultySelect
              value={selectedDifficulty}
              onChange={setSelectedDifficulty}
            />

            <Button
              size="lg"
              onClick={() => startGame({ difficulty: selectedDifficulty })}
              className="px-8"
            >
              Iniciar Partida
            </Button>

            {/* Info/Tutorial Panel */}
            <InfoPanel />
          </>
        ) : (
          <LobbyScreen onBack={() => setSelectedMode('single_player')} />
        )}
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
