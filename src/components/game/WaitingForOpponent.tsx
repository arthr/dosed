import { motion } from 'framer-motion'
import { Clock, ShoppingBag, Loader2 } from 'lucide-react'
import { useStoreTimer } from '@/hooks/useStoreTimer'
import { Progress } from '../ui/progress'

/**
 * Componente exibido para jogadores que NAO sinalizaram wantsStore
 * durante a fase shopping enquanto oponente faz compras
 */
export function WaitingForOpponent() {
  const { formattedTime, progress, isActive } = useStoreTimer()

  if (!isActive) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="w-full max-w-sm bg-card border-2 border-border rounded-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-muted/50 border-b border-border p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShoppingBag size={20} className="text-amber-400" />
            <h2 className="text-lg font-normal text-foreground">Pill Store</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Voce nao sinalizou interesse em compras
          </p>
        </div>

        {/* Conteudo */}
        <div className="p-6 flex flex-col items-center gap-4">
          {/* Icone animado */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 flex items-center justify-center rounded-full bg-muted/50"
          >
            <Loader2 size={32} className="text-primary" />
          </motion.div>

          {/* Mensagem */}
          <div className="text-center">
            <p className="text-sm text-foreground font-medium">
              Aguardando oponente fazer compras...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              A proxima rodada iniciara automaticamente
            </p>
          </div>

          {/* Timer */}
          <div className="w-full mt-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock size={14} className="text-muted-foreground" />
              <span
                className={`text-sm font-mono ${progress < 30 ? 'text-red-400' : 'text-muted-foreground'}`}
              >
                {formattedTime}
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-3 bg-muted/30">
          <p className="text-[10px] text-muted-foreground text-center">
            Dica: Clique no icone de Pill Coins durante a rodada para sinalizar interesse
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

