import { motion } from 'framer-motion'
import { Trophy, Skull, RotateCcw, Pill, Heart, Zap, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/8bit/dialog'
import { Button } from '@/components/ui/8bit/button'
import { Card, CardContent } from '@/components/ui/8bit/card'
import { Separator } from '@/components/ui/8bit/separator'
import { Badge } from '@/components/ui/8bit/badge'
import type { Player, PlayerId, GameStats } from '@/types'
import { cn } from '@/lib/utils'

/**
 * Configuracao de tema baseada no resultado do jogo
 */
interface ThemeConfig {
  border: string
  bg: string
  bgSolid: string
  text: string
  title: string
}

/**
 * Props do componente StatCard
 */
interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number
  delay: number
  highlight?: boolean
  alert?: boolean
}

interface GameOverDialogProps {
  /** ID do jogador vencedor */
  winner: PlayerId | null
  /** Dados dos jogadores */
  players: {
    player1: Player
    player2: Player
  }
  /** Estatisticas do jogo */
  stats: GameStats
  /** Callback para reiniciar o jogo */
  onRestart: () => void
  /** Callback para fechar o dialog */
  onClose: () => void
  /** Se esta em modo multiplayer */
  isMultiplayer?: boolean
  /** Estado de rematch (apenas multiplayer) */
  rematchState?: import('@/types').RematchState
  /** Callback para solicitar rematch */
  onRequestRematch?: () => void
  /** Callback para aceitar rematch */
  onAcceptRematch?: () => void
  /** Callback para recusar rematch */
  onDeclineRematch?: () => void
}

/**
 * Retorna configuracao de tema baseada no resultado
 */
function getThemeConfig(winnerPlayer: Player | null, isHumanWinner: boolean): ThemeConfig {
  if (!winnerPlayer) {
    return {
      border: '',
      bg: 'bg-muted/10',
      bgSolid: 'bg-muted-foreground',
      text: 'text-muted-foreground',
      title: 'EMPATE',
    }
  }

  if (isHumanWinner) {
    return {
      border: 'border-primary',
      bg: 'bg-primary/10',
      bgSolid: 'bg-primary',
      text: 'text-primary',
      title: 'VENCEDOR!',
    }
  }

  return {
    border: 'border-destructive',
    bg: 'bg-destructive/10',
    bgSolid: 'bg-destructive',
    text: 'text-destructive',
    title: 'SE FUDEU!',
  }
}

/**
 * Dialog de fim de jogo
 * Exibe o vencedor, estatisticas e opcao de reiniciar
 */
