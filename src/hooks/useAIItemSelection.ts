import { useEffect, useRef } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { getAllItemTypes } from '@/utils/itemCatalog'
import type { ItemType } from '@/types'

/** Delay antes de comecar a selecionar itens (ms) */
const AI_SELECTION_START_DELAY = 500

/** Delay entre cada item selecionado (ms) */
const AI_SELECTION_ITEM_DELAY = 200

/** Delay antes de confirmar a selecao (ms) */
const AI_CONFIRM_DELAY = 800

/**
 * Embaralha um array usando Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Hook que gerencia a selecao automatica de itens pela IA
 * Seleciona 5 itens aleatorios e confirma apos delay
 */
export function useAIItemSelection() {
  const phase = useGameStore((state) => state.phase)
  const player2 = useGameStore((state) => state.players.player2)
  const selectItem = useGameStore((state) => state.selectItem)
  const confirmItemSelection = useGameStore((state) => state.confirmItemSelection)

  // Ref para evitar selecao duplicada
  const hasSelectedRef = useRef(false)

  useEffect(() => {
    // So executa se estiver na fase de selecao e player2 for IA
    if (phase !== 'itemSelection') {
      hasSelectedRef.current = false
      return
    }

    if (!player2.isAI) return
    if (hasSelectedRef.current) return

    hasSelectedRef.current = true

    // Obtem todos os tipos de item e embaralha
    const allItems = getAllItemTypes()
    const shuffledItems = shuffleArray(allItems)
    const selectedItems = shuffledItems.slice(0, 5) as ItemType[]

    // Agenda selecao de itens com delay
    const timeouts: ReturnType<typeof setTimeout>[] = []

    // Delay inicial antes de comecar
    let currentDelay = AI_SELECTION_START_DELAY

    // Seleciona cada item com delay entre eles
    selectedItems.forEach((itemType) => {
      const timeout = setTimeout(() => {
        selectItem('player2', itemType)
      }, currentDelay)
      timeouts.push(timeout)
      currentDelay += AI_SELECTION_ITEM_DELAY
    })

    // Confirma a selecao apos todos os itens
    const confirmTimeout = setTimeout(() => {
      confirmItemSelection('player2')
    }, currentDelay + AI_CONFIRM_DELAY)
    timeouts.push(confirmTimeout)

    // Cleanup
    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [phase, player2.isAI, selectItem, confirmItemSelection])
}
