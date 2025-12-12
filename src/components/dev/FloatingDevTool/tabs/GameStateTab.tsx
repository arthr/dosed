import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/8bit/card'
import { Badge } from '@/components/ui/8bit/badge'
import { Separator } from '@/components/ui/8bit/separator'
import { ScrollArea } from '@/components/ui/8bit/scroll-area'
import { cn } from '@/lib/utils'
import { useDevToolGameSnapshot } from '@/hooks'

/**
 * Aba de estado do Game Store
 * Exibe informações em tempo real do gameStore
 */
export function GameStateTab() {
  const {
    phase,
    round,
    currentTurn,
    players,
    playerIds,
    pillPool,
    typeCounts,
    shapeQuests,
    actionHistory,
    mode,
  } = useDevToolGameSnapshot()

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
    <ScrollArea className="h-[450px]">
      <div className="p-3 space-y-3">
      {/* Phase & Mode */}
      <Card className="border">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-[10px] font-normal">Status Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 px-3 pb-2">
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
            <span className="text-xs font-mono font-normal">{round}</span>
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
      <Card className="border">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-[10px] font-normal">Jogadores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-3 pb-2">
          {playerIds.map((playerId, idx) => {
            const p = players[playerId]
            if (!p) return null
            const isCurrent = currentTurn === playerId
            const nameClass = idx === 0 ? 'text-primary' : 'text-foreground'

            return (
              <div key={playerId}>
                {idx !== 0 && <Separator />}
                <div className="flex items-center justify-between mb-1 pt-1">
                  <span className={cn('text-xs font-mono font-normal', nameClass)}>{p.name}</span>
                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <Badge variant="outline" className="text-[9px] font-mono">
                        turno
                      </Badge>
                    )}
                    <Badge variant={p.isAI ? 'secondary' : 'default'} className="text-xs">
                      {p.isAI ? 'AI' : 'Human'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Vidas:</span>
                  <span className="font-mono">{p.lives}</span>
                  <Separator orientation="vertical" className="h-3" />
                  <span className="text-muted-foreground">Moedas:</span>
                  <span className="font-mono">{p.pillCoins}</span>
                  <Separator orientation="vertical" className="h-3" />
                  <span className="text-muted-foreground">Itens:</span>
                  <span className="font-mono">{p.inventory.items.length}</span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Pill Pool */}
      <Card className="border">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-[10px] font-normal">Pool de Pílulas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 px-3 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total:</span>
            <span className="text-xs font-mono font-normal">{pillPool.length}</span>
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
      {playerIds.some((id) => Boolean(shapeQuests[id])) && (
        <Card className="border">
          <CardHeader className="pb-1 pt-2 px-3">
            <CardTitle className="text-[10px] font-normal">Shape Quests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs px-3 pb-2">
            {playerIds.map((id) => {
              const quest = shapeQuests[id]
              if (!quest) return null
              return (
                <div key={id}>
                  <span className="font-mono font-normal">{id}:</span>
                  <span className="ml-2">
                    {quest.sequence.join(' -> ')} ({quest.progress}/{quest.sequence.length})
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Action History */}
      <Card className="border">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-[10px] font-normal">Últimas Ações (5)</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-2">
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
    </ScrollArea>
  )
}

