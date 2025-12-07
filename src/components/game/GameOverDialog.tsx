import { motion } from 'framer-motion'
import { Trophy, Skull, RotateCcw, Pill, Heart, Zap, Target } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Player, PlayerId, GameStats } from '@/types'

interface GameOverDialogProps {
  /** Se o dialog está aberto */
  open: boolean
  /** ID do jogador vencedor */
  winner: PlayerId | null
  /** Dados dos jogadores */
  players: {
    player1: Player
    player2: Player
  }
  /** Estatísticas do jogo */
  stats: GameStats
  /** Callback para reiniciar o jogo */
  onRestart: () => void
}

/**
 * Dialog de fim de jogo
 * Exibe o vencedor, estatísticas e opção de reiniciar
 */
export function GameOverDialog({
  open,
  winner,
  players,
  stats,
  onRestart,
}: GameOverDialogProps) {
  const winnerPlayer = winner ? players[winner] : null
  const loserPlayer = winner
    ? players[winner === 'player1' ? 'player2' : 'player1']
    : null

  const isHumanWinner = winnerPlayer && !winnerPlayer.isAI

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md bg-background/95 backdrop-blur-sm border-primary/20"
      >
        <DialogHeader className="text-center sm:text-center">
          {/* Ícone animado */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto mb-4"
          >
            {isHumanWinner ? (
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <Trophy className="w-10 h-10 text-white" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Skull className="w-10 h-10 text-white" />
              </div>
            )}
          </motion.div>

          {/* Título */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DialogTitle className="text-2xl font-bold">
              {isHumanWinner ? 'Vitória!' : 'Derrota!'}
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              {winnerPlayer ? (
                <>
                  <span className="text-primary font-semibold">
                    {winnerPlayer.name}
                  </span>{' '}
                  venceu a partida!
                </>
              ) : (
                'Empate!'
              )}
            </DialogDescription>
          </motion.div>
        </DialogHeader>

        {/* Estatísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="py-4"
        >
          <h4 className="text-sm font-medium text-muted-foreground mb-3 text-center">
            Estatísticas da Partida
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Target className="w-4 h-4" />}
              label="Rodadas"
              value={stats.totalRounds}
              color="text-blue-400"
            />
            <StatCard
              icon={<Pill className="w-4 h-4" />}
              label="Pílulas"
              value={stats.pillsConsumed}
              color="text-purple-400"
            />
            <StatCard
              icon={<Zap className="w-4 h-4" />}
              label="Colapsos"
              value={stats.totalCollapses}
              color="text-orange-400"
            />
            <StatCard
              icon={<Heart className="w-4 h-4" />}
              label="Vidas Restantes"
              value={winnerPlayer?.lives ?? 0}
              color="text-emerald-400"
            />
          </div>

          {/* Resumo dos jogadores */}
          {winnerPlayer && loserPlayer && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-muted-foreground">
                    {winnerPlayer.name}
                  </span>
                  <span className="text-emerald-400">
                    {winnerPlayer.lives} ❤️
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Skull className="w-4 h-4 text-red-500" />
                  <span className="text-muted-foreground">
                    {loserPlayer.name}
                  </span>
                  <span className="text-red-400">0 ❤️</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Botão de reiniciar */}
        <DialogFooter className="sm:justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full sm:w-auto"
          >
            <Button
              onClick={onRestart}
              size="lg"
              className="w-full gap-2 bg-primary hover:bg-primary/90"
            >
              <RotateCcw className="w-4 h-4" />
              Jogar Novamente
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Card de estatística individual
 */
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <div className={`flex items-center justify-center gap-1.5 mb-1 ${color}`}>
        {icon}
        <span className="text-lg font-bold">{value}</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

