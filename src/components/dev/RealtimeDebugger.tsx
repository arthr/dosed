import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/8bit/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/8bit/input'
import { Badge } from '@/components/ui/badge'
import { realtimeService } from '@/services/realtimeService'
import type { ConnectionStatus } from '@/types'

interface LogEntry {
  id: number
  timestamp: Date
  type: 'sent' | 'received' | 'system'
  event: string
  payload?: Record<string, unknown>
}

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  disconnected: 'bg-muted text-muted-foreground',
  connecting: 'bg-yellow-500/20 text-yellow-500',
  connected: 'bg-green-500/20 text-green-500',
  reconnecting: 'bg-yellow-500/20 text-yellow-500',
  error: 'bg-red-500/20 text-red-500',
  not_configured: 'bg-orange-500/20 text-orange-500',
}

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  disconnected: 'Desconectado',
  connecting: 'Conectando...',
  connected: 'Conectado',
  reconnecting: 'Reconectando...',
  error: 'Erro',
  not_configured: 'Nao Configurado',
}

/**
 * Componente de debug para testar o serviço de Realtime
 */
export function RealtimeDebugger() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [testEventType, setTestEventType] = useState('test')
  const [testPayload, setTestPayload] = useState('{"message": "Hello!"}')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const logIdRef = useRef(0)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Scroll automatico para novos logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Registrar handlers do realtime
  useEffect(() => {
    const unsubStatus = realtimeService.onStatusChange((newStatus) => {
      setStatus(newStatus)
      addLog('system', `status_change`, { status: newStatus })
    })

    const unsubEvent = realtimeService.onEvent((event, payload) => {
      addLog('received', event, payload)
    })

    // Sincronizar estado inicial
    setStatus(realtimeService.getStatus())
    setRoomId(realtimeService.getRoomId())

    return () => {
      unsubStatus()
      unsubEvent()
    }
  }, [])

  const addLog = (type: LogEntry['type'], event: string, payload?: Record<string, unknown>) => {
    setLogs((prev) => [
      ...prev,
      {
        id: logIdRef.current++,
        timestamp: new Date(),
        type,
        event,
        payload,
      },
    ])
  }

  const handleCreateRoom = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const newRoomId = await realtimeService.createRoom()
      setRoomId(newRoomId)
      addLog('system', 'room_created', { roomId: newRoomId })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(message)
      addLog('system', 'error', { message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      setError('Digite o codigo da sala')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      await realtimeService.joinRoom(joinCode.trim())
      setRoomId(joinCode.trim().toUpperCase())
      addLog('system', 'room_joined', { roomId: joinCode.trim().toUpperCase() })
      setJoinCode('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(message)
      addLog('system', 'error', { message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeave = async () => {
    setIsLoading(true)
    try {
      await realtimeService.leave()
      setRoomId(null)
      addLog('system', 'room_left', {})
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendEvent = async () => {
    if (!testEventType.trim()) {
      setError('Digite o tipo do evento')
      return
    }
    setError(null)
    try {
      const payload = JSON.parse(testPayload)
      await realtimeService.send(testEventType, payload)
      addLog('sent', testEventType, payload)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(message)
      addLog('system', 'error', { message })
    }
  }

  const handleClearLogs = () => {
    setLogs([])
  }

  const handleCopyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId)
      addLog('system', 'room_id_copied', { roomId })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Painel de Conexao */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conexao Realtime</CardTitle>
              <CardDescription>Gerenciar conexao com sala</CardDescription>
            </div>
            <Badge className={STATUS_COLORS[status]}>
              {STATUS_LABELS[status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Aviso de nao configurado */}
          {status === 'not_configured' && (
            <div className="p-4 bg-orange-500/10 border-2 border-orange-500/30 space-y-3">
              <p className="text-sm font-medium text-orange-500">
                Supabase nao configurado
              </p>
              <p className="text-xs text-muted-foreground">
                Crie o arquivo <code className="bg-muted px-1">.env.local</code> na raiz do projeto com:
              </p>
              <pre className="text-xs bg-black/50 p-2 overflow-x-auto">
{`VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key`}
              </pre>
              <p className="text-xs text-muted-foreground">
                Depois reinicie o servidor de desenvolvimento.
              </p>
            </div>
          )}

          {/* Status atual */}
          {roomId && (
            <div className="p-4 bg-muted/50 border-2 border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Sala atual</p>
                  <p className="text-2xl font-mono font-normal tracking-widest">
                    {roomId}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyRoomId}
                >
                  Copiar
                </Button>
              </div>
            </div>
          )}

          {/* Acoes */}
          {status === 'disconnected' && realtimeService.isConfigured() ? (
            <div className="space-y-4">
              {/* Criar sala */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Criar nova sala (voce sera o Host)
                </p>
                <Button
                  onClick={handleCreateRoom}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Criando...' : 'Criar Sala'}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              {/* Entrar em sala */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Entrar em sala existente (voce sera o Guest)
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Codigo da sala"
                    value={joinCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="font-mono text-center tracking-widest uppercase"
                  />
                  <Button
                    onClick={handleJoinRoom}
                    disabled={isLoading || !joinCode.trim()}
                    variant="outline"
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </div>
              </div>
            </div>
          ) : status === 'connected' || status === 'connecting' || status === 'error' ? (
            <Button
              onClick={handleLeave}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              {isLoading ? 'Saindo...' : 'Sair da Sala'}
            </Button>
          ) : null}

          {/* Erro */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Enviar evento de teste */}
          {status === 'connected' && (
            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-sm font-medium">Enviar Evento de Teste</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Tipo do evento"
                  value={testEventType}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestEventType(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Input
                placeholder='{"key": "value"}'
                value={testPayload}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestPayload(e.target.value)}
                className="font-mono text-sm"
              />
              <Button
                onClick={handleSendEvent}
                variant="outline"
                className="w-full"
              >
                Enviar Evento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Painel de Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Log</CardTitle>
              <CardDescription>
                {logs.length} evento{logs.length !== 1 ? 's' : ''} registrado{logs.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearLogs}
              disabled={logs.length === 0}
            >
              Limpar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] overflow-y-auto border-2 border-border bg-black/50 p-2 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum evento registrado
              </p>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 border-l-2 ${
                      log.type === 'sent'
                        ? 'border-blue-500 bg-blue-500/10'
                        : log.type === 'received'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-muted-foreground bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1 py-0 ${
                          log.type === 'sent'
                            ? 'text-blue-500 border-blue-500'
                            : log.type === 'received'
                            ? 'text-green-500 border-green-500'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {log.type === 'sent' ? 'SENT' : log.type === 'received' ? 'RECV' : 'SYS'}
                      </Badge>
                      <span className="text-foreground font-semibold">
                        {log.event}
                      </span>
                    </div>
                    {log.payload && Object.keys(log.payload).length > 0 && (
                      <pre className="text-[10px] text-muted-foreground overflow-x-auto">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

