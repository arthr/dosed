import { useEffect, useRef } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { shouldAIWantStore, selectAIStoreItems } from '@/utils/aiLogic'
import { getAIConfig } from '@/utils/aiConfig'
import { STORE_ITEMS } from '@/utils/storeConfig'
import type { AIDecisionContext } from '@/types'

/** Delay antes de processar compras (ms) */
const AI_SHOPPING_DELAY = 1000

/** Delay entre cada item adicionado ao carrinho (ms) */
const AI_CART_ITEM_DELAY = 300

/** Delay antes de confirmar compras (ms) */
const AI_CONFIRM_DELAY = 500

/**
 * Constroi contexto de decisao da IA para a loja
 */
function buildAIStoreContext(): AIDecisionContext {
  const state = useGameStore.getState()
  const difficulty = state.difficulty
  const config = getAIConfig(difficulty)

  const aiPlayer = state.players.player2
  const opponent = state.players.player1

  return {
    aiPlayer,
    opponent,
    pillPool: state.pillPool,
    revealedPills: state.revealedPills,
    typeCounts: state.typeCounts,
    shapeCounts: state.shapeCounts,
    aiQuest: state.shapeQuests.player2,
    round: state.round,
    config,
  }
}

/**
 * Hook que gerencia comportamento da IA na loja
 * - Auto-toggle wantsStore baseado em coins e dificuldade
 * - Auto-compra na fase shopping
 */
export function useAIStore() {
  const phase = useGameStore((state) => state.phase)
  const isPlayer2AI = useGameStore((state) => state.players.player2.isAI)
  const player2Coins = useGameStore((state) => state.players.player2.pillCoins)
  const player2WantsStore = useGameStore((state) => state.players.player2.wantsStore)
  const difficulty = useGameStore((state) => state.difficulty)

  // Refs para controle
  const hasToggledRef = useRef(false)
  const hasShoppedRef = useRef(false)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Reset quando rodada muda
  const round = useGameStore((state) => state.round)
  useEffect(() => {
    hasToggledRef.current = false
    hasShoppedRef.current = false
  }, [round])

  // Auto-toggle wantsStore durante fase playing
  useEffect(() => {
    if (phase !== 'playing') return
    if (!isPlayer2AI) return
    if (hasToggledRef.current) return
    if (player2WantsStore) return // Ja quer ir

    // Verifica se deve querer ir a loja
    const shouldWant = shouldAIWantStore(difficulty, player2Coins)

    if (shouldWant) {
      hasToggledRef.current = true
      // Toggle wantsStore
      useGameStore.getState().toggleWantsStore('player2')
    }
  }, [phase, isPlayer2AI, player2Coins, player2WantsStore, difficulty])

  // Auto-compra durante fase shopping
  useEffect(() => {
    if (phase !== 'shopping') {
      // Cleanup quando sai da fase
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
      hasShoppedRef.current = false
      return
    }

    if (!isPlayer2AI) return
    if (hasShoppedRef.current) return
    if (!player2WantsStore) return // Nao estava interessado

    hasShoppedRef.current = true

    // Obtem items disponiveis na loja
    const storeState = useGameStore.getState().storeState
    if (!storeState) return

    // Constroi contexto e seleciona itens
    const ctx = buildAIStoreContext()
    const storeItems = Object.values(STORE_ITEMS)

    const itemsToBuy = selectAIStoreItems(ctx, ctx.aiPlayer.pillCoins, storeItems)

    // Agenda adicao ao carrinho com delays
    let currentDelay = AI_SHOPPING_DELAY

    itemsToBuy.forEach((item) => {
      const timeout = setTimeout(() => {
        if (useGameStore.getState().phase === 'shopping') {
          useGameStore.getState().addToCart('player2', item.id)
        }
      }, currentDelay)
      timeoutsRef.current.push(timeout)
      currentDelay += AI_CART_ITEM_DELAY
    })

    // Confirma apos adicionar todos
    const confirmTimeout = setTimeout(() => {
      if (useGameStore.getState().phase === 'shopping') {
        useGameStore.getState().confirmStorePurchases('player2')
      }
    }, currentDelay + AI_CONFIRM_DELAY)
    timeoutsRef.current.push(confirmTimeout)
  }, [phase, isPlayer2AI, player2WantsStore])
}

