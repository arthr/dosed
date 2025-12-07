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
  // Selectors granulares - retornam primitivos para evitar re-renders
  const phase = useGameStore((state) => state.phase)
  const isPlayer2AI = useGameStore((state) => state.players.player2.isAI)

  // Refs para controle de estado
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const hasStartedRef = useRef(false)

  useEffect(() => {
    // Cleanup e reset quando sair da fase de selecao
    if (phase !== 'itemSelection') {
      hasStartedRef.current = false
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
      return
    }

    // Guards
    if (!isPlayer2AI) return
    if (hasStartedRef.current) return

    // Verifica se IA ja confirmou (via getState para evitar dependencia)
    const { itemSelectionConfirmed } = useGameStore.getState()
    if (itemSelectionConfirmed.player2) return

    hasStartedRef.current = true

    // Obtem actions via getState (referencias estaveis)
    const { selectItem, confirmItemSelection } = useGameStore.getState()

    // Seleciona 5 itens aleatorios
    const allItems = getAllItemTypes()
    const shuffledItems = shuffleArray(allItems)
    const selectedItems = shuffledItems.slice(0, 5) as ItemType[]

    // Agenda selecao com delays
    let currentDelay = AI_SELECTION_START_DELAY

    selectedItems.forEach((itemType) => {
      const timeout = setTimeout(() => {
        // Verifica fase antes de executar (pode ter mudado)
        if (useGameStore.getState().phase === 'itemSelection') {
          selectItem('player2', itemType)
        }
      }, currentDelay)
      timeoutsRef.current.push(timeout)
      currentDelay += AI_SELECTION_ITEM_DELAY
    })

    // Confirma apos selecionar todos
    const confirmTimeout = setTimeout(() => {
      if (useGameStore.getState().phase === 'itemSelection') {
        confirmItemSelection('player2')
      }
    }, currentDelay + AI_CONFIRM_DELAY)
    timeoutsRef.current.push(confirmTimeout)

    // Nao retorna cleanup - timeouts sao limpos apenas quando fase muda
  }, [phase, isPlayer2AI])
}
