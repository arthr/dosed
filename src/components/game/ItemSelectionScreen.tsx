import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import type { ItemCategory, ItemType, PlayerId } from '@/types'
import { useItemSelection, useMultiplayer } from '@/hooks'
import { useAIItemSelection } from '@/hooks/useAIItemSelection'
import { useGameStore } from '@/stores/gameStore'
import { ItemCard } from './ItemCard'
import {
  CATEGORY_LABELS,
  CATEGORY_TEXT_COLORS,
  getAllCategories,
  getItemsForInitialSelection,
} from '@/utils/itemCatalog'
import { cn } from '@/lib/utils'
import { Button } from '../ui/8bit/button'

/**
 * Tela de selecao de itens pre-jogo
 * Jogador escolhe ate 5 itens para usar durante a partida
 * Suporta single player (vs IA) e multiplayer (vs humano)
 */
export function ItemSelectionScreen() {
  // Contexto multiplayer
  const { isMultiplayer, localPlayerId, opponentPlayerId, room, localRole } = useMultiplayer()

  // Determina IDs dos jogadores
  const myPlayerId: PlayerId = localPlayerId ?? 'player1'
  const opponentId: PlayerId = isMultiplayer
    ? (opponentPlayerId ?? 'player2')
    : 'player2'

  // Determina nomes para exibicao
  const opponentName = isMultiplayer
    ? (localRole === 'host' ? room?.guestName : room?.hostName) ?? 'Oponente'
    : 'IA'

  const {
    selectedCount,
    maxItems,
    canSelectMore,
    selectedItemTypes,
    selectItem,
    deselectItem,
    confirmSelection,
    inventory,
  } = useItemSelection(myPlayerId)

  // Status de confirmacao (dinamico baseado nos IDs corretos)
  const myConfirmed = useGameStore((s) => s.itemSelectionConfirmed[myPlayerId])
  const opponentConfirmed = useGameStore((s) => s.itemSelectionConfirmed[opponentId])

  // Ativa selecao automatica da IA (apenas em single player - hook ja tem early return)
  useAIItemSelection()

  const categories = getAllCategories()

  /**
   * Toggle de selecao: se ja selecionado, remove; senao, adiciona
   */
  const handleItemClick = (itemType: ItemType) => {
    if (selectedItemTypes.includes(itemType)) {
      // Encontra o item no inventario pelo tipo e remove
      const itemToRemove = inventory.items.find((item) => item.type === itemType)
      if (itemToRemove) {
        deselectItem(itemToRemove.id)
      }
    } else {
      selectItem(itemType)
    }
  }

  return (
    <motion.div
      className="flex flex-col gap-6 w-full max-w-5xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <motion.div
        className="text-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-lg tracking-tight text-foreground">
          Selecione seus itens
        </h1>
        <p className="text-xs tracking-tight text-muted-foreground">
          Escolha ate {maxItems} itens para usar durante a partida
        </p>
      </motion.div>

      {/* Contador de selecao */}
      <motion.div
        className="flex bg-muted p-2 justify-end"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-xs">
          <span
            className={
              selectedCount === maxItems ? 'text-primary' : 'text-foreground'
            }
          >
            {selectedCount}
          </span>
          <span className="text-muted-foreground"> / {maxItems}</span>
        </span>
      </motion.div>

      {/* Grid de categorias */}
      <motion.div
        className="flex flex-wrap w-full max-w-4xl space-y-6 space-x-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
          },
        }}
      >
        {categories.map((category) => (
          <CategorySection
            key={category}
            category={category}
            selectedItems={selectedItemTypes}
            onItemClick={handleItemClick}
            canSelectMore={canSelectMore}
          />
        ))}
      </motion.div>

      {/* Status de confirmacao */}
      <motion.div
        className="mt-6 flex self-center gap-6 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2">
          {myConfirmed ? (
            <Check className="size-4 text-emerald-500" />
          ) : (
            <div className="size-4 rounded-full border-2 border-muted-foreground/50" />
          )}
          <span className={cn(
            myConfirmed ? 'text-emerald-500' : 'text-muted-foreground'
          )}>
            Voce {myConfirmed ? 'pronto' : 'selecionando...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {opponentConfirmed ? (
            <Check className="size-4 text-emerald-500" />
          ) : (
            <Loader2 className="size-4 text-muted-foreground animate-spin" />
          )}
          <span className={cn(
            opponentConfirmed ? 'text-emerald-500' : 'text-muted-foreground'
          )}>
            {opponentName} {opponentConfirmed ? 'pronto' : 'selecionando...'}
          </span>
        </div>
      </motion.div>

      {/* Botao Confirmar */}
      <motion.div
        className="mt-4 flex self-end"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={confirmSelection}
          disabled={selectedCount === 0 || myConfirmed}
          className={`
            px-4 py-3 rounded-sm font-normal text-xs
            transition-all duration-200
            ${selectedCount > 0 && !myConfirmed
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
            }
          `}
        >
          {myConfirmed ? `Aguardando ${opponentName}...` : 'Confirmar selecao'}
        </Button>
      </motion.div>
    </motion.div>
  )
}

// ============================================
// Componente de Secao por Categoria
// ============================================

interface CategorySectionProps {
  category: ItemCategory
  selectedItems: ItemType[]
  onItemClick: (itemType: ItemType) => void
  canSelectMore: boolean
}

function CategorySection({
  category,
  selectedItems,
  onItemClick,
  canSelectMore,
}: CategorySectionProps) {
  const items = getItemsForInitialSelection(category)
  const label = CATEGORY_LABELS[category]
  const textColor = CATEGORY_TEXT_COLORS[category]

  return (
    <motion.div
      className="space-y-2"
      variants={{
        hidden: { x: -20, opacity: 0 },
        visible: { x: 0, opacity: 1 },
      }}
    >
      {/* Label da categoria */}
      <h2 className={`text-base ${textColor}`}>{label}</h2>

      {/* Grid de itens */}
      <div className="flex flex-wrap gap-3">
        {items.map((itemType) => {
          const isSelected = selectedItems.includes(itemType)
          const isDisabled = !isSelected && !canSelectMore

          return (
            <ItemCard
              key={itemType}
              item={itemType}
              selected={isSelected}
              disabled={isDisabled}
              onClick={() => onItemClick(itemType)}
              size="sm"
            />
          )
        })}
      </div>
    </motion.div>
  )
}
