import { motion } from 'framer-motion'
import {
  Search,
  RefreshCw,
  CopyPlus,
  Pill as PillIcon,
  Shield,
  Lock,
  Utensils,
  Shuffle,
  Trash2,
} from 'lucide-react'
import type { ItemDefinition, ItemType } from '@/types'
import { ITEM_CATALOG, CATEGORY_BG_COLORS } from '@/utils/itemCatalog'

// Mapeamento de nomes de icones para componentes
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Search,
  RefreshCw,
  CopyPlus,
  Pill: PillIcon,
  Shield,
  Lock,
  Utensils,
  Shuffle,
  Trash2,
}

interface ItemCardProps {
  /** Tipo do item ou definicao completa */
  item: ItemType | ItemDefinition
  /** Se o item esta selecionado */
  selected?: boolean
  /** Se o item esta desabilitado */
  disabled?: boolean
  /** Callback ao clicar */
  onClick?: () => void
  /** Tamanho do card */
  size?: 'sm' | 'md' | 'lg'
  /** Mostrar descricao */
  showDescription?: boolean
}

const sizeClasses = {
  sm: {
    card: 'size-24 p-2',
    icon: 16,
    text: 'text-[10px]',
  },
  md: {
    card: 'size-32 p-3',
    icon: 24,
    text: 'text-xs',
  },
  lg: {
    card: 'size-40 p-4',
    icon: 32,
    text: 'text-sm',
  },
}

/**
 * Componente visual de um item
 * Usado na tela de selecao pre-jogo e no inventario
 */
export function ItemCard({
  item,
  selected = false,
  disabled = false,
  onClick,
  size = 'md',
  showDescription = true,
}: ItemCardProps) {
  // Resolve a definicao do item
  const itemDef = typeof item === 'string' ? ITEM_CATALOG[item] : item

  // Obtem o icone do mapeamento
  const IconComponent = ICON_MAP[itemDef.icon]

  const sizeConfig = sizeClasses[size]
  const bgColor = CATEGORY_BG_COLORS[itemDef.category]

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeConfig.card}
        border-2
        flex flex-col items-center justify-center gap-1
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${bgColor}
        ${disabled
          ? 'opacity-40 cursor-not-allowed border-muted'
          : 'cursor-pointer hover:brightness-110'
        }
        ${selected
          ? 'border-primary ring-2 ring-primary/50 brightness-110'
          : 'border-transparent hover:border-primary/50'
        }
      `}
      // Animacoes Framer Motion
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: disabled ? 0.4 : 1,
      }}
      exit={{
        scale: 0,
        opacity: 0,
        transition: { duration: 0.2 },
      }}
      whileHover={
        !disabled
          ? {
              scale: 1.05,
              transition: { duration: 0.15 },
            }
          : undefined
      }
      whileTap={
        !disabled
          ? {
              scale: 0.95,
            }
          : undefined
      }
      // Animacao de pulse quando selecionado
      {...(selected && {
        animate: {
          scale: [1, 1.03, 1],
          opacity: 1,
          transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      })}
      aria-label={`Item ${itemDef.name}: ${itemDef.description}`}
      title={itemDef.description}
    >
      {/* Icone */}
      {IconComponent && (
        <IconComponent
          size={sizeConfig.icon}
          className={itemDef.color}
        />
      )}

      {/* Nome */}
      <span
        className={`
          ${sizeConfig.text}
          font-normal text-foreground text-center
          leading-tight
        `}
      >
        {itemDef.name}
      </span>

      {/* Descricao (opcional, apenas em tamanhos maiores) */}
      {showDescription && size === 'lg' && (
        <span className="text-xs/tight text-muted-foreground text-center line-clamp-2">
          {itemDef.description}
        </span>
      )}
    </motion.button>
  )
}

/**
 * Grid de items com animacao de entrada escalonada
 */
interface ItemGridProps {
  items: ItemType[]
  selectedItems?: ItemType[]
  onSelectItem: (itemType: ItemType) => void
  disabled?: boolean
  maxSelectable?: number
}

export function ItemGrid({
  items,
  selectedItems = [],
  onSelectItem,
  disabled = false,
  maxSelectable = 5,
}: ItemGridProps) {
  const canSelectMore = selectedItems.length < maxSelectable

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-3"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
    >
      {items.map((itemType) => {
        const isSelected = selectedItems.includes(itemType)
        const isDisabled = disabled || (!isSelected && !canSelectMore)

        return (
          <motion.div
            key={itemType}
            variants={{
              hidden: { scale: 0, opacity: 0 },
              visible: { scale: 1, opacity: 1 },
            }}
          >
            <ItemCard
              item={itemType}
              selected={isSelected}
              disabled={isDisabled}
              onClick={() => onSelectItem(itemType)}
              size="md"
            />
          </motion.div>
        )
      })}
    </motion.div>
  )
}
