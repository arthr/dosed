import { useEffect, useRef } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { getAllItemsForInitialSelection } from '@/utils/itemCatalog'
import { selectAIInitialItems } from '@/utils/aiLogic'
import { getPlayerIds } from '@/utils/playerManager'

/** Delay antes de comecar a selecionar itens (ms) */
const AI_SELECTION_START_DELAY = 500

/** Delay entre cada item selecionado (ms) */
const AI_SELECTION_ITEM_DELAY = 200

/** Delay antes de confirmar a selecao (ms) */
const AI_CONFIRM_DELAY = 800

/**
 * Hook que gerencia a selecao automatica de itens pela IA
 * Usa selectAIInitialItems para selecao baseada na dificuldade
 * NAO executa em modo multiplayer - oponente e humano real
 */
export function useAIItemSelection() {
  // Selectors granulares - retornam primitivos para evitar re-renders
  const phase = useGameStore((state) => state.phase)
  const mode = useGameStore((state) => state.mode)

  // Determina (de forma estável) qual jogador é IA (single player)
  const aiPlayerId = useGameStore((state) => {
    const ids = getPlayerIds(state.players)
    return ids.find((id) => state.players[id].isAI) ?? null
  })
  const isAIAvailable = useGameStore((state) => (aiPlayerId ? state.players[aiPlayerId]?.isAI === true : false))

  // Refs para controle de estado
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const hasStartedRef = useRef(false)

  // Em multiplayer, IA nao deve selecionar itens - oponente e humano real
  const isMultiplayer = mode === 'multiplayer'

  useEffect(() => {
    // Nao executa em multiplayer
    if (isMultiplayer) return

    // Cleanup e reset quando sair da fase de selecao
    if (phase !== 'itemSelection') {
      hasStartedRef.current = false
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
      return
    }

    // Guards
    if (!aiPlayerId || !isAIAvailable) return
    if (hasStartedRef.current) return

    // Verifica se IA ja confirmou (via getState para evitar dependencia)
    const { itemSelectionConfirmed, difficulty } = useGameStore.getState()
    if (itemSelectionConfirmed[aiPlayerId]) return

    hasStartedRef.current = true

    // Obtem actions via getState (referencias estaveis)
    const { selectItem, confirmItemSelection } = useGameStore.getState()

    // Seleciona itens baseado na dificuldade
    const availableItems = getAllItemsForInitialSelection()
    const selectedItems = selectAIInitialItems(difficulty, availableItems)

    // Agenda selecao com delays
    let currentDelay = AI_SELECTION_START_DELAY

    selectedItems.forEach((itemType) => {
      const timeout = setTimeout(() => {
        // Verifica fase antes de executar (pode ter mudado)
        if (useGameStore.getState().phase === 'itemSelection') {
          selectItem(aiPlayerId, itemType)
        }
      }, currentDelay)
      timeoutsRef.current.push(timeout)
      currentDelay += AI_SELECTION_ITEM_DELAY
    })

    // Confirma apos selecionar todos
    const confirmTimeout = setTimeout(() => {
      if (useGameStore.getState().phase === 'itemSelection') {
        confirmItemSelection(aiPlayerId)
      }
    }, currentDelay + AI_CONFIRM_DELAY)
    timeoutsRef.current.push(confirmTimeout)

    // Nao retorna cleanup - timeouts sao limpos apenas quando fase muda
  }, [phase, aiPlayerId, isAIAvailable, isMultiplayer])
}
