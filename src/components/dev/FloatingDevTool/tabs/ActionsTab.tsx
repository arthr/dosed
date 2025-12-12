import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/8bit/card'
import { Button } from '@/components/ui/8bit/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/8bit/select'
import { ScrollArea } from '@/components/ui/8bit/scroll-area'
import { AlertTriangle } from 'lucide-react'
import type { GamePhase, PlayerId } from '@/types'
import { useDevToolActions } from '@/hooks'

/**
 * Aba de ações rápidas para debug
 * Permite executar ações de teste e debug no jogo
 */
export function ActionsTab() {
  const [selectedPhase, setSelectedPhase] = useState<GamePhase>('playing')

  const {
    currentPhase,
    players,
    playerIds,
    extraBotIds,
    resetGame,
    setPhase,
    addLivesToPlayer,
    forceEndRound,
    clearToasts,
    showToast,
    addBot,
    removeBot,
    MAX_PLAYERS_FOR_LAYOUT_TEST,
  } = useDevToolActions()

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerId>('player1')

  useEffect(() => {
    if (playerIds.length === 0) return
    if (!players[selectedPlayer]) {
      setSelectedPlayer(playerIds[0])
    }
  }, [playerIds, players, selectedPlayer])

  const handleResetGame = () => {
    if (window.confirm('Tem certeza que deseja resetar o jogo? Esta ação não pode ser desfeita.')) {
      resetGame()
      showToast({
        type: 'info',
        message: 'Jogo resetado com sucesso',
      })
    }
  }

  const handleSkipToPhase = () => {
    if (currentPhase === selectedPhase) {
      showToast({
        type: 'info',
        message: 'Já está nesta fase',
      })
      return
    }

    setPhase(selectedPhase)
    showToast({
      type: 'info',
      message: `Fase alterada para: ${selectedPhase}`,
    })
  }

  const handleAddLives = () => {
    addLivesToPlayer(selectedPlayer, 1)
    showToast({
      type: 'info',
      message: `+1 vida para ${selectedPlayer}`,
    })
  }

  const handleForceRoundEnd = () => {
    if (currentPhase !== 'playing') {
      showToast({
        type: 'info',
        message: 'Só funciona durante gameplay (fase playing)',
      })
      return
    }

    forceEndRound()
    showToast({
      type: 'info',
      message: 'Rodada encerrada forçadamente',
    })
  }

  const handleClearToasts = () => {
    clearToasts()
    // Não mostra toast aqui pois acabamos de limpar todos
  }

  const handleAddBot = () => addBot()
  const handleRemoveBot = () => removeBot()

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

      {/* Bots (AI) - teste de layout N-jogadores */}
      <Card className="border gap-0">
        <CardHeader className="pb-4 px-3">
          <CardTitle className="text-[10px] font-normal">Bots (AI) - Teste de Layout</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-2 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              Jogadores: {playerIds.length}/{MAX_PLAYERS_FOR_LAYOUT_TEST}
              {extraBotIds.length > 0 ? ` (bots extras: ${extraBotIds.length})` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAddBot}
              size="sm"
              borderSize="sm"
              variant="outline"
              className="flex-1 text-xs"
              disabled={playerIds.length >= MAX_PLAYERS_FOR_LAYOUT_TEST}
              title="Adiciona um bot extra (player3/player4) para testar layout"
            >
              + Bot
            </Button>
            <Button
              onClick={handleRemoveBot}
              size="sm"
              borderSize="sm"
              variant="outline"
              className="flex-1 text-xs"
              disabled={extraBotIds.length === 0}
              title="Remove o ultimo bot extra (player4 -> player3)"
            >
              - Bot
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            Dica: adicione 1 bot (3 players) ou 2 bots (4 players) para validar o grid do GameBoard.
          </p>
        </CardContent>
      </Card>

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
          <Select value={selectedPlayer} onValueChange={(v) => setSelectedPlayer(v as PlayerId)}>
            <SelectTrigger className="w-full text-[10px]">
              <SelectValue placeholder="Selecione um jogador" />
            </SelectTrigger>
            <SelectContent>
              {playerIds.map((id) => (
                <SelectItem key={id} value={id}>
                  {players[id]?.name ?? id}
                </SelectItem>
              ))}
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

