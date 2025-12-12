import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useToastStore } from '@/stores/toastStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/8bit/card'
import { Button } from '@/components/ui/8bit/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/8bit/select'
import { ScrollArea } from '@/components/ui/8bit/scroll-area'
import { AlertTriangle } from 'lucide-react'
import type { GamePhase } from '@/types'

/**
 * Aba de ações rápidas para debug
 * Permite executar ações de teste e debug no jogo
 */
export function ActionsTab() {
  const [selectedPhase, setSelectedPhase] = useState<GamePhase>('playing')
  const [selectedPlayer, setSelectedPlayer] = useState<'player1' | 'player2'>('player1')

  // Game Store actions and state
  const resetGame = useGameStore((s) => s.resetGame)
  const currentPhase = useGameStore((s) => s.phase)

  // Toast Store actions
  const clearToasts = useToastStore((s) => s.clear)
  const showToast = useToastStore((s) => s.show)

  const handleResetGame = () => {
    if (window.confirm('⚠️ Tem certeza que deseja resetar o jogo? Esta ação não pode ser desfeita.')) {
      resetGame()
      showToast({
        type: 'info',
        message: 'Jogo resetado com sucesso',
      })
    }
  }

  const handleSkipToPhase = () => {
    showToast({
      type: 'info',
      message: `Função Skip to Phase em desenvolvimento`,
    })
  }

  const handleAddLives = () => {
    showToast({
      type: 'info',
      message: `Função Add Lives em desenvolvimento`,
    })
  }

  const handleForceRoundEnd = () => {
    showToast({
      type: 'info',
      message: `Função Force Round End em desenvolvimento`,
    })
  }

  const handleClearToasts = () => {
    clearToasts()
    // Não mostra toast aqui pois acabamos de limpar todos :)
  }

  return (
    <ScrollArea className="h-[450px]">
      <div className="p-3 space-y-3">
      {/* Aviso */}
      <div className="bg-yellow-500/10 border border-yellow-500 p-2 rounded flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-yellow-700 dark:text-yellow-300">
          <span className="font-normal">Cuidado:</span> Estas ações são para debug e podem quebrar o estado do jogo.
        </p>
      </div>

      {/* Reset Game */}
      <Card className="border gap-0">
        <CardHeader className="pb-4 px-3">
          <CardTitle className="text-[10px] font-normal">Reset Completo</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-2">
          <Button
            onClick={handleResetGame}
            size="sm"
            borderSize="sm"
            variant="destructive"
            className="w-full text-xs"
          >
            Reset Game
          </Button>
          <p className="text-xs text-muted-foreground mt-2 italic">
            Reinicia o jogo completamente (volta para setup)
          </p>
        </CardContent>
      </Card>

      {/* Skip to Phase */}
      <Card className="borde gap-0">
        <CardHeader className="pb-4 px-3">
          <CardTitle className="text-[10px] font-normal">Pular para Fase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 px-3 pb-2">
          <Select value={selectedPhase} onValueChange={(v) => setSelectedPhase(v as GamePhase)}>
            <SelectTrigger className="w-full text-[10px]">
              <SelectValue placeholder="Selecione uma fase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="setup">Setup</SelectItem>
              <SelectItem value="itemSelection">Item Selection</SelectItem>
              <SelectItem value="playing">Playing</SelectItem>
              <SelectItem value="shopping">Shopping</SelectItem>
              <SelectItem value="roundEnding">Round Ending</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleSkipToPhase}
            size="sm"
            borderSize="sm"
            variant="outline"
            className="w-full text-xs"
          >
            Ir para {selectedPhase}
          </Button>
        </CardContent>
      </Card>

      {/* Add Lives */}
      <Card className="border gap-0">
        <CardHeader className="pb-4 px-3">
          <CardTitle className="text-[10px] font-normal">Adicionar Vidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 px-3 pb-2">
          <Select value={selectedPlayer} onValueChange={(v) => setSelectedPlayer(v as 'player1' | 'player2')}>
            <SelectTrigger className="w-full text-[10px]">
              <SelectValue placeholder="Selecione um jogador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="player1">Player 1</SelectItem>
              <SelectItem value="player2">Player 2</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleAddLives}
            size="sm"
            borderSize="sm"
            variant="outline"
            className="w-full text-xs"
          >
            +1 Vida para {selectedPlayer}
          </Button>
        </CardContent>
      </Card>

      {/* Force Round End */}
      <Card className="border gap-0">
        <CardHeader className="pb-4 px-3">
          <CardTitle className="text-[10px] font-normal">Controle de Rodada</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-2">
          <Button
            onClick={handleForceRoundEnd}
            size="sm"
            borderSize="sm"
            variant="outline"
            className="w-full text-xs"
            disabled={currentPhase !== 'playing'}
          >
            Forçar Fim de Rodada
          </Button>
          <p className="text-[10px] text-muted-foreground mt-4 italic">
            {currentPhase === 'playing' 
              ? 'Encerra a rodada atual imediatamente' 
              : 'Disponível apenas durante gameplay'}
          </p>
        </CardContent>
      </Card>

      {/* Clear Toasts */}
      <Card className="border gap-0">
        <CardHeader className="pb-4 px-3">
          <CardTitle className="text-[10px] font-normal">Limpar UI</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-2">
          <Button
            onClick={handleClearToasts}
            size="sm"
            borderSize="sm"
            variant="outline"
            className="w-full text-xs"
          >
            Limpar Todos os Toasts
          </Button>
        </CardContent>
      </Card>
      </div>
    </ScrollArea>
  )
}

