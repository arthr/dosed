import { useState } from 'react'
import { useDevToolStore } from '@/stores/devToolStore'
import type { DevToolLogType } from '@/stores/devToolStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/8bit/card'
import { Button } from '@/components/ui/8bit/button'
import { Badge } from '@/components/ui/8bit/badge'
import { Separator } from '@/components/ui/8bit/separator'
import { ScrollArea } from '@/components/ui/8bit/scroll-area'
import { Download, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Aba de logs de eventos
 * Console de eventos do jogo com filtros e export
 */
export function LogsTab() {
  const logs = useDevToolStore((s) => s.logs)
  const clearLogs = useDevToolStore((s) => s.clearLogs)
  const addLog = useDevToolStore((s) => s.addLog)

  const [filter, setFilter] = useState<DevToolLogType | 'all'>('all')

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter((log) => log.type === filter)

  const handleExport = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalLogs: logs.length,
      logs: logs.map((log) => ({
        type: log.type,
        message: log.message,
        timestamp: new Date(log.timestamp).toISOString(),
        data: log.data,
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `devtool-logs-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    addLog('info', 'Logs exportados com sucesso')
  }

  const handleClear = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os logs?')) {
      clearLogs()
    }
  }

  const getLogColor = (type: DevToolLogType) => {
    switch (type) {
      case 'game':
        return 'bg-blue-500 text-white'
      case 'multiplayer':
        return 'bg-purple-500 text-white'
      case 'store':
        return 'bg-green-500 text-white'
      case 'error':
        return 'bg-red-500 text-white'
      case 'info':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3,
    })
  }

  return (
    <ScrollArea className="h-[450px]">
      <div className="p-3 space-y-3">
      {/* Header com Filtros e Ações */}
      <Card className="border gap-0">
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-[10px] font-normal flex items-center justify-between">
            <span>Console de Eventos</span>
            <Badge variant="outline" className="text-xs">
              {filteredLogs.length} / {logs.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-3 pb-2">
          {/* Filtros */}
          <div className="flex flex-wrap gap-1 py-2">
            <Button
              size="sm"
              borderSize="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className="text-[8px] h-7 px-2"
            >
              All
            </Button>
            <Button
              size="sm"
              borderSize="sm"
              variant={filter === 'game' ? 'default' : 'outline'}
              onClick={() => setFilter('game')}
              className="text-[8px] h-7 px-2"
            >
              Game
            </Button>
            <Button
              size="sm"
              borderSize="sm"
              variant={filter === 'multiplayer' ? 'default' : 'outline'}
              onClick={() => setFilter('multiplayer')}
              className="text-[8px] h-7 px-2"
            >
              Multi
            </Button>
            <Button
              size="sm"
              borderSize="sm"
              variant={filter === 'store' ? 'default' : 'outline'}
              onClick={() => setFilter('store')}
              className="text-[8px] h-7 px-2"
            >
              Store
            </Button>
            <Button
              size="sm"
              borderSize="sm"
              variant={filter === 'error' ? 'default' : 'outline'}
              onClick={() => setFilter('error')}
              className="text-[8px] h-7 px-2"
            >
              Error
            </Button>
            <Button
              size="sm"
              borderSize="sm"
              variant={filter === 'info' ? 'default' : 'outline'}
              onClick={() => setFilter('info')}
              className="text-[8px] h-7 px-2"
            >
              Info
            </Button>
          </div>

          <Separator />

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              borderSize="sm"
              variant="outline"
              onClick={handleExport}
              disabled={logs.length === 0}
              className="flex-1 text-[8px] gap-1"
            >
              <Download className="h-3 w-3" />
              Export JSON
            </Button>
            <Button
              size="sm"
              borderSize="sm"
              variant="destructive"
              onClick={handleClear}
              disabled={logs.length === 0}
              className="flex-1 text-[8px] gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      {filteredLogs.length === 0 ? (
        <Card className="border">
          <CardContent className="p-3">
            <p className="text-[8px] text-muted-foreground italic text-center">
              {logs.length === 0 
                ? 'Nenhum log registrado ainda'
                : `Nenhum log do tipo "${filter}"`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {filteredLogs.slice().reverse().map((log) => (
            <Card key={log.id} className="border">
              <CardContent className="p-2 space-y-1">
                <div className="flex items-start gap-2">
                  <Badge className={cn('text-xs font-mono shrink-0', getLogColor(log.type))}>
                    {log.type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-mono wrap-break-word">{log.message}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-1">
                      {formatTime(log.timestamp)}
                    </p>
                  </div>
                </div>
                {log.data !== undefined && log.data !== null && (
                  <details className="text-[8px]">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Ver dados
                    </summary>
                    <pre className="mt-1 p-2 bg-muted/20 rounded text-[8px] overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Exemplo de uso */}
      {logs.length === 0 && (
        <Card className="border">
          <CardHeader className="pb-1 pt-2 px-3">
            <CardTitle className="text-[10px] font-normal">Como usar</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-2">
            <p className="text-[8px] text-muted-foreground">
              Logs serão exibidos aqui automaticamente quando eventos do jogo ocorrerem.
              Use os filtros acima para ver apenas logs específicos.
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </ScrollArea>
  )
}

