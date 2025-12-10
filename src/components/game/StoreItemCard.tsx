import { motion } from 'framer-motion'
import type { StoreItem } from '@/types'
import dosedPill from '/dosed_pill.svg'

interface StoreItemCardProps {
  /** Item da loja */
  item: StoreItem
  /** Se o item esta disponivel para o jogador */
  isAvailable: boolean
  /** Se o jogador pode pagar pelo item */
  canAfford: boolean
  /** Callback ao comprar */
  onPurchase: () => void
}

/**
 * Card de item na Pill Store
 * Exibe icone, nome, descricao, custo e estado
 */
export function StoreItemCard({
  item,
  isAvailable,
  canAfford,
  onPurchase,
}: StoreItemCardProps) {
  const Icon = item.icon
  const canBuy = isAvailable && canAfford

  // Determina estilo baseado no estado
  const getStateClasses = () => {
    if (!isAvailable) {
      return 'opacity-40 cursor-not-allowed bg-muted/20'
    }
    if (!canAfford) {
      return 'opacity-60 cursor-not-allowed bg-muted/30'
    }
    return 'cursor-pointer hover:bg-muted/50 hover:border-primary/50'
  }

  const handleClick = () => {
    if (canBuy) {
      onPurchase()
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={!canBuy}
      whileHover={canBuy ? { scale: 1.02 } : {}}
      whileTap={canBuy ? { scale: 0.98 } : {}}
      className={`
        relative flex flex-col items-center gap-2 p-3
        border border-border rounded-lg
        transition-all duration-200
        ${getStateClasses()}
      `}
    >
      {/* Badge de tipo */}
      <div
        className={`
          absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-medium uppercase
          ${item.type === 'boost' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}
        `}
      >
        {item.type === 'boost' ? 'Boost' : 'Item'}
      </div>

      {/* Icone */}
      <div
        className={`
          w-10 h-10 flex items-center justify-center rounded-lg mt-2
          ${item.type === 'boost' ? 'bg-emerald-500/10' : 'bg-blue-500/10'}
        `}
      >
        <Icon
          size={24}
          className={item.type === 'boost' ? 'text-emerald-400' : 'text-blue-400'}
        />
      </div>

      {/* Nome */}
      <span className="text-sm font-medium text-foreground">{item.name}</span>

      {/* Descricao */}
      <span className="text-[10px] text-muted-foreground text-center line-clamp-2">
        {item.description}
      </span>

      {/* Custo */}
      <div
        className={`
          flex items-center gap-1 px-2 py-0.5 rounded-full
          ${canAfford ? 'bg-amber-500/20' : 'bg-red-500/20'}
        `}
      >
        <img src={dosedPill} alt="Pill Coin" className="w-3.5 h-3.5" />
        <span
          className={`text-xs font-bold ${canAfford ? 'text-amber-400' : 'text-red-400'}`}
        >
          {item.cost}
        </span>
      </div>

      {/* Indicador de indisponivel */}
      {!isAvailable && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Indisponivel
          </span>
        </div>
      )}
    </motion.button>
  )
}