export function GameOverDialog({
  winner,
  players,
  stats,
  onRestart,
  onClose,
  isMultiplayer = false,
  rematchState,
  onRequestRematch,
  onAcceptRematch,
  onDeclineRematch,
}: GameOverDialogProps) {
  const winnerPlayer = winner && (winner === 'player1' || winner === 'player2') ? players[winner] : null
  const isHumanWinner = winnerPlayer !== null && !winnerPlayer.isAI
  const isAiPlayer = players.player2.isAI;
  const theme = getThemeConfig(winnerPlayer, isHumanWinner)

  // Determina qual UI mostrar baseado no estado de rematch
  const showRematchUI = isMultiplayer && rematchState
  const isWaitingForOpponent = showRematchUI && rematchState.status === 'waiting'
  const opponentRequested = isWaitingForOpponent && rematchState.requestedBy !== null

  return (
    <Dialog
      open={true}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          if (isMultiplayer && onDeclineRematch) {
            // Em multiplayer, fechar dialog = declinar rematch
            onDeclineRematch()
          } else {
            // Single player: comportamento normal
            onRestart()
          }
          onClose()
        }
      }}
    >
      <DialogContent
        className={cn(
          'w-[90%] sm:max-w-md',
          'p-0 rounded-none bg-background shadow-2xl gap-0'
        )}
      >
        {/* BODY */}
        <div className="px-4 py-3 sm:p-6">
          <DialogHeader className="flex flex-col items-center justify-center space-y-1 sm:space-y-4">
            {/* ICONE ANIMADO */}
            <motion.div
              initial={{ scale: 0, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className={cn(
                'relative flex items-center justify-center border-4 bg-background',
                'w-14 h-14 sm:w-24 sm:h-24 mb-1 sm:mb-0',
                isHumanWinner ? 'border-yellow-500!' : 'border-red-500!',
                theme.border
              )}
            >
              <div className={cn(
                'absolute inset-0 opacity-20 animate-pulse',
                isHumanWinner ? 'bg-yellow-500!' : 'bg-red-500!',
                theme.bg
              )} />
              {isHumanWinner ? (
                <Trophy className={cn('size-7 sm:size-12', theme.text, 'text-yellow-500')} />
              ) : (
                <Skull className={cn('size-7 sm:size-12', theme.text, 'text-red-500')} />
              )}

              {/* Cantos decorativos 8-bit */}
              <div className={cn(
                'absolute -top-1 -left-1 size-1.5 bg-background border-r border-b',
                isHumanWinner ? 'border-yellow-500!' : 'border-red-500!',
                theme.border
              )} />
              <div className={cn(
                'absolute -top-1 -right-1 size-1.5 bg-background border-l border-b',
                isHumanWinner ? 'border-yellow-500!' : 'border-red-500!',
                theme.border
              )} />
              <div className={cn(
                'absolute -bottom-1 -left-1 size-1.5 bg-background border-r border-t',
                isHumanWinner ? 'border-yellow-500!' : 'border-red-500!',
                theme.border
              )} />
              <div className={cn(
                'absolute -bottom-1 -right-1 size-1.5 bg-background border-l border-t',
                isHumanWinner ? 'border-yellow-500!' : 'border-red-500!',
                theme.border
              )} />
            </motion.div>

            {/* TITULO E DESCRICAO */}
            <div className="text-center">
              <DialogTitle
                className={cn(
                  'font-mono uppercase tracking-widest drop-shadow-md leading-none',
                  'text-2xl sm:text-4xl pb-1',
                  theme.text
                )}
              >
                {theme.title}
              </DialogTitle>
              <DialogDescription asChild>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] sm:text-xs font-mono text-muted-foreground uppercase tracking-wider"
                >
                  {winnerPlayer ? `Vencedor: ${winnerPlayer.name}` : 'Sem Vencedor'}
                </motion.p>
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* GRID DE STATS */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-2 mt-3 sm:mt-8"
          >
            <StatCard label="Rodadas" value={stats.totalRounds} icon={Target} delay={0.4} />
            <StatCard label="Pilulas" value={stats.pillsConsumed} icon={Pill} delay={0.5} />
            <StatCard label="Overdoses" value={stats.totalCollapses} icon={Zap} delay={0.6} alert={stats.totalCollapses > 2} />
            <StatCard label="Vidas" value={winnerPlayer?.lives ?? 0} icon={Heart} delay={0.7} highlight />
          </motion.div>

          {/* SEPARADOR 8-BIT */}
          <Separator className="mt-3 sm:mt-6" />

          {/* PLACAR FINAL (VS) */}
          <div className="pt-2 sm:pt-4">
            <div className="grid grid-cols-[1fr_100px_1fr] align-middle justify-center font-mono text-[10px] sm:text-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-1.5 sm:size-2 bg-primary animate-pulse" />
                <span className="text-primary font-normal truncate max-w-[80px] sm:max-w-none">
                  {players.player1.name}
                </span>
              </div>

              <div className="col-span-1 flex items-center justify-center">
                <Badge variant="outline" className="text-[9px] sm:text-[10px] border-red-500">
                  VS
                </Badge>
              </div>

              <div className="flex items-center justify-end gap-1.5">

                <span
                  className={cn(
                    'font-normal tracking-tight truncate max-w-[80px] sm:max-w-none',
                    !isHumanWinner ? 'text-destructive' : isAiPlayer ? 'text-accent' : 'text-muted-foreground',
                  )}
                >
                  {players.player2.name}
                </span>
                <div
                  className={cn(
                    'size-1.5 sm:size-2',
                    !isHumanWinner ? 'bg-destructive animate-pulse' : 'bg-muted'
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SEPARADOR 8-BIT */}
        <Separator />

        {/* FOOTER */}
        <DialogFooter className="p-3 sm:p-4 bg-muted/20 mt-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full space-y-2"
          >
            {/* Variante 1: Single Player ou Inicial (Multiplayer sem rematch) */}
            {(!isMultiplayer || rematchState?.status === 'idle') && (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    if (isMultiplayer && onRequestRematch) {
                      onRequestRematch()
                    } else {
                      onRestart()
                      onClose()
                    }
                  }}
                  size="lg"
                  className={cn(
                    'w-full font-mono uppercase tracking-widest gap-2 transition-all active:scale-[0.98]',
                    'h-10 sm:h-12 text-sm sm:text-base',
                    isHumanWinner
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  )}
                >
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Jogar Novamente
                </Button>
                
                {isMultiplayer && onDeclineRematch && (
                  <Button
                    onClick={() => {
                      onDeclineRematch()
                      onClose()
                    }}
                    variant="outline"
                    size="lg"
                    className="w-full font-mono uppercase tracking-widest h-10 sm:h-12 text-sm sm:text-base"
                  >
                    Sair
                  </Button>
                )}
              </div>
            )}

            {/* Variante 2: Aguardando oponente (você solicitou rematch) */}
            {isWaitingForOpponent && !opponentRequested && (
              <div className="text-center space-y-3">
                <p className="text-sm sm:text-base font-mono text-muted-foreground animate-pulse">
                  Aguardando oponente...
                </p>
                <Button
                  onClick={() => {
                    if (onDeclineRematch) {
                      onDeclineRematch()
                      onClose()
                    }
                  }}
                  variant="outline"
                  size="lg"
                  className="w-full font-mono uppercase tracking-widest h-10 sm:h-12 text-sm sm:text-base"
                >
                  Cancelar
                </Button>
              </div>
            )}

            {/* Variante 3: Oponente aguardando você */}
            {isWaitingForOpponent && opponentRequested && (
              <div className="text-center space-y-3">
                <p className="text-sm sm:text-base font-mono text-primary font-bold">
                  Oponente quer jogar novamente!
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (onAcceptRematch) {
                        onAcceptRematch()
                        onClose()
                      }
                    }}
                    size="lg"
                    className={cn(
                      'flex-1 font-mono uppercase tracking-widest gap-2 transition-all active:scale-[0.98]',
                      'h-10 sm:h-12 text-sm sm:text-base',
                      'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                  >
                    Aceitar
                  </Button>
                  <Button
                    onClick={() => {
                      if (onDeclineRematch) {
                        onDeclineRematch()
                        onClose()
                      }
                    }}
                    variant="outline"
                    size="lg"
                    className="flex-1 font-mono uppercase tracking-widest h-10 sm:h-12 text-sm sm:text-base"
                  >
                    Recusar
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Card de estatistica individual com estilo 8-bit
 */
function StatCard({ icon: Icon, label, value, delay, highlight, alert }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <Card className="p-0">
        <CardContent
          className={cn(
            'flex items-center justify-between p-2 sm:p-3',
            'bg-background hover:bg-muted/10 transition-colors',
            alert && 'bg-accent/10',
            highlight && 'bg-primary/10'
          )}
        >
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-mono leading-none mb-1">
              {label}
            </span>
            <Icon
              className={cn(
                'size-3.5 sm:size-4',
                alert ? 'text-accent' : highlight ? 'text-primary' : 'text-foreground'
              )}
            />
          </div>

          <span
            className={cn(
              'text-lg sm:text-2xl font-mono leading-none',
              alert ? 'text-accent' : highlight ? 'text-primary' : 'text-foreground'
            )}
          >
            {value}
          </span>
        </CardContent>
      </Card>
    </motion.div>
  )
}
