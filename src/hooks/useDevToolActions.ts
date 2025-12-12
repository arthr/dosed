import { useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useGameFlowStore } from '@/stores/game/gameFlowStore'
import { useToastStore } from '@/stores/toastStore'
import { generatePlayerId } from '@/utils/playerManager'
import type { GamePhase, Player, PlayerId } from '@/types'

const MAX_PLAYERS_FOR_LAYOUT_TEST: number = 4

function getPlayerIndex(id: string): number {
  const n = Number(id.replace('player', ''))
  return Number.isFinite(n) ? n : 0
}

function createBotPlayer(id: PlayerId, template: { lives: number; resistance: number }): Player {
  return {
    id,
    userId: null,
    name: `Bot ${getPlayerIndex(id)}`,
    lives: template.lives,
    maxLives: template.lives,
    resistance: template.resistance,
    maxResistance: template.resistance,
    isAI: true,
    inventory: { items: [], maxItems: 5 },
    effects: [],
    pillCoins: 0,
    wantsStore: false,
  }
}

/**
 * Hook do DevTool para ações de debug no gameStore.
 * Mantém a fronteira: Components -> Hooks -> Stores/Utils.
 */
export function useDevToolActions() {
  const resetGame = useGameStore((s) => s.resetGame)
  const setPhase = useGameStore((s) => s.setPhase)
  const addLivesToPlayer = useGameStore((s) => s.addLivesToPlayer)
  const forceEndRound = useGameStore((s) => s.forceEndRound)
  const currentPhase = useGameStore((s) => s.phase)
  const players = useGameStore((s) => s.players)
  const playerOrder = useGameFlowStore((s) => s.playerOrder)

  const clearToasts = useToastStore((s) => s.clear)
  const showToast = useToastStore((s) => s.show)

  const playerIds = useMemo(() => {
    const fallbackIds = Object.keys(players) as PlayerId[]
    return (playerOrder.length > 0 ? playerOrder : fallbackIds).filter((id) => players[id] !== undefined)
  }, [players, playerOrder])
  const extraBotIds = useMemo(() => {
    return playerIds.filter((id) => getPlayerIndex(id) >= 3 && players[id]?.isAI)
  }, [playerIds, players])

  const addBot = () => {
    const state = useGameStore.getState()
    const orderFromStore = useGameFlowStore.getState().playerOrder
    const fallbackIds = Object.keys(state.players) as PlayerId[]
    const ids = (orderFromStore.length > 0 ? orderFromStore : fallbackIds)
      .filter((id) => state.players[id] !== undefined)

    if (ids.length >= MAX_PLAYERS_FOR_LAYOUT_TEST) {
      showToast({ type: 'info', message: `Limite atingido (${MAX_PLAYERS_FOR_LAYOUT_TEST} jogadores)` })
      return
    }

    // Gera próximo id baseado no maior índice existente (evita colisão se ids não forem contíguos)
    const maxIndex = (Object.keys(state.players) as PlayerId[]).reduce(
      (acc, id) => Math.max(acc, getPlayerIndex(id)),
      0
    )
    const nextId = generatePlayerId(maxIndex) as PlayerId
    const template = {
      lives: state.players[ids[0] ?? generatePlayerId(0)]?.maxLives ?? 3,
      resistance: state.players[ids[0] ?? generatePlayerId(0)]?.maxResistance ?? 6,
    }

    const bot = createBotPlayer(nextId, template)

    useGameStore.setState((prev) => {
      const nextPlayers = { ...prev.players, [nextId]: bot }
      const nextShapeQuests = { ...prev.shapeQuests, [nextId]: null }
      const nextItemSelectionConfirmed = { ...prev.itemSelectionConfirmed, [nextId]: false }
      const nextRevealAtStart = { ...prev.revealAtStart, [nextId]: 0 }

      const nextStoreState = prev.storeState
        ? {
            ...prev.storeState,
            confirmed: { ...prev.storeState.confirmed, [nextId]: false },
            cart: { ...prev.storeState.cart, [nextId]: [] },
            pendingBoosts: { ...prev.storeState.pendingBoosts, [nextId]: [] },
          }
        : prev.storeState

      return {
        players: nextPlayers,
        shapeQuests: nextShapeQuests,
        itemSelectionConfirmed: nextItemSelectionConfirmed,
        revealAtStart: nextRevealAtStart,
        storeState: nextStoreState,
      }
    })

    // Atualiza playerOrder como fonte única de ordem (sem sort por PlayerId)
    const currentOrder = useGameFlowStore.getState().playerOrder
    const baseOrder = currentOrder.length > 0 ? currentOrder : (Object.keys(state.players) as PlayerId[])
    const nextOrder = [...baseOrder.filter((id) => id !== nextId), nextId]
    useGameFlowStore.getState().setPlayerOrder(nextOrder)

    showToast({ type: 'info', message: `Bot adicionado: ${nextId}` })
  }

  const removeBot = () => {
    const state = useGameStore.getState()
    const orderFromStore = useGameFlowStore.getState().playerOrder
    const fallbackIds = Object.keys(state.players) as PlayerId[]
    const ids = (orderFromStore.length > 0 ? orderFromStore : fallbackIds)
      .filter((id) => state.players[id] !== undefined)

    // Seleciona o bot extra "mais alto" sem usar sort (evita derivar ordem por PlayerId)
    const removeId = ids.reduce<PlayerId | null>((acc, id) => {
      if (getPlayerIndex(id) < 3) return acc
      if (!state.players[id]?.isAI) return acc
      if (!acc) return id
      return getPlayerIndex(id) > getPlayerIndex(acc) ? id : acc
    }, null)
    if (!removeId) {
      showToast({ type: 'info', message: 'Nenhum bot extra para remover (apenas base do jogo)' })
      return
    }

    useGameStore.setState((prev) => {
      const restPlayers = { ...prev.players }
      delete restPlayers[removeId]

      const restQuests = { ...prev.shapeQuests }
      delete restQuests[removeId]

      const restConfirmed = { ...prev.itemSelectionConfirmed }
      delete restConfirmed[removeId]

      const restRevealAtStart = { ...prev.revealAtStart }
      delete restRevealAtStart[removeId]

      const nextStoreState = prev.storeState
        ? {
            ...prev.storeState,
            confirmed: (() => {
              const next = { ...prev.storeState!.confirmed }
              delete next[removeId]
              return next
            })(),
            cart: (() => {
              const next = { ...prev.storeState!.cart }
              delete next[removeId]
              return next
            })(),
            pendingBoosts: (() => {
              const next = { ...prev.storeState!.pendingBoosts }
              delete next[removeId]
              return next
            })(),
          }
        : prev.storeState

      const nextIds = Object.keys(restPlayers) as PlayerId[]
      const currentOrder = useGameFlowStore.getState().playerOrder
      const nextOrder = (currentOrder.length > 0 ? currentOrder : nextIds).filter((id) => id !== removeId && restPlayers[id] !== undefined)
      const fallbackTurn = (nextOrder[0] ?? nextIds[0] ?? generatePlayerId(0)) as PlayerId
      const nextCurrentTurn = prev.currentTurn === removeId ? fallbackTurn : prev.currentTurn

      return {
        players: restPlayers,
        shapeQuests: restQuests,
        itemSelectionConfirmed: restConfirmed,
        revealAtStart: restRevealAtStart,
        storeState: nextStoreState,
        currentTurn: nextCurrentTurn,
      }
    })

    // Atualiza playerOrder removendo o bot
    const currentOrder = useGameFlowStore.getState().playerOrder
    const baseOrder = currentOrder.length > 0 ? currentOrder : (Object.keys(state.players) as PlayerId[])
    const nextOrder = baseOrder.filter((id) => id !== removeId)
    useGameFlowStore.getState().setPlayerOrder(nextOrder)

    showToast({ type: 'info', message: `Bot removido: ${removeId}` })
  }

  return {
    // state
    currentPhase,
    players,
    playerIds,
    extraBotIds,

    // actions
    resetGame,
    setPhase,
    addLivesToPlayer,
    forceEndRound,
    clearToasts,
    showToast,
    addBot,
    removeBot,

    // constants/types helpers
    MAX_PLAYERS_FOR_LAYOUT_TEST,
  }
}

export type UseDevToolActionsSelectedPhase = GamePhase


