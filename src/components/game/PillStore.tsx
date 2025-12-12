import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertTriangle, ShoppingCart, X } from 'lucide-react'
import type { PlayerId } from '@/types'
import { usePillStoreState } from '@/hooks/usePillStoreState'
import { useStoreTimer } from '@/hooks/useStoreTimer'
import { STORE_ITEMS, getStoreItemById } from '@/utils/storeConfig'
import { StoreItemCard } from './StoreItemCard'
import { Button } from '../ui/8bit/button'
import { Progress } from '../ui/progress'
import dosedPill from '/dosed_pill.svg'
import { ScrollArea } from '../ui/8bit/scroll-area'

interface PillStoreProps {
  /** ID do jogador que esta comprando */
  playerId: PlayerId
}

/**
 * Componente da Pill Store
 * Exibido durante a fase shopping para jogadores que sinalizaram wantsStore
 * 
 * Fluxo de compras:
 * 1. Jogador adiciona itens ao carrinho (nao debita coins)
 * 2. Ve resumo do carrinho e total a ser gasto
 * 3. Clica "Confirmar Compras" para processar carrinho
 */
export function PillStore({ playerId }: PillStoreProps) {
  // Estado encapsulado via hook (Regra de Ouro #2)
  const {
    player,
    storeState,
    addToCart,
    removeFromCart,
    confirmStorePurchases,
  } = usePillStoreState(playerId)

  const { formattedTime, progress, isActive } = useStoreTimer()

  // Verifica se oponente ja confirmou
  const otherPlayerId: PlayerId = playerId === 'player1' ? 'player2' : 'player1'
  const otherConfirmed = storeState?.confirmed[otherPlayerId] ?? false
  const selfConfirmed = storeState?.confirmed[playerId] ?? false

  // Carrinho do jogador
  const cart = storeState?.cart[playerId] ?? []
  const cartTotal = cart.reduce((sum, item) => sum + item.cost, 0)
  const remainingCoins = player.pillCoins - cartTotal

  // Conta quantas vezes cada item esta no carrinho
  const getCartCount = (itemId: string) => {
    return cart.filter((ci) => ci.storeItemId === itemId).length
  }

  // Handler para adicionar ao carrinho
  const handleAddToCart = (itemId: string) => {
    addToCart(playerId, itemId)
  }

  // Handler para remover do carrinho
  const handleRemoveFromCart = (itemId: string) => {
    removeFromCart(playerId, itemId)
  }

  // Handler para confirmar compras
  const handleConfirm = () => {
    confirmStorePurchases(playerId)
  }

  if (!storeState || selfConfirmed) {
    return null
  }

  // Calcula disponibilidade considerando itens no carrinho
  const getItemAvailability = (itemId: string) => {
    const item = getStoreItemById(itemId)
    if (!item) return { isAvailable: false, canAfford: false }

    // Conta power-ups no carrinho para simular inventario
    const powerUpsInCart = cart.filter((ci) => {
      const si = getStoreItemById(ci.storeItemId)
      return si?.type === 'power_up'
    }).length

    // Player simulado com itens do carrinho
    const simulatedPlayer = {
      ...player,
      inventory: {
        ...player.inventory,
        items: [
          ...player.inventory.items,
          // Adiciona slots temporarios para power-ups no carrinho
          ...Array(powerUpsInCart).fill({ id: 'temp', type: 'scanner' }),
        ],
      },
    }

    const isAvailable = !item.isAvailable || item.isAvailable(simulatedPlayer)
    const canAfford = remainingCoins >= item.cost

    return { isAvailable, canAfford }
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
            <h2 className="text-lg font-normal text-foreground">Pill Store</h2>

            {/* Pill Coins - mostra disponivel apos carrinho */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-amber-500/20 px-3 py-1 rounded-full">
                <img src={dosedPill} alt="Pill Coin" className="w-5 h-5" />
                <span className="text-amber-400 font-normal">{remainingCoins}</span>
                {cartTotal > 0 && (
                  <span className="text-amber-400/60 text-xs">
                    ({player.pillCoins})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-muted-foreground" />
            <span
              className={`text-sm font-mono ${progress < 30 ? 'text-red-400' : 'text-muted-foreground'}`}
            >
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
        <ScrollArea className="h-[45vh]">
          <div className="grid grid-cols-2 gap-3 p-4">
            {STORE_ITEMS.map((item) => {
              const { isAvailable, canAfford } = getItemAvailability(item.id)
              const inCartCount = getCartCount(item.id)

              return (
                <StoreItemCard
                  key={item.id}
                  item={item}
                  isAvailable={isAvailable}
                  canAfford={canAfford}
                  inCartCount={inCartCount}
                  onAddToCart={() => handleAddToCart(item.id)}
                  onRemoveFromCart={() => handleRemoveFromCart(item.id)}
                />
              )
            })}
          </div>
        </ScrollArea>

        {/* Carrinho - Footer */}
        <div className="border-t border-border p-4 bg-muted/30">
          {/* Resumo do carrinho */}
          <AnimatePresence mode="wait">
            {cart.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 p-2 bg-muted/50 rounded-lg border border-border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart size={14} className="text-amber-400" />
                  <span className="text-xs font-medium text-foreground">
                    Carrinho ({cart.length} {cart.length === 1 ? 'item' : 'itens'})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cart.map((cartItem, index) => {
                    const item = getStoreItemById(cartItem.storeItemId)
                    if (!item) return null

                    return (
                      <motion.div
                        key={`${cartItem.storeItemId}-${index}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 rounded-full text-[10px] text-amber-400"
                      >
                        <span>{item.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(cartItem.storeItemId)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                  <span className="text-[10px] text-muted-foreground">Total:</span>
                  <div className="flex items-center gap-1">
                    <img src={dosedPill} alt="Pill Coin" className="w-3.5 h-3.5" />
                    <span className="text-xs font-normal text-amber-400">{cartTotal}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={handleConfirm}
            disabled={!isActive}
            className="w-full"
            variant="default"
          >
            {cart.length > 0 ? `Confirmar Compras (-${cartTotal})` : 'Confirmar (Sem Compras)'}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {cart.length > 0
              ? 'Itens serao aplicados na proxima rodada'
              : 'Clique em itens para adicionar ao carrinho'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
