import { useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'
import type { ItemType } from '@/types'

/**
 * Hook para gerenciar o uso de itens durante o jogo
 * Encapsula o estado de selecao de alvo e actions de uso
 */
export function useItemUsage() {
  // Selectors
  const targetSelection = useGameStore((state) => state.targetSelection)
  const phase = useGameStore((state) => state.phase)
  const currentTurn = useGameStore((state) => state.currentTurn)
  const currentPlayerInventory = useGameStore(
    (state) => state.players[state.currentTurn].inventory
  )

  // Actions da store
  const storeStartItemUsage = useGameStore((state) => state.startItemUsage)
  const storeCancelItemUsage = useGameStore((state) => state.cancelItemUsage)
  const storeExecuteItem = useGameStore((state) => state.executeItem)

  // Computed values
  const isSelectingTarget = targetSelection.active
  const selectedItemId = targetSelection.itemId
  const selectedItemType = targetSelection.itemType
  const validTargets = targetSelection.validTargets
  const canUseItems = phase === 'playing'
  const hasItems = currentPlayerInventory.items.length > 0

  /**
   * Inicia o uso de um item
   * Se o item requer alvo, ativa modo de selecao
   * Se nao requer, executa imediatamente
   */
  const startUsage = useCallback(
    (itemId: string) => {
      if (!canUseItems) return
      storeStartItemUsage(itemId)
    },
    [storeStartItemUsage, canUseItems]
  )

  /**
   * Cancela o uso do item atual
   * Reseta o estado de selecao de alvo
   */
  const cancelUsage = useCallback(() => {
    storeCancelItemUsage()
  }, [storeCancelItemUsage])

  /**
   * Executa o item com o alvo selecionado
   * @param targetId - ID do alvo (pilula ou oponente)
   */
  const executeItem = useCallback(
    (targetId?: string) => {
      if (!selectedItemId) return
      storeExecuteItem(selectedItemId, targetId)
    },
    [storeExecuteItem, selectedItemId]
  )

  /**
   * Verifica se um item especifico pode ser usado
   */
  const canUseItem = useCallback(
    (itemId: string) => {
      if (!canUseItems) return false
      return currentPlayerInventory.items.some((item) => item.id === itemId)
    },
    [canUseItems, currentPlayerInventory.items]
  )

  /**
   * Retorna o item atualmente selecionado para uso
   */
  const getSelectedItem = useCallback(() => {
    if (!selectedItemId) return null
    return currentPlayerInventory.items.find((item) => item.id === selectedItemId)
  }, [selectedItemId, currentPlayerInventory.items])

  return {
    // Estado de selecao de alvo
    isSelectingTarget,
    selectedItemId,
    selectedItemType,
    validTargets,

    // Estado geral
    canUseItems,
    hasItems,
    currentTurn,

    // Actions
    startUsage,
    cancelUsage,
    executeItem,

    // Helpers
    canUseItem,
    getSelectedItem,
  }
}

/**
 * Hook para verificar se um tipo especifico de alvo e valido
 */
export function useIsValidTarget(targetType: 'pills' | 'opponent') {
  const validTargets = useGameStore((state) => state.targetSelection.validTargets)
  return validTargets === targetType
}

/**
 * Hook para obter apenas o tipo do item sendo usado
 */
export function useSelectedItemType(): ItemType | null {
  return useGameStore((state) => state.targetSelection.itemType)
}
