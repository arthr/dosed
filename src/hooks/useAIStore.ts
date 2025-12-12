import { useEffect, useRef } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useGameFlowStore } from '@/stores/game/gameFlowStore'
import { shouldAIWantStore, selectAIStoreItems } from '@/utils/aiLogic'
import { getAIConfig } from '@/utils/aiConfig'
import { STORE_ITEMS } from '@/utils/storeConfig'
import type { AIDecisionContext, PlayerId } from '@/types'

/** Delay antes de processar compras (ms) */
const AI_SHOPPING_DELAY = 1000

/** Delay entre cada item adicionado ao carrinho (ms) */
const AI_CART_ITEM_DELAY = 300

/** Delay antes de confirmar compras (ms) */
const AI_CONFIRM_DELAY = 500

/**
 * Constroi contexto de decisao da IA para a loja
 */
function buildAIStoreContext(aiPlayerId: PlayerId, opponentId: PlayerId): AIDecisionContext {
  const state = useGameStore.getState()
  const difficulty = state.difficulty
  const config = getAIConfig(difficulty)

  const aiPlayer = state.players[aiPlayerId]
  const opponent = state.players[opponentId]

  return {
    aiPlayer,
    opponent,
    pillPool: state.pillPool,
    revealedPills: state.revealedPills,
    typeCounts: state.typeCounts,
    shapeCounts: state.shapeCounts,
    aiQuest: state.shapeQuests[aiPlayerId],
    opponentQuest: state.shapeQuests[opponentId],
    round: state.round,
    revealAtStart: state.revealAtStart[aiPlayerId],
    config,
  }
}

/**
 * Hook que gerencia comportamento da IA na loja
 * - Auto-toggle wantsStore quando IA precisa de algo e pode pagar
 * - Auto-compra na fase shopping
 * - NAO executa em modo multiplayer - oponente e humano real
 */
export function useAIStore() {
  const phase = useGameStore((state) => state.phase)
  const mode = useGameStore((state) => state.mode)
  const players = useGameStore((state) => state.players)
  const playerOrder = useGameFlowStore((state) => state.playerOrder)

  // Determina (de forma estável) qual jogador é IA (single player)
  const aiPlayerId = (() => {
    const fallbackIds = Object.keys(players) as PlayerId[]
    const ids = (playerOrder.length > 0 ? playerOrder : fallbackIds)
      .filter((id) => players[id] !== undefined)
    return ids.find((id) => players[id]?.isAI) ?? null
  })()

  const isAIAvailable = useGameStore((state) => (aiPlayerId ? state.players[aiPlayerId]?.isAI === true : false))
  const aiCoins = useGameStore((state) => (aiPlayerId ? state.players[aiPlayerId]?.pillCoins ?? 0 : 0))
  const aiLives = useGameStore((state) => (aiPlayerId ? state.players[aiPlayerId]?.lives ?? 0 : 0))
  const aiResistance = useGameStore((state) => (aiPlayerId ? state.players[aiPlayerId]?.resistance ?? 0 : 0))
  const aiWantsStore = useGameStore((state) => (aiPlayerId ? state.players[aiPlayerId]?.wantsStore ?? false : false))

  // Em multiplayer, IA nao deve operar na loja - oponente e humano real
  const isMultiplayer = mode === 'multiplayer'

  // Refs para controle
  const hasToggledRef = useRef(false)
  const hasShoppedRef = useRef(false)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Reset quando rodada muda
  const round = useGameStore((state) => state.round)
  useEffect(() => {
    // Nao executa em multiplayer
    if (isMultiplayer) return

    hasToggledRef.current = false
    hasShoppedRef.current = false
  }, [round, isMultiplayer])

  // Auto-toggle wantsStore durante fase playing
  useEffect(() => {
    // Nao executa em multiplayer
    if (isMultiplayer) return

    if (phase !== 'playing') return
    if (!aiPlayerId || !isAIAvailable) return
    if (hasToggledRef.current) return
    if (aiWantsStore) return // Ja quer ir

    // Constroi contexto e verifica se deve querer ir a loja
    const state = useGameStore.getState()
    const orderFromStore = useGameFlowStore.getState().playerOrder
    const fallbackIds = Object.keys(state.players) as PlayerId[]
    const allIds = (orderFromStore.length > 0 ? orderFromStore : fallbackIds)
      .filter((id) => state.players[id] !== undefined)
    const opponentId = allIds.find((id) => id !== aiPlayerId) ?? aiPlayerId
    const ctx = buildAIStoreContext(aiPlayerId, opponentId)
    const shouldWant = shouldAIWantStore(ctx)

    if (shouldWant) {
      hasToggledRef.current = true
      useGameStore.getState().toggleWantsStore(aiPlayerId)
    }
  }, [phase, aiPlayerId, isAIAvailable, aiCoins, aiLives, aiResistance, aiWantsStore, isMultiplayer])

  // Auto-compra durante fase shopping
  useEffect(() => {
    // Nao executa em multiplayer
    if (isMultiplayer) return

    if (phase !== 'shopping') {
      // Cleanup quando sai da fase
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
      hasShoppedRef.current = false
      return
    }

    if (!aiPlayerId || !isAIAvailable) return
    if (hasShoppedRef.current) return
    if (!aiWantsStore) return // Nao estava interessado

    hasShoppedRef.current = true

    // Obtem items disponiveis na loja
    const storeState = useGameStore.getState().storeState
    if (!storeState) return

    // Constroi contexto e seleciona itens
    const state = useGameStore.getState()
    const orderFromStore = useGameFlowStore.getState().playerOrder
    const fallbackIds = Object.keys(state.players) as PlayerId[]
    const allIds = (orderFromStore.length > 0 ? orderFromStore : fallbackIds)
      .filter((id) => state.players[id] !== undefined)
    const opponentId = allIds.find((id) => id !== aiPlayerId) ?? aiPlayerId
    const ctx = buildAIStoreContext(aiPlayerId, opponentId)
    const storeItems = STORE_ITEMS

    const itemsToBuy = selectAIStoreItems(ctx, storeItems)

    // Agenda adicao ao carrinho com delays
    let currentDelay = AI_SHOPPING_DELAY

    itemsToBuy.forEach((item) => {
      const timeout = setTimeout(() => {
        if (useGameStore.getState().phase === 'shopping') {
          useGameStore.getState().addToCart(aiPlayerId, item.id)
        }
      }, currentDelay)
      timeoutsRef.current.push(timeout)
      currentDelay += AI_CART_ITEM_DELAY
    })

    // Confirma apos adicionar todos
    const confirmTimeout = setTimeout(() => {
      if (useGameStore.getState().phase === 'shopping') {
        useGameStore.getState().confirmStorePurchases(aiPlayerId)
      }
    }, currentDelay + AI_CONFIRM_DELAY)
    timeoutsRef.current.push(confirmTimeout)
  }, [phase, aiPlayerId, isAIAvailable, aiWantsStore, isMultiplayer])
}

