import { create } from 'zustand'
import type {
  GameAction,
  GameConfig,
  GameState,
  GameStats,
  Pill,
  PillType,
  Player,
  PlayerId,
} from '@/types'
import { DEFAULT_GAME_CONFIG, PILL_CONFIG, ROUND_TRANSITION_DELAY } from '@/utils/constants'
import { applyPillEffect, createPlayer } from '@/utils/gameLogic'
import {
  countPillTypes,
  generatePillPool,
  revealPill,
} from '@/utils/pillGenerator'

/**
 * Interface do Store com estado e actions
 */
interface GameStore extends GameState {
  // Actions
  initGame: (config?: Partial<GameConfig>) => void
  consumePill: (pillId: string) => void
  revealPillById: (pillId: string) => void
  nextTurn: () => void
  resetRound: () => void
  endGame: (winnerId: PlayerId) => void
  resetGame: () => void

  // Selectors (computed)
  getCurrentPlayer: () => Player
  getOpponent: () => Player
  getPillById: (pillId: string) => Pill | undefined
  isPillPoolEmpty: () => boolean
  getGameStats: () => GameStats
}

/**
 * Estado inicial do jogo
 */
const initialState: GameState = {
  phase: 'setup',
  turnPhase: 'consume',
  currentTurn: 'player1',
  players: {
    player1: createPlayer('player1', 'Player 1', 3, 6, false),
    player2: createPlayer('player2', 'Player 2', 3, 6, true),
  },
  pillPool: [],
  typeCounts: {
    SAFE: 0,
    DMG_LOW: 0,
    DMG_HIGH: 0,
    FATAL: 0,
    HEAL: 0,
  },
  round: 0,
  winner: null,
  actionHistory: [],
}

/**
 * Zustand Store para gerenciamento do estado do jogo
 */
