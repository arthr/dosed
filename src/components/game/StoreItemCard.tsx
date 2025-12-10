import { motion } from 'framer-motion'
import { Plus, Minus, Check } from 'lucide-react'
import type { StoreItem } from '@/types'
import { ItemIcon } from './ItemIcon'
import dosedPill from '/dosed_pill.svg'

interface StoreItemCardProps {
  /** Item da loja */
  item: StoreItem
  /** Se o item esta disponivel para o jogador */
  isAvailable: boolean
  /** Se o jogador pode pagar pelo item */
  canAfford: boolean
  /** Quantidade deste item no carrinho */
  inCartCount?: number
  /** Callback ao adicionar ao carrinho */
  onAddToCart: () => void
  /** Callback ao remover do carrinho */
  onRemoveFromCart: () => void
}

/**
 * Card de item na Pill Store
 * Exibe icone, nome, descricao, custo e controles de carrinho
 * 
 * Sistema de carrinho:
 * - Click no card adiciona ao carrinho
 * - Botao "-" remove do carrinho
 * - Badge mostra quantidade no carrinho
 */
export function StoreItemCard({
  item,
  isAvailable,
  canAfford,
  inCartCount = 0,
  onAddToCart,
  onRemoveFromCart,
}: StoreItemCardProps) {
  const Icon = item.icon
  const isInCart = inCartCount > 0
  const canAdd = isAvailable && canAfford

  // Determina estilo baseado no estado
  const getStateClasses = () => {
    if (!isAvailable) {
      return 'opacity-40 cursor-not-allowed bg-muted/20'
    }
    if (!canAfford && !isInCart) {
      return 'opacity-60 cursor-not-allowed bg-muted/30'
    }
    if (isInCart) {
      return 'cursor-pointer bg-amber-500/10 border-amber-500/50'
    }
    return 'cursor-pointer hover:bg-muted/50 hover:border-primary/50'
  }

  const handleCardClick = () => {
    if (canAdd) {
      onAddToCart()
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemoveFromCart()
  }

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (canAdd) {
      onAddToCart()
    }
  }

  return (
    <motion.div
      onClick={handleCardClick}
      whileHover={canAdd ? { scale: 1.02 } : {}}
      whileTap={canAdd ? { scale: 0.98 } : {}}
      className={`
        relative flex flex-col items-center gap-1.5 p-3 min-h-[160px]
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

      {/* Badge de indisponivel */}
      {!isAvailable && (
        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-medium uppercase bg-red-500/30 text-red-400">
          Indisponivel
        </div>
      )}

      {/* Badge de quantidade no carrinho */}
      {isInCart && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-1 right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-400"
        >
          <Check size={10} />
          <span className="text-[9px] font-medium">{inCartCount}x</span>
        </motion.div>
      )}

      {/* Icone */}
      <div
        className={`
          w-12 h-12 flex items-center justify-center rounded-lg mt-3
          ${item.type === 'boost' ? 'bg-emerald-500/10' : 'bg-blue-500/10'}
          ${!isAvailable ? 'grayscale opacity-50' : ''}
          ${isInCart ? 'ring-2 ring-amber-500/50' : ''}
        `}
      >
        {/* Power-ups com itemType usam ItemIcon (imagens), boosts usam icone Lucide */}
        {item.type === 'power_up' && item.itemType ? (
          <ItemIcon type={item.itemType} size={40} />
        ) : (
          <Icon
            size={24}
            className={item.type === 'boost' ? 'text-emerald-400' : 'text-blue-400'}
          />
        )}
      </div>

      {/* Nome */}
      <span className="text-sm font-medium text-foreground mt-1">{item.name}</span>

      {/* Descricao - altura fixa para consistencia */}
      <span className="text-[10px] text-muted-foreground text-center line-clamp-2 h-7 flex items-center">
        {item.description}
      </span>

      {/* Custo e controles */}
      <div className="flex items-center gap-2 mt-auto">
        {/* Botao remover (se no carrinho) */}
        {isInCart && (
          <motion.button
            type="button"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={handleRemove}
            className="p-1 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            <Minus size={12} />
          </motion.button>
        )}

        {/* Custo */}
        <div
          className={`
            flex items-center gap-1 px-2 py-0.5 rounded-full
            ${canAfford || isInCart ? 'bg-amber-500/20' : 'bg-red-500/20'}
          `}
        >
          <img src={dosedPill} alt="Pill Coin" className="w-3.5 h-3.5" />
          <span
            className={`text-xs font-normal ${canAfford || isInCart ? 'text-amber-400' : 'text-red-400'}`}
          >
            {item.cost}
          </span>
        </div>

        {/* Botao adicionar (se disponivel) */}
        {canAdd && (
          <motion.button
            type="button"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={handleAdd}
            className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
          >
            <Plus size={12} />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
