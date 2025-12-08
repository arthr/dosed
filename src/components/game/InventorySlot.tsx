import { motion } from 'framer-motion'
import type { InventoryItem } from '@/types'
import { ITEM_CATALOG, CATEGORY_BG_COLORS } from '@/utils/itemCatalog'
import { ItemIcon } from './ItemIcon'

interface InventorySlotProps {
  /** Item no slot (undefined = vazio) */
  item?: InventoryItem
  /** Se o slot esta desabilitado */
  disabled?: boolean
  /** Se o item esta sendo usado (highlight) */
  isUsing?: boolean
  /** Callback ao clicar */
  onClick?: () => void
}

/**
 * Variantes de animacao para o slot
 */
const slotVariants = {
  // Estado inicial (entrada)
  initial: {
    scale: 0,
    opacity: 0,
    rotate: -10,
  },
  // Estado normal
  idle: {
    scale: 1,
    opacity: 1,
    rotate: 0,
  },
  // Disponivel para uso (pulse sutil)
  available: {
    scale: [1, 1.05, 1],
    opacity: 1,
    rotate: 0,
    transition: {
      scale: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  },
  // Sendo usado (pulse mais intenso)
  using: {
    scale: [1, 1.08, 1],
    opacity: 1,
    rotate: 0,
    transition: {
      scale: {
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  },
  // Saida
  exit: {
    scale: 0,
    opacity: 0,
    rotate: 10,
    transition: { duration: 0.2 },
  },
}

/**
 * Slot individual do inventario
 * Exibe um item ou um espaco vazio
 */
export function InventorySlot({
  item,
  disabled = false,
  isUsing = false,
  onClick,
}: InventorySlotProps) {
  // Slot vazio
  if (!item) {
    return (
      <motion.div
        className="
          w-10 h-10 rounded-md
          border-2 border-dashed border-muted-foreground/30
          bg-muted/20
        "
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        aria-label="Slot vazio"
      />
    )
  }

  // Slot com item
  const itemDef = ITEM_CATALOG[item.type]
  const bgColor = CATEGORY_BG_COLORS[itemDef.category]

  // Determina estado de animacao
  const getAnimationState = () => {
    if (isUsing) return 'using'
    if (!disabled) return 'available'
    return 'idle'
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-10 h-10 rounded-md
        flex items-center justify-center
        border-2 transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
        ${bgColor}
        ${disabled
          ? 'opacity-40 cursor-not-allowed border-muted'
          : 'cursor-pointer hover:brightness-125'
        }
        ${isUsing
          ? 'border-primary ring-2 ring-primary/50'
          : 'border-transparent hover:border-primary/50'
        }
      `}
      variants={slotVariants}
      initial="initial"
      animate={getAnimationState()}
      exit="exit"
      whileHover={!disabled ? { scale: 1.15 } : undefined}
      whileTap={!disabled ? { scale: 0.9 } : undefined}
      aria-label={`${itemDef.name}: ${itemDef.description}`}
      title={`${itemDef.name}: ${itemDef.description}`}
    >
      <ItemIcon type={item.type} size={34} />
    </motion.button>
  )
}
