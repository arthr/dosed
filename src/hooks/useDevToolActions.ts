import { useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useToastStore } from '@/stores/toastStore'
import { getPlayerIds, generatePlayerId } from '@/utils/playerManager'
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

  const clearToasts = useToastStore((s) => s.clear)
  const showToast = useToastStore((s) => s.show)

  const playerIds = useMemo(() => getPlayerIds(players), [players])
  const extraBotIds = useMemo(() => {
    return playerIds.filter((id) => getPlayerIndex(id) >= 3 && players[id]?.isAI)
  }, [playerIds, players])

  const addBot = () => {
    const state = useGameStore.getState()
    const ids = getPlayerIds(state.players)

    if (ids.length >= MAX_PLAYERS_FOR_LAYOUT_TEST) {
      showToast({ type: 'info', message: `Limite atingido (${MAX_PLAYERS_FOR_LAYOUT_TEST} jogadores)` })
      return
    }

    const nextId = generatePlayerId(ids.length) as PlayerId
    const template = {
      lives: state.players[ids[0] ?? 'player1']?.maxLives ?? 3,
      resistance: state.players[ids[0] ?? 'player1']?.maxResistance ?? 6,
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

    showToast({ type: 'info', message: `Bot adicionado: ${nextId}` })
  }

  const removeBot = () => {
    const state = useGameStore.getState()
    const ids = getPlayerIds(state.players)
    const removable = ids
      .filter((id) => getPlayerIndex(id) >= 3 && state.players[id]?.isAI)
      .sort((a, b) => getPlayerIndex(b) - getPlayerIndex(a))

    const removeId = removable[0]
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

      const fallbackTurn = ids[0] ?? 'player1'
      const nextCurrentTurn = prev.currentTurn === removeId ? (fallbackTurn as PlayerId) : prev.currentTurn

      return {
        players: restPlayers,
        shapeQuests: restQuests,
        itemSelectionConfirmed: restConfirmed,
        revealAtStart: restRevealAtStart,
        storeState: nextStoreState,
        currentTurn: nextCurrentTurn,
      }
    })

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


