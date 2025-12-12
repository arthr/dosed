import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, X, Loader2, Clock, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/8bit/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/8bit/card'
import { useMultiplayer } from '@/hooks'

/** Tempo em ms ate a sala expirar (5 minutos) */
const ROOM_EXPIRATION_MS = 5 * 60 * 1000

/** Tempo em ms para mostrar aviso de expiracao (1 minuto) */
const EXPIRATION_WARNING_MS = 60 * 1000

interface WaitingRoomProps {
  /** Callback quando sala e cancelada (opcional) */
  onCancel?: () => void
}

/**
 * Tela de espera do host aguardando guest entrar na sala
 * Exibe codigo da sala para compartilhar
 * Inclui timer de expiracao de 5 minutos
 */
export function WaitingRoom({ onCancel }: WaitingRoomProps) {
  const { room, leaveRoom, connectionStatus } = useMultiplayer()
  const [copied, setCopied] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(ROOM_EXPIRATION_MS)
  const [hasExpired, setHasExpired] = useState(false)

  const roomCode = room?.id ?? ''
  const roomCreatedAt = room?.createdAt ?? Date.now()

  const handleCopy = async () => {
    if (!roomCode) return

    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
    } catch {
      // Clipboard API nao disponivel - ignora silenciosamente
      console.warn('Clipboard API não disponível')
    }
  }

  // Reset estado de copiado apos 2 segundos
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  // Timer de expiracao da sala
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - roomCreatedAt
      const remaining = Math.max(0, ROOM_EXPIRATION_MS - elapsed)
      setTimeRemaining(remaining)

      if (remaining === 0 && !hasExpired) {
        setHasExpired(true)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [roomCreatedAt, hasExpired])

  // Handler de expiracao
  const handleExpiration = useCallback(async () => {
    setIsLeaving(true)
    try {
      await leaveRoom()
      onCancel?.()
    } catch {
      setIsLeaving(false)
    }
  }, [leaveRoom, onCancel])

  // Auto-sai quando expira
  useEffect(() => {
    if (hasExpired) {
      handleExpiration()
    }
  }, [hasExpired, handleExpiration])

  // Calcula tempo formatado
  const minutes = Math.floor(timeRemaining / 60000)
  const seconds = Math.floor((timeRemaining % 60000) / 1000)
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`
  const isWarning = timeRemaining <= EXPIRATION_WARNING_MS && timeRemaining > 0

  const handleCancel = async () => {
    setIsLeaving(true)
    try {
      await leaveRoom()
      onCancel?.()
    } catch {
      setIsLeaving(false)
    }
  }

  // Formata codigo em grupos de 3 para melhor legibilidade
  const formattedCode = roomCode
    ? `${roomCode.slice(0, 3)}-${roomCode.slice(3, 6)}`
    : '---'

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Aguardando Oponente</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-6 items-center">
          {/* Animacao de espera */}
          <div className="flex items-center gap-2">
            <motion.div
              className="flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-primary rounded-full"
                  animate={{
                    y: [0, -8, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Instrucao */}
          <p className="text-center text-muted-foreground text-sm">
            Compartilhe o codigo abaixo com seu amigo
          </p>

          {/* Codigo da sala */}
          <div className="w-full">
            <motion.div
              className="relative bg-muted/50 border-2 border-dashed border-primary/50 rounded-lg p-6"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Codigo da Sala
                </p>
                <p className="text-4xl font-mono font-normal tracking-[0.3em] text-primary">
                  {formattedCode}
                </p>
              </div>

              {/* Botao de copiar */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleCopy}
                disabled={!roomCode}
              >
                {copied ? (
                  <Check className="size-4 text-green-500" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </motion.div>

            {/* Feedback de copiado */}
            <motion.p
              className="text-center text-sm text-green-500 mt-2 h-5"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: copied ? 1 : 0, y: copied ? 0 : -5 }}
            >
              {copied && 'Codigo copiado!'}
            </motion.p>
          </div>

          {/* Timer de expiracao */}
          <div className="w-full">
            <div
              className={`flex items-center justify-center gap-2 p-2 rounded-lg border ${
                isWarning
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-muted/30 border-border'
              }`}
            >
              <Clock size={14} className={isWarning ? 'text-amber-500' : 'text-muted-foreground'} />
              <span
                className={`text-sm font-mono ${
                  isWarning ? 'text-amber-500' : 'text-muted-foreground'
                }`}
              >
                {formattedTime}
              </span>
            </div>
            {isWarning && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-1 mt-2 text-xs text-amber-500"
              >
                <AlertTriangle size={12} />
                <span>Sala expira em breve!</span>
              </motion.div>
            )}
          </div>

          {/* Status de conexao */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'connecting'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-red-500'
              }`}
            />
            <span>
              {connectionStatus === 'connected'
                ? 'Conectado'
                : connectionStatus === 'connecting'
                  ? 'Conectando...'
                  : 'Desconectado'}
            </span>
          </div>

          {/* Botao de cancelar */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCancel}
            disabled={isLeaving}
          >
            {isLeaving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saindo...
              </>
            ) : (
              <>
                <X className="size-4 mr-2" />
                Cancelar
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

