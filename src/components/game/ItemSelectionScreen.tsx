import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import type { ItemCategory, ItemType } from '@/types'
import { useItemSelection } from '@/hooks'
import { useAIItemSelection } from '@/hooks/useAIItemSelection'
import { useGameStore } from '@/stores/gameStore'
import { ItemCard } from './ItemCard'
import {
  ITEMS_BY_CATEGORY,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  getAllCategories,
} from '@/utils/itemCatalog'

/**
 * Tela de selecao de itens pre-jogo
 * Jogador escolhe ate 5 itens para usar durante a partida
 */
export function ItemSelectionScreen() {
  const {
    selectedCount,
    maxItems,
    canSelectMore,
    selectedItemTypes,
    selectItem,
    deselectItem,
    confirmSelection,
    inventory,
  } = useItemSelection('player1')

  // Status de confirmacao
  const player1Confirmed = useGameStore((s) => s.itemSelectionConfirmed.player1)
  const aiConfirmed = useGameStore((s) => s.itemSelectionConfirmed.player2)

  // Ativa selecao automatica da IA (player2)
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
      className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Selecione seus Itens
        </h1>
        <p className="text-muted-foreground">
          Escolha ate {maxItems} itens para usar durante a partida
        </p>
      </motion.div>

      {/* Contador de selecao */}
      <motion.div
        className="mb-6 px-4 py-2 bg-muted rounded-lg"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-lg font-medium">
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
        className="w-full max-w-4xl space-y-6"
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
        className="mt-6 flex gap-6 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2">
          {player1Confirmed ? (
            <Check className="w-4 h-4 text-emerald-500" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/50" />
          )}
          <span className={player1Confirmed ? 'text-emerald-500' : 'text-muted-foreground'}>
            Voce {player1Confirmed ? 'pronto' : 'selecionando...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {aiConfirmed ? (
            <Check className="w-4 h-4 text-emerald-500" />
          ) : (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          )}
          <span className={aiConfirmed ? 'text-emerald-500' : 'text-muted-foreground'}>
            IA {aiConfirmed ? 'pronta' : 'selecionando...'}
          </span>
        </div>
      </motion.div>

      {/* Botao Confirmar */}
      <motion.div
        className="mt-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={confirmSelection}
          disabled={selectedCount === 0 || player1Confirmed}
          className={`
            px-8 py-3 rounded-lg font-semibold text-lg
            transition-all duration-200
            ${
              selectedCount > 0 && !player1Confirmed
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }
          `}
        >
          {player1Confirmed ? 'Aguardando IA...' : 'Confirmar Selecao'}
        </button>
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
  const items = ITEMS_BY_CATEGORY[category]
  const label = CATEGORY_LABELS[category]
  const colorClass = CATEGORY_COLORS[category]

  return (
    <motion.div
      className="space-y-3"
      variants={{
        hidden: { x: -20, opacity: 0 },
        visible: { x: 0, opacity: 1 },
      }}
    >
      {/* Label da categoria */}
      <h2 className={`text-lg font-semibold ${colorClass}`}>{label}</h2>

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
              size="md"
            />
          )
        })}
      </div>
    </motion.div>
  )
}
