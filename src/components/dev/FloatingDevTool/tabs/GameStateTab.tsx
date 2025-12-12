import { useGameStore } from '@/stores/gameStore'
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/8bit/card'
import { Badge } from '@/components/ui/8bit/badge'
import { Separator } from '@/components/ui/8bit/separator'
import { cn } from '@/lib/utils'

/**
 * Aba de estado do Game Store
 * Exibe informações em tempo real do gameStore
 */
export function GameStateTab() {
  const phase = useGameStore((s) => s.phase)
  const round = useGameStore((s) => s.round)
  const currentTurn = useGameStore((s) => s.currentTurn)
  const players = useGameStore((s) => s.players)
  const pillPool = useGameStore((s) => s.pillPool)
  const typeCounts = useGameStore((s) => s.typeCounts)
  const shapeQuests = useGameStore((s) => s.shapeQuests)
  const actionHistory = useGameStore((s) => s.actionHistory)
  const mode = useGameStore((s) => s.mode)

  const lastActions = useMemo(() => {
    return actionHistory.slice(-5).reverse()
  }, [actionHistory])

  const phaseColor = useMemo(() => {
    switch (phase) {
      case 'setup':
        return 'bg-muted text-muted-foreground'
      case 'itemSelection':
        return 'bg-blue-500 text-white'
      case 'playing':
        return 'bg-green-500 text-white'
      case 'shopping':
        return 'bg-yellow-500 text-black'
      case 'roundEnding':
        return 'bg-orange-500 text-white'
      case 'ended':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }, [phase])

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-[400px]">
      {/* Phase & Mode */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">Status Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Fase:</span>
            <Badge className={cn('text-xs font-mono', phaseColor)}>{phase}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Modo:</span>
            <Badge variant="outline" className="text-xs font-mono">
              {mode === 'single_player' ? 'Single' : 'Multi'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Rodada:</span>
            <span className="text-xs font-mono font-bold">{round}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Turno:</span>
            <Badge variant={currentTurn === 'player1' ? 'default' : 'secondary'} className="text-xs font-mono">
              {currentTurn}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Players */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">Jogadores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Player 1 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono font-bold text-primary">{players.player1.name}</span>
              <Badge variant={players.player1.isAI ? 'secondary' : 'default'} className="text-xs">
                {players.player1.isAI ? 'AI' : 'Human'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Vidas:</span>
              <span className="font-mono">{players.player1.lives}❤️</span>
              <Separator orientation="vertical" className="h-3" />
              <span className="text-muted-foreground">Moedas:</span>
              <span className="font-mono">{players.player1.pillCoins}💰</span>
              <Separator orientation="vertical" className="h-3" />
              <span className="text-muted-foreground">Itens:</span>
              <span className="font-mono">{players.player1.inventory.items.length}</span>
            </div>
          </div>

          <Separator />

          {/* Player 2 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono font-bold text-destructive">{players.player2.name}</span>
              <Badge variant={players.player2.isAI ? 'secondary' : 'default'} className="text-xs">
                {players.player2.isAI ? 'AI' : 'Human'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Vidas:</span>
              <span className="font-mono">{players.player2.lives}❤️</span>
              <Separator orientation="vertical" className="h-3" />
              <span className="text-muted-foreground">Moedas:</span>
              <span className="font-mono">{players.player2.pillCoins}💰</span>
              <Separator orientation="vertical" className="h-3" />
              <span className="text-muted-foreground">Itens:</span>
              <span className="font-mono">{players.player2.inventory.items.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pill Pool */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">Pool de Pílulas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total:</span>
            <span className="text-xs font-mono font-bold">{pillPool.length}</span>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Curas:</span>
              <span className="ml-2 font-mono">{typeCounts.HEAL || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Danos:</span>
              <span className="ml-2 font-mono">{(typeCounts.DMG_LOW || 0) + (typeCounts.DMG_HIGH || 0)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Fatais:</span>
              <span className="ml-2 font-mono">{typeCounts.FATAL || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Safes:</span>
              <span className="ml-2 font-mono">{typeCounts.SAFE || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shape Quests */}
      {(shapeQuests.player1 || shapeQuests.player2) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Shape Quests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {shapeQuests.player1 && (
              <div>
                <span className="font-mono text-primary">P1:</span>
                <span className="ml-2">
                  {shapeQuests.player1.sequence.join(' → ')} ({shapeQuests.player1.progress}/{shapeQuests.player1.sequence.length})
                </span>
              </div>
            )}
            {shapeQuests.player2 && (
              <div>
                <span className="font-mono text-destructive">P2:</span>
                <span className="ml-2">
                  {shapeQuests.player2.sequence.join(' → ')} ({shapeQuests.player2.progress}/{shapeQuests.player2.sequence.length})
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">Últimas Ações (5)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {lastActions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhuma ação ainda</p>
            ) : (
              lastActions.map((action, idx) => (
                <div key={idx} className="text-xs font-mono flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {action.type}
                  </Badge>
                  <span className="text-muted-foreground">{action.playerId}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

