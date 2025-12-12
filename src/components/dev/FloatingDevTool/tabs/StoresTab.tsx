import { usePillPoolStore } from '@/stores/game/pillPoolStore'
import { useEffectsStore } from '@/stores/game/effectsStore'
import { useOverlayStore } from '@/stores/overlayStore'
import { useToastStore } from '@/stores/toastStore'
import { useGameFlowStore } from '@/stores/game/gameFlowStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/8bit/card'
import { Badge } from '@/components/ui/8bit/badge'
import { Separator } from '@/components/ui/8bit/separator'
import { ScrollArea } from '@/components/ui/8bit/scroll-area'

/**
 * Aba de visualização de outros stores
 * Exibe informações em tempo real de stores auxiliares
 */
export function StoresTab() {
  // Pill Pool Store
  const revealedPills = usePillPoolStore((s) => s.revealedPills)

  // Effects Store
  const effectsPlayer1 = useEffectsStore((s) => s.activeEffects.player1 || [])
  const effectsPlayer2 = useEffectsStore((s) => s.activeEffects.player2 || [])

  // Overlay Store
  const currentOverlay = useOverlayStore((s) => s.current)
  const pillRevealData = useOverlayStore((s) => s.pillRevealData)
  const gameOverData = useOverlayStore((s) => s.gameOverData)

  // Toast Store
  const toasts = useToastStore((s) => s.toasts)

  // Game Flow Store
  const playerOrder = useGameFlowStore((s) => s.playerOrder)
  const currentTurn = useGameFlowStore((s) => s.currentTurn)

  return (
    <ScrollArea className="h-[450px]">
      <div className="p-3 space-y-3">
      {/* Pill Pool Store */}
      <Card className="border">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-[10px] font-normal">Pill Pool Store</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 px-3 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pills Reveladas:</span>
            <Badge variant="outline" className="text-xs font-mono">
              {revealedPills.length}
            </Badge>
          </div>
          {revealedPills.length > 0 && (
            <div className="text-xs bg-muted/20 p-2 rounded max-h-20 overflow-y-auto">
              <div className="font-mono text-[10px] space-y-1">
                {revealedPills.slice(0, 5).map((pillId) => (
                  <div key={pillId} className="truncate">
                    {pillId}
                  </div>
                ))}
                {revealedPills.length > 5 && (
                  <div className="text-muted-foreground italic">
                    +{revealedPills.length - 5} mais...
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Effects Store */}
      <Card className="border">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-[10px] font-normal">Effects Store</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 px-3 pb-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-primary">Player1:</span>
              <Badge variant="outline" className="text-xs">
                {effectsPlayer1.length} efeitos
              </Badge>
            </div>
            {effectsPlayer1.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum efeito ativo</p>
            ) : (
              <div className="space-y-1">
                {effectsPlayer1.map((effect, idx) => (
                  <div key={idx} className="text-xs bg-primary/10 p-1 rounded flex items-center justify-between">
                    <span className="font-mono">{effect.type}</span>
                    <span className="text-muted-foreground">{effect.roundsRemaining}r</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-destructive">Player2:</span>
              <Badge variant="outline" className="text-xs">
                {effectsPlayer2.length} efeitos
              </Badge>
            </div>
            {effectsPlayer2.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum efeito ativo</p>
            ) : (
              <div className="space-y-1">
                {effectsPlayer2.map((effect, idx) => (
                  <div key={idx} className="text-xs bg-destructive/10 p-1 rounded flex items-center justify-between">
                    <span className="font-mono">{effect.type}</span>
                    <span className="text-muted-foreground">{effect.roundsRemaining}r</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overlay Store */}
      <Card className="border">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-[10px] font-normal">Overlay Store</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 px-3 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Overlay Atual:</span>
            <Badge variant={currentOverlay ? 'default' : 'secondary'} className="text-xs font-mono">
              {currentOverlay || 'null'}
            </Badge>
          </div>
          {pillRevealData && (
            <div className="text-xs bg-muted/20 p-2 rounded">
              <span className="font-normal">Pill Reveal:</span> {pillRevealData.pill.id}
            </div>
          )}
          {gameOverData && (
            <div className="text-xs bg-muted/20 p-2 rounded">
              <span className="font-normal">Game Over:</span> Winner = {gameOverData.winner || 'null'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toast Store */}
      <Card className="border">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-[10px] font-normal">Toast Store</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Toasts Ativos:</span>
            <Badge variant="outline" className="text-xs font-mono">
              {toasts.length}
            </Badge>
          </div>
          {toasts.length > 0 && (
            <div className="mt-2 space-y-1">
              {toasts.map((toast) => (
                <div key={toast.id} className="text-xs bg-muted/20 p-2 rounded">
                  <Badge variant="outline" className="text-[9px] mr-1">
                    {toast.type}
                  </Badge>
                  <span className="text-muted-foreground">{toast.message}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Flow Store */}
      <Card className="border">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-[10px] font-normal">Game Flow Store</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 px-3 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Ordem de Turnos:</span>
            <span className="text-xs font-mono">{playerOrder.join(', ')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Turno Atual:</span>
            <Badge variant="outline" className="text-xs font-mono">
              {currentTurn}
            </Badge>
          </div>
        </CardContent>
      </Card>
      </div>
    </ScrollArea>
  )
}

