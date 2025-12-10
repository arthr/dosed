import { motion } from 'framer-motion'
import { Clock, AlertTriangle } from 'lucide-react'
import type { PlayerId } from '@/types'
import { useGameStore } from '@/stores/gameStore'
import { useStoreTimer } from '@/hooks/useStoreTimer'
import { STORE_ITEMS } from '@/utils/storeConfig'
import { StoreItemCard } from './StoreItemCard'
import { Button } from '../ui/8bit/button'
import { Progress } from '../ui/progress'
import dosedPill from '/dosed_pill.svg'

interface PillStoreProps {
  /** ID do jogador que esta comprando */
  playerId: PlayerId
}

/**
 * Componente da Pill Store
 * Exibido durante a fase shopping para jogadores que sinalizaram wantsStore
 */
export function PillStore({ playerId }: PillStoreProps) {
  const player = useGameStore((s) => s.players[playerId])
  const storeState = useGameStore((s) => s.storeState)
  const purchaseStoreItem = useGameStore((s) => s.purchaseStoreItem)
  const confirmStorePurchases = useGameStore((s) => s.confirmStorePurchases)

  const { formattedTime, progress, isActive } = useStoreTimer()

  // Verifica se oponente ja confirmou
  const otherPlayerId: PlayerId = playerId === 'player1' ? 'player2' : 'player1'
  const otherConfirmed = storeState?.confirmed[otherPlayerId] ?? false
  const selfConfirmed = storeState?.confirmed[playerId] ?? false

  // Handler para comprar item
  const handlePurchase = (itemId: string) => {
    purchaseStoreItem(playerId, itemId)
  }

  // Handler para confirmar compras
  const handleConfirm = () => {
    confirmStorePurchases(playerId)
  }

  if (!storeState || selfConfirmed) {
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
        className="w-full max-w-lg bg-card border-2 border-border rounded-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-muted/50 border-b border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">Pill Store</h2>
            
            {/* Pill Coins */}
            <div className="flex items-center gap-2 bg-amber-500/20 px-3 py-1 rounded-full">
              <img src={dosedPill} alt="Pill Coin" className="w-5 h-5" />
              <span className="text-amber-400 font-bold">{player.pillCoins}</span>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-muted-foreground" />
            <span className={`text-sm font-mono ${progress < 30 ? 'text-red-400' : 'text-muted-foreground'}`}>
              {formattedTime}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />

          {/* Aviso se oponente confirmou */}
          {otherConfirmed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-3 p-2 bg-yellow-500/20 border border-yellow-500/40 rounded text-yellow-400 text-xs"
            >
              <AlertTriangle size={14} />
              <span>Oponente finalizou! Tempo reduzido.</span>
            </motion.div>
          )}
        </div>

        {/* Grid de Itens */}
        <div className="p-4 max-h-[50vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {STORE_ITEMS.map((item) => {
              const isAvailable = !item.isAvailable || item.isAvailable(player)
              const canAfford = player.pillCoins >= item.cost

              return (
                <StoreItemCard
                  key={item.id}
                  item={item}
                  isAvailable={isAvailable}
                  canAfford={canAfford}
                  onPurchase={() => handlePurchase(item.id)}
                />
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 bg-muted/30">
          <Button
            onClick={handleConfirm}
            disabled={!isActive}
            className="w-full"
            variant="default"
          >
            Confirmar Compras
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Compras confirmadas serao aplicadas na proxima rodada
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

