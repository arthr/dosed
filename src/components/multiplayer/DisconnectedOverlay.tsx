import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Loader2, LogOut, UserX } from 'lucide-react'
import { Button } from '@/components/ui/8bit/button'
import { Card, CardContent } from '@/components/ui/8bit/card'
import { useRoomConnection } from '@/hooks'
import { useMultiplayerStore, useOpponentDisconnected } from '@/stores/multiplayerStore'

/**
 * Overlay exibido quando ha problema de conexao durante partida
 * Casos:
 * 1. Conexao LOCAL caiu - tentando reconectar
 * 2. OPONENTE desconectou - aguardando ele reconectar
 * 
 * Mostra countdown para W.O. e opcao de encerrar voluntariamente
 */
export function DisconnectedOverlay() {
  const room = useMultiplayerStore((state) => state.room)
  const opponentDisconnected = useOpponentDisconnected()

  const {
    isReconnecting,
    formattedTimeRemaining,
    hasTimedOut,
    forfeit,
  } = useRoomConnection()

  // Exibe quando:
  // 1. Reconectando localmente (conexao local caiu)
  // 2. Oponente desconectou
  const isLocalReconnecting = isReconnecting && room && !hasTimedOut
  const isOpponentDisconnected = opponentDisconnected && room && !hasTimedOut
  const shouldShow = isLocalReconnecting || isOpponentDisconnected

  // Determina qual mensagem exibir
  const isLocalIssue = isLocalReconnecting

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <Card className="w-full max-w-sm mx-4">
              <CardContent className="flex flex-col items-center gap-6 pt-8 pb-6">
                {/* Icone */}
                <div className="relative">
                  {isLocalIssue ? (
                    <WifiOff className="size-16 text-amber-500" />
                  ) : (
                    <UserX className="size-16 text-amber-500" />
                  )}
                  <motion.div
                    className="absolute -bottom-1 -right-1"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="size-6 text-muted-foreground" />
                  </motion.div>
                </div>

                {/* Mensagem */}
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-normal">
                    {isLocalIssue ? 'Conexao Perdida' : 'Oponente Desconectado'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isLocalIssue
                      ? 'Tentando reconectar...'
                      : 'Aguardando oponente reconectar...'}
                  </p>
                </div>

                {/* Countdown */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Tempo restante
                  </p>
                  <p className="text-4xl font-mono font-normal text-primary">
                    {formattedTimeRemaining}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    W.O. sera declarado ao expirar
                  </p>
                </div>

                {/* Animacao de espera */}
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-amber-500 rounded-full"
                      animate={{
                        y: [0, -6, 0],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>

                {/* Botao de encerrar */}
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={forfeit}
                >
                  <LogOut className="size-4 mr-2" />
                  Encerrar Partida
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Encerrar agora concede vitoria ao oponente
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

