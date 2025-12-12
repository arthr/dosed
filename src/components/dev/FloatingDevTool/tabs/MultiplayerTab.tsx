import { useMultiplayerStore } from '@/stores/multiplayerStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/8bit/card'
import { Badge } from '@/components/ui/8bit/badge'
import { Separator } from '@/components/ui/8bit/separator'
import { Button } from '@/components/ui/8bit/button'
import { ScrollArea } from '@/components/ui/8bit/scroll-area'
import { cn } from '@/lib/utils'
import type { ConnectionStatus } from '@/types'

/**
 * Aba de estado do Multiplayer Store
 * Exibe informações em tempo real do multiplayerStore
 */
export function MultiplayerTab() {
  const mode = useMultiplayerStore((s) => s.mode)
  const room = useMultiplayerStore((s) => s.room)
  const localRole = useMultiplayerStore((s) => s.localRole)
  const localPlayerId = useMultiplayerStore((s) => s.localPlayerId)
  const connectionStatus = useMultiplayerStore((s) => s.connectionStatus)
  const error = useMultiplayerStore((s) => s.error)
  const rematchState = useMultiplayerStore((s) => s.rematchState)
  const opponentDisconnected = useMultiplayerStore((s) => s.opponentDisconnected)

  // Actions para botões de debug
  const disconnect = useMultiplayerStore((s) => s.disconnect)
  const requestRematch = useMultiplayerStore((s) => s.requestRematch)

  const getConnectionColor = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500 text-white'
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-500 text-black'
      case 'disconnected':
        return 'bg-gray-500 text-white'
      case 'error':
        return 'bg-red-500 text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getRematchColor = () => {
    switch (rematchState.status) {
      case 'waiting':
        return 'bg-yellow-500 text-black'
      case 'accepted':
        return 'bg-green-500 text-white'
      case 'declined':
        return 'bg-red-500 text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <ScrollArea className="h-[450px]">
      <div className="p-3 space-y-3">
      {/* Modo & Conexão */}
      <Card className="border">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-[10px] font-normal">Status da Conexão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 px-3 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Modo:</span>
            <Badge variant={mode === 'multiplayer' ? 'default' : 'secondary'} className="text-xs font-mono">
              {mode}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Conexão:</span>
            <Badge className={cn('text-xs font-mono', getConnectionColor(connectionStatus))}>
              {connectionStatus}
            </Badge>
          </div>
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive">
              <span className="font-mono font-normal">Erro:</span> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações da Sala */}
      {room && (
        <Card className="border">
          <CardHeader className="pb-1 pt-2 px-3">
            <CardTitle className="text-[10px] font-normal">Sala Multiplayer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs px-3 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Room ID:</span>
              <span className="font-mono font-normal text-primary">{room.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline" className="text-xs font-mono">
                {room.status}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Host:</span>
              <span className="font-mono">{room.hostName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Guest:</span>
              <span className="font-mono">{room.guestName || '(aguardando)'}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Papel Local:</span>
              <Badge variant={localRole === 'host' ? 'default' : 'secondary'} className="text-xs">
                {localRole || 'N/A'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Player Local:</span>
              <span className="font-mono text-xs">{localPlayerId || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado de Rematch */}
      {mode === 'multiplayer' && rematchState.status !== 'idle' && (
        <Card className="border">
          <CardHeader className="pb-1 pt-2 px-3">
            <CardTitle className="text-[10px] font-normal">Rematch State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 px-3 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status:</span>
              <Badge className={cn('text-xs font-mono', getRematchColor())}>
                {rematchState.status}
              </Badge>
            </div>
            {rematchState.requestedBy && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Solicitado por:</span>
                <span className="text-xs font-mono">{rematchState.requestedBy}</span>
              </div>
            )}
            {rematchState.timeoutAt && (
              <div className="text-xs text-muted-foreground">
                Expira em: {Math.max(0, Math.round((rematchState.timeoutAt - Date.now()) / 1000))}s
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estado do Oponente */}
      {mode === 'multiplayer' && (
        <Card className="border">
          <CardHeader className="pb-1 pt-2 px-3">
            <CardTitle className="text-[10px] font-normal">Oponente</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Desconectado:</span>
              <Badge variant={opponentDisconnected ? 'destructive' : 'default'} className="text-xs">
                {opponentDisconnected ? 'Sim' : 'Não'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de Debug (apenas em multiplayer) */}
      {mode === 'multiplayer' && connectionStatus === 'connected' && (
        <Card className="border">
          <CardHeader className="pb-1 pt-2 px-3">
            <CardTitle className="text-[10px] font-normal">Debug Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 px-3 pb-2">
            <Button
              onClick={disconnect}
              size="sm"
              variant="destructive"
              className="w-full text-xs"
            >
              Simular Desconexão
            </Button>
            {room?.status === 'finished' && (
              <Button
                onClick={requestRematch}
                size="sm"
                variant="outline"
                className="w-full text-xs"
              >
                Forçar Rematch
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Single Player */}
      {mode === 'single_player' && (
        <Card className="border">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground italic text-center">
              Modo Single Player ativo.
              <br />
              Esta aba é útil apenas em multiplayer.
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </ScrollArea>
  )
}