export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  /**
   * Inicializa um novo jogo com configuracao
   */
  initGame: (config?: Partial<GameConfig>) => {
    const finalConfig = { ...DEFAULT_GAME_CONFIG, ...config }

    const player1 = createPlayer(
      'player1',
      finalConfig.player1.name,
      finalConfig.startingLives,
      finalConfig.startingResistance,
      finalConfig.player1.isAI
    )

    const player2 = createPlayer(
      'player2',
      finalConfig.player2.name,
      finalConfig.startingLives,
      finalConfig.startingResistance,
      finalConfig.player2.isAI
    )

    const pillPool = generatePillPool(finalConfig.pillsPerRound, {
      ...PILL_CONFIG,
      probabilities: finalConfig.pillProbabilities,
    })

    const typeCounts = countPillTypes(pillPool)

    const startAction: GameAction = {
      type: 'GAME_START',
      playerId: 'player1',
      timestamp: Date.now(),
      payload: { config: finalConfig },
    }

    set({
      phase: 'playing',
      turnPhase: 'consume',
      currentTurn: 'player1',
      players: { player1, player2 },
      pillPool,
      typeCounts,
      round: 1,
      winner: null,
      actionHistory: [startAction],
    })
  },

  /**
   * Consome uma pilula do pool
   */
  consumePill: (pillId: string) => {
    const state = get()

    // Validacoes
    if (state.phase !== 'playing') return
    if (state.pillPool.length === 0) return

    const pillIndex = state.pillPool.findIndex((p) => p.id === pillId)
    if (pillIndex === -1) return

    const pill = state.pillPool[pillIndex]
    const currentPlayer = state.players[state.currentTurn]

    // Revela a pilula
    const revealedPill = revealPill(pill)

    // Aplica o efeito
    const result = applyPillEffect(revealedPill, currentPlayer)

    // Remove pilula do pool
    const newPillPool = state.pillPool.filter((p) => p.id !== pillId)
    const newTypeCounts = countPillTypes(newPillPool)

    // Registra acao
    const consumeAction: GameAction = {
      type: 'CONSUME_PILL',
      playerId: state.currentTurn,
      timestamp: Date.now(),
      payload: {
        pillId,
        pillType: pill.type,
        damage: result.damageDealt,
        heal: result.healReceived,
      },
    }

    const actions: GameAction[] = [consumeAction]

    // Registra colapso se houver
    if (result.collapsed) {
      actions.push({
        type: 'COLLAPSE',
        playerId: state.currentTurn,
        timestamp: Date.now(),
      })
    }

    // Verifica eliminacao
    if (result.eliminated) {
      actions.push({
        type: 'ELIMINATE',
        playerId: state.currentTurn,
        timestamp: Date.now(),
      })

      // Determina vencedor
      const winnerId = state.currentTurn === 'player1' ? 'player2' : 'player1'

      actions.push({
        type: 'GAME_END',
        playerId: winnerId,
        timestamp: Date.now(),
      })

      set({
        players: {
          ...state.players,
          [state.currentTurn]: result.player,
        },
        pillPool: newPillPool,
        typeCounts: newTypeCounts,
        phase: 'ended',
        winner: winnerId,
        actionHistory: [...state.actionHistory, ...actions],
      })
      return
    }

    // Atualiza estado e passa turno
    const nextTurn: PlayerId =
      state.currentTurn === 'player1' ? 'player2' : 'player1'

    set({
      players: {
        ...state.players,
        [state.currentTurn]: result.player,
      },
      pillPool: newPillPool,
      typeCounts: newTypeCounts,
      currentTurn: nextTurn,
      actionHistory: [...state.actionHistory, ...actions],
    })

    // Verifica se pool esvaziou - inicia fase de transicao
    if (newPillPool.length === 0) {
      // Muda para fase roundEnding
      set({ phase: 'roundEnding' })

      // Apos delay, inicia nova rodada
      setTimeout(() => {
        get().resetRound()
      }, ROUND_TRANSITION_DELAY)
    }
  },

  /**
   * Revela uma pilula sem consumi-la (para itens de intel)
   */
  revealPillById: (pillId: string) => {
    const state = get()

    const pillIndex = state.pillPool.findIndex((p) => p.id === pillId)
    if (pillIndex === -1) return

    const newPillPool = [...state.pillPool]
    newPillPool[pillIndex] = revealPill(newPillPool[pillIndex])

    const revealAction: GameAction = {
      type: 'REVEAL_PILL',
      playerId: state.currentTurn,
      timestamp: Date.now(),
      payload: { pillId },
    }

    set({
      pillPool: newPillPool,
      actionHistory: [...state.actionHistory, revealAction],
    })
  },

  /**
   * Passa para o proximo turno manualmente
   */
  nextTurn: () => {
    const state = get()
    if (state.phase !== 'playing') return

    const nextTurn: PlayerId =
      state.currentTurn === 'player1' ? 'player2' : 'player1'

    set({ currentTurn: nextTurn })
  },

  /**
   * Inicia nova rodada (chamado apos fase roundEnding)
   */
  resetRound: () => {
    const state = get()
    // Aceita tanto 'playing' quanto 'roundEnding'
    if (state.phase !== 'playing' && state.phase !== 'roundEnding') return

    // Verifica se ambos jogadores ainda tem vidas
    const { player1, player2 } = state.players
    if (player1.lives <= 0 || player2.lives <= 0) {
      // Nao inicia nova rodada se alguem foi eliminado
      return
    }

    const newPillPool = generatePillPool(
      DEFAULT_GAME_CONFIG.pillsPerRound,
      PILL_CONFIG
    )
    const newTypeCounts = countPillTypes(newPillPool)

    const roundAction: GameAction = {
      type: 'NEW_ROUND',
      playerId: state.currentTurn,
      timestamp: Date.now(),
      payload: { round: state.round + 1 },
    }

    set({
      phase: 'playing', // Volta para playing
      pillPool: newPillPool,
      typeCounts: newTypeCounts,
      round: state.round + 1,
      actionHistory: [...state.actionHistory, roundAction],
    })
  },

  /**
   * Finaliza o jogo com um vencedor
   */
  endGame: (winnerId: PlayerId) => {
    const state = get()

    const endAction: GameAction = {
      type: 'GAME_END',
      playerId: winnerId,
      timestamp: Date.now(),
    }

    set({
      phase: 'ended',
      winner: winnerId,
      actionHistory: [...state.actionHistory, endAction],
    })
  },

  /**
   * Reseta o jogo para o estado inicial
   */
  resetGame: () => {
    set(initialState)
  },

  // ============ SELECTORS ============

  /**
   * Retorna o jogador do turno atual
   */
  getCurrentPlayer: () => {
    const state = get()
    return state.players[state.currentTurn]
  },

  /**
   * Retorna o oponente do turno atual
   */
  getOpponent: () => {
    const state = get()
    const opponentId: PlayerId =
      state.currentTurn === 'player1' ? 'player2' : 'player1'
    return state.players[opponentId]
  },

  /**
   * Busca uma pilula pelo ID
   */
  getPillById: (pillId: string) => {
    const state = get()
    return state.pillPool.find((p) => p.id === pillId)
  },

  /**
   * Verifica se o pool de pilulas esta vazio
   */
  isPillPoolEmpty: () => {
    const state = get()
    return state.pillPool.length === 0
  },

  /**
   * Calcula estatisticas do jogo
   */
  getGameStats: (): GameStats => {
    const state = get()

    const pillsConsumed = state.actionHistory.filter(
      (a) => a.type === 'CONSUME_PILL'
    ).length

    const pillsByType: Record<PillType, number> = {
      SAFE: 0,
      DMG_LOW: 0,
      DMG_HIGH: 0,
      FATAL: 0,
      HEAL: 0,
    }

    state.actionHistory
      .filter((a) => a.type === 'CONSUME_PILL')
      .forEach((a) => {
        const pillType = a.payload?.pillType as PillType
        if (pillType) pillsByType[pillType]++
      })

    const totalCollapses = state.actionHistory.filter(
      (a) => a.type === 'COLLAPSE'
    ).length

    const startTime =
      state.actionHistory.find((a) => a.type === 'GAME_START')?.timestamp ?? 0
    const endTime =
      state.actionHistory.find((a) => a.type === 'GAME_END')?.timestamp ??
      Date.now()

    return {
      totalRounds: state.round,
      pillsConsumed,
      pillsByType,
      totalCollapses,
      duration: endTime - startTime,
    }
  },
}))

// ============ HOOKS HELPERS ============

/**
 * Hook para selecionar apenas o jogador atual
 */
export const useCurrentPlayer = () =>
  useGameStore((state) => state.players[state.currentTurn])

/**
 * Hook para selecionar o oponente
 */
export const useOpponent = () =>
  useGameStore((state) => {
    const opponentId: PlayerId =
      state.currentTurn === 'player1' ? 'player2' : 'player1'
    return state.players[opponentId]
  })

/**
 * Hook para selecionar a fase do jogo
 */
export const useGamePhase = () => useGameStore((state) => state.phase)

/**
 * Hook para selecionar o pool de pilulas
 */
export const usePillPool = () => useGameStore((state) => state.pillPool)

/**
 * Hook para selecionar contagem de tipos
 */
export const useTypeCounts = () => useGameStore((state) => state.typeCounts)

