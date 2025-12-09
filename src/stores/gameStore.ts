import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type {
  GameAction,
  GameConfig,
  GameState,
  GameStats,
  InventoryItem,
  ItemType,
  Pill,
  PillType,
  Player,
  PlayerEffect,
  PlayerEffectType,
  PlayerId,
} from '@/types'
import { DEFAULT_GAME_CONFIG, ROUND_TRANSITION_DELAY } from '@/utils/constants'
import { applyPillEffect, applyHeal, createPlayer, hasPlayerEffect } from '@/utils/gameLogic'
import {
  countPillTypes,
  generatePillPool,
  revealPill,
} from '@/utils/pillGenerator'
import { countPillShapes } from '@/utils/shapeProgression'
import { ITEM_CATALOG } from '@/utils/itemCatalog'
import { POCKET_PILL_HEAL } from '@/utils/itemLogic'

/**
 * Interface do Store com estado e actions
 */
interface GameStore extends GameState {
  // Actions - Game Flow
  initGame: (config?: Partial<GameConfig>) => void
  consumePill: (pillId: string, options?: { forcedTarget?: PlayerId }) => void
  revealPillById: (pillId: string) => void
  nextTurn: () => void
  resetRound: () => void
  endGame: (winnerId: PlayerId) => void
  resetGame: () => void

  // Actions - Item Selection (pre-game)
  startItemSelectionPhase: () => void
  selectItem: (playerId: PlayerId, itemType: ItemType) => void
  deselectItem: (playerId: PlayerId, itemId: string) => void
  confirmItemSelection: (playerId: PlayerId) => void

  // Actions - Item Usage (during game)
  startItemUsage: (itemId: string) => void
  cancelItemUsage: () => void
  executeItem: (itemId: string, targetId?: string) => void
  removeItemFromInventory: (playerId: PlayerId, itemId: string) => void

  // Actions - Player Effects
  applyPlayerEffect: (playerId: PlayerId, effect: PlayerEffect) => void
  removePlayerEffect: (playerId: PlayerId, effectType: PlayerEffectType) => void
  decrementEffectRounds: (playerId: PlayerId) => void

  // Actions - Revealed Pills (Scanner)
  addRevealedPill: (pillId: string) => void
  removeRevealedPill: (pillId: string) => void
  clearRevealedPills: () => void

  // Actions - Pill Modifiers (Inverter/Double)
  invertPill: (pillId: string) => void
  doublePill: (pillId: string) => void
  clearPillModifiers: (pillId: string) => void

  // Selectors (computed)
  getCurrentPlayer: () => Player
  getOpponent: () => Player
  getPillById: (pillId: string) => Pill | undefined
  isPillPoolEmpty: () => boolean
  getGameStats: () => GameStats
}

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
 * Decrementa roundsRemaining dos efeitos do jogador e remove expirados
 * NOTA: Shield NAO e decrementado por turno - ele dura uma rodada inteira
 */
function decrementPlayerEffects(player: Player): Player {
  const updatedEffects = player.effects
    .map((effect) => {
      // Shield dura a rodada inteira, nao decrementa por turno
      if (effect.type === 'shield') {
        return effect
      }
      return {
        ...effect,
        roundsRemaining: effect.roundsRemaining - 1,
      }
    })
    .filter((effect) => effect.roundsRemaining > 0)

  return {
    ...player,
    effects: updatedEffects,
  }
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
    LIFE: 0,
  },
  shapeCounts: {
    round: 0,
    capsule: 0,
    oval: 0,
    triangle: 0,
    hexagon: 0,
  },
  round: 0,
  winner: null,
  actionHistory: [],
  // Item system
  targetSelection: {
    active: false,
    itemId: null,
    itemType: null,
    validTargets: null,
  },
  revealedPills: [],
  itemSelectionConfirmed: {
    player1: false,
    player2: false,
  },
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

    // Quantidade dinamica baseada na rodada (usa POOL_SCALING)
    const pillPool = generatePillPool(1)

    const typeCounts = countPillTypes(pillPool)
    const shapeCounts = countPillShapes(pillPool)

    const startAction: GameAction = {
      type: 'GAME_START',
      playerId: 'player1',
      timestamp: Date.now(),
      payload: { config: finalConfig },
    }

    set({
      phase: 'itemSelection',
      turnPhase: 'consume',
      currentTurn: 'player1',
      players: { player1, player2 },
      pillPool,
      typeCounts,
      shapeCounts,
      round: 0,
      winner: null,
      actionHistory: [startAction],
      // Reset item system state
      itemSelectionConfirmed: { player1: false, player2: false },
      targetSelection: initialState.targetSelection,
      revealedPills: [],
    })
  },

  /**
   * Consome uma pilula do pool
   * @param pillId - ID da pilula a consumir
   * @param options.forcedTarget - Se passado, aplica efeito nesse jogador (Force Feed)
   */
  consumePill: (pillId: string, options?: { forcedTarget?: PlayerId }) => {
    const state = get()

    // Validacoes
    if (state.phase !== 'playing') return
    if (state.pillPool.length === 0) return

    const pillIndex = state.pillPool.findIndex((p) => p.id === pillId)
    if (pillIndex === -1) return

    const pill = state.pillPool[pillIndex]

    // Determina quem consome: forcedTarget (Force Feed) ou currentTurn
    const isForced = !!options?.forcedTarget
    const consumerId = options?.forcedTarget ?? state.currentTurn
    const consumerPlayer = state.players[consumerId]

    // Revela a pilula
    const revealedPill = revealPill(pill)

    // Verifica se jogador que consome tem Shield ativo
    const playerHasShield = hasPlayerEffect(consumerPlayer, 'shield')

    // Aplica o efeito (com imunidade a dano se tiver Shield)
    const result = applyPillEffect(revealedPill, consumerPlayer, {
      hasShield: playerHasShield,
    })

    // Remove pilula do pool
    const newPillPool = state.pillPool.filter((p) => p.id !== pillId)
    const newTypeCounts = countPillTypes(newPillPool)
    const newShapeCounts = countPillShapes(newPillPool)

    // Registra acao
    const consumeAction: GameAction = {
      type: 'CONSUME_PILL',
      playerId: consumerId,
      timestamp: Date.now(),
      payload: {
        pillId,
        pillType: pill.type,
        damage: result.damageDealt,
        heal: result.healReceived,
        forced: isForced,
      },
    }

    const actions: GameAction[] = [consumeAction]

    // Registra colapso se houver
    if (result.collapsed) {
      actions.push({
        type: 'COLLAPSE',
        playerId: consumerId,
        timestamp: Date.now(),
      })
    }

    // Verifica eliminacao
    if (result.eliminated) {
      actions.push({
        type: 'ELIMINATE',
        playerId: consumerId,
        timestamp: Date.now(),
      })

      // Vencedor e o outro jogador
      const winnerId = consumerId === 'player1' ? 'player2' : 'player1'

      actions.push({
        type: 'GAME_END',
        playerId: winnerId,
        timestamp: Date.now(),
      })

      set({
        players: {
          ...state.players,
          [consumerId]: result.player,
        },
        pillPool: newPillPool,
        typeCounts: newTypeCounts,
        shapeCounts: newShapeCounts,
        phase: 'ended',
        winner: winnerId,
        actionHistory: [...state.actionHistory, ...actions],
      })
      return
    }

    // Atualiza jogador que consumiu com efeitos decrementados
    const updatedConsumer = decrementPlayerEffects(result.player)

    // Se foi forcado (Force Feed), NAO troca turno
    if (isForced) {
      set({
        players: {
          ...state.players,
          [consumerId]: updatedConsumer,
        },
        pillPool: newPillPool,
        typeCounts: newTypeCounts,
        shapeCounts: newShapeCounts,
        actionHistory: [...state.actionHistory, ...actions],
      })

      // Verifica se pool esvaziou
      if (newPillPool.length === 0) {
        set({ phase: 'roundEnding' })
        setTimeout(() => {
          get().resetRound()
        }, ROUND_TRANSITION_DELAY)
      }
      return
    }

    // Fluxo normal: determina proximo jogador
    const nextPlayerId: PlayerId =
      state.currentTurn === 'player1' ? 'player2' : 'player1'
    let nextPlayer = state.players[nextPlayerId]
    let actualNextTurn = nextPlayerId

    // Verifica se proximo jogador esta algemado (Handcuffs)
    if (hasPlayerEffect(nextPlayer, 'handcuffed')) {
      // Remove o efeito handcuffed e pula o turno (mantem turno atual)
      nextPlayer = {
        ...nextPlayer,
        effects: nextPlayer.effects.filter((e) => e.type !== 'handcuffed'),
      }
      actualNextTurn = state.currentTurn

      actions.push({
        type: 'SKIP_TURN',
        playerId: nextPlayerId,
        timestamp: Date.now(),
      })
    }

    set({
      players: {
        ...state.players,
        [consumerId]: updatedConsumer,
        [nextPlayerId]: nextPlayer,
      },
      pillPool: newPillPool,
      typeCounts: newTypeCounts,
      shapeCounts: newShapeCounts,
      currentTurn: actualNextTurn,
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

    // Remove efeitos de Shield (duram apenas 1 rodada)
    const player1WithoutShield: Player = {
      ...player1,
      effects: player1.effects.filter((e) => e.type !== 'shield'),
    }
    const player2WithoutShield: Player = {
      ...player2,
      effects: player2.effects.filter((e) => e.type !== 'shield'),
    }

    // Quantidade dinamica baseada na rodada (usa POOL_SCALING)
    const newPillPool = generatePillPool(state.round + 1)
    const newTypeCounts = countPillTypes(newPillPool)
    const newShapeCounts = countPillShapes(newPillPool)

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
      shapeCounts: newShapeCounts,
      round: state.round + 1,
      actionHistory: [...state.actionHistory, roundAction],
      revealedPills: [], // Limpa pilulas reveladas da rodada anterior
      players: {
        player1: player1WithoutShield,
        player2: player2WithoutShield,
      },
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

  // ============ ITEM SELECTION ACTIONS ============

  /**
   * Inicia a fase de selecao de itens
   */
  startItemSelectionPhase: () => {
    set({ phase: 'itemSelection' })
  },

  /**
   * Adiciona um item ao inventario do jogador
   */
  selectItem: (playerId: PlayerId, itemType: ItemType) => {
    const state = get()
    const player = state.players[playerId]

    // Verifica limite de itens
    if (player.inventory.items.length >= player.inventory.maxItems) {
      return
    }

    const newItem: InventoryItem = {
      id: uuidv4(),
      type: itemType,
    }

    set({
      players: {
        ...state.players,
        [playerId]: {
          ...player,
          inventory: {
            ...player.inventory,
            items: [...player.inventory.items, newItem],
          },
        },
      },
    })
  },

  /**
   * Remove um item do inventario do jogador
   */
  deselectItem: (playerId: PlayerId, itemId: string) => {
    const state = get()
    const player = state.players[playerId]

    set({
      players: {
        ...state.players,
        [playerId]: {
          ...player,
          inventory: {
            ...player.inventory,
            items: player.inventory.items.filter((item) => item.id !== itemId),
          },
        },
      },
    })
  },

  /**
   * Confirma a selecao de itens de um jogador
   * Quando ambos confirmarem, inicia o jogo
   */
  confirmItemSelection: (playerId: PlayerId) => {
    const state = get()

    // Verifica se estamos na fase correta
    if (state.phase !== 'itemSelection') return

    // Marca este jogador como confirmado
    const newConfirmed = {
      ...state.itemSelectionConfirmed,
      [playerId]: true,
    }

    // Se apenas este jogador confirmou, aguarda o outro
    if (!newConfirmed.player1 || !newConfirmed.player2) {
      set({ itemSelectionConfirmed: newConfirmed })
      return
    }

    // Ambos confirmaram - gera pilulas e inicia o jogo (rodada 1)
    const pillPool = generatePillPool(1)
    const typeCounts = countPillTypes(pillPool)
    const shapeCounts = countPillShapes(pillPool)

    const startAction: GameAction = {
      type: 'GAME_START',
      playerId,
      timestamp: Date.now(),
    }

    set({
      phase: 'playing',
      pillPool,
      typeCounts,
      shapeCounts,
      round: 1,
      itemSelectionConfirmed: newConfirmed,
      actionHistory: [...state.actionHistory, startAction],
    })
  },

  // ============ ITEM USAGE ACTIONS ============

  /**
   * Inicia o uso de um item (ativa modo de selecao de alvo se necessario)
   */
  startItemUsage: (itemId: string) => {
    const state = get()
    const currentPlayer = state.players[state.currentTurn]

    // Busca o item no inventario
    const item = currentPlayer.inventory.items.find((i) => i.id === itemId)
    if (!item) return

    // Busca definicao do item
    const itemDef = ITEM_CATALOG[item.type]
    if (!itemDef) return

    // Define os alvos validos baseado no tipo de item
    let validTargets: 'pills' | 'opponent' | null = null
    if (itemDef.targetType === 'pill' || itemDef.targetType === 'pill_to_opponent') {
      validTargets = 'pills'
    } else if (itemDef.targetType === 'opponent') {
      validTargets = 'opponent'
    }

    // Se item nao requer alvo (self, table, ou opponent que e automatico), executa imediatamente
    if (
      itemDef.targetType === 'self' ||
      itemDef.targetType === 'table' ||
      itemDef.targetType === 'opponent'
    ) {
      get().executeItem(itemId)
      return
    }

    // Ativa modo de selecao de alvo (apenas para pill e pill_to_opponent)
    set({
      targetSelection: {
        active: true,
        itemId,
        itemType: item.type,
        validTargets,
      },
    })
  },

  /**
   * Cancela o uso de um item (reseta targetSelection)
   */
  cancelItemUsage: () => {
    set({
      targetSelection: {
        active: false,
        itemId: null,
        itemType: null,
        validTargets: null,
      },
    })
  },

  /**
   * Executa o efeito de um item
   * @param itemId - ID do item a usar
   * @param targetId - ID do alvo (pillId ou opponentId, dependendo do item)
   */
  executeItem: (itemId: string, targetId?: string) => {
    const state = get()
    const currentPlayerId = state.currentTurn
    const currentPlayer = state.players[currentPlayerId]
    const opponentId: PlayerId = currentPlayerId === 'player1' ? 'player2' : 'player1'

    // Busca o item no inventario
    const item = currentPlayer.inventory.items.find((i) => i.id === itemId)
    if (!item) return

    const itemDef = ITEM_CATALOG[item.type]
    if (!itemDef) return

    // Registra acao no historico
    const useItemAction: GameAction = {
      type: 'USE_ITEM',
      playerId: currentPlayerId,
      timestamp: Date.now(),
      payload: {
        itemType: item.type,
        targetId,
      },
    }

    // Remove o item do inventario primeiro
    const updatedCurrentPlayer: Player = {
      ...currentPlayer,
      inventory: {
        ...currentPlayer.inventory,
        items: currentPlayer.inventory.items.filter((i) => i.id !== itemId),
      },
    }

    // Aplica efeito baseado no tipo de item
    let newState: Partial<GameState> = {
      players: {
        ...state.players,
        [currentPlayerId]: updatedCurrentPlayer,
      },
      targetSelection: {
        active: false,
        itemId: null,
        itemType: null,
        validTargets: null,
      },
      actionHistory: [...state.actionHistory, useItemAction],
    }

    switch (item.type) {
      // ========== INTEL ITEMS ==========

      case 'scanner': {
        // Revela o tipo da pilula temporariamente (adiciona a revealedPills)
        if (targetId && !state.revealedPills.includes(targetId)) {
          newState.revealedPills = [...state.revealedPills, targetId]
        }
        break
      }

      case 'inverter': {
        // Marca a pilula como invertida
        if (targetId) {
          const pillIndex = state.pillPool.findIndex((p) => p.id === targetId)
          if (pillIndex !== -1) {
            const newPillPool = [...state.pillPool]
            newPillPool[pillIndex] = {
              ...newPillPool[pillIndex],
              inverted: true,
            }
            newState.pillPool = newPillPool
          }
        }
        break
      }

      case 'double': {
        // Marca a pilula como dobrada
        if (targetId) {
          const pillIndex = state.pillPool.findIndex((p) => p.id === targetId)
          if (pillIndex !== -1) {
            const newPillPool = [...state.pillPool]
            newPillPool[pillIndex] = {
              ...newPillPool[pillIndex],
              doubled: true,
            }
            newState.pillPool = newPillPool
          }
        }
        break
      }

      // ========== SUSTAIN ITEMS ==========

      case 'pocket_pill': {
        // Cura +4 resistencia no jogador atual
        const healResult = applyHeal(updatedCurrentPlayer, POCKET_PILL_HEAL)
        newState.players = {
          ...state.players,
          [currentPlayerId]: healResult.player,
        }
        break
      }

      case 'shield': {
        // Adiciona efeito de shield ao jogador atual
        const hasShieldAlready = updatedCurrentPlayer.effects.some((e) => e.type === 'shield')
        if (!hasShieldAlready) {
          const playerWithShield: Player = {
            ...updatedCurrentPlayer,
            effects: [
              ...updatedCurrentPlayer.effects,
              { type: 'shield', roundsRemaining: 1 }, // 1 rodada de duracao
            ],
          }
          newState.players = {
            ...state.players,
            [currentPlayerId]: playerWithShield,
          }
        }
        break
      }

      // ========== CONTROL ITEMS ==========

      case 'handcuffs': {
        // Adiciona efeito de handcuffed ao oponente (se nao tiver shield)
        const opponent = state.players[opponentId]
        const opponentHasShield = opponent.effects.some((e) => e.type === 'shield')

        if (!opponentHasShield) {
          const hasHandcuffsAlready = opponent.effects.some((e) => e.type === 'handcuffed')
          if (!hasHandcuffsAlready) {
            const opponentWithHandcuffs: Player = {
              ...opponent,
              effects: [
                ...opponent.effects,
                { type: 'handcuffed', roundsRemaining: 1 },
              ],
            }
            const currentPlayers = newState.players ?? state.players
            newState.players = {
              ...currentPlayers,
              [opponentId]: opponentWithHandcuffs,
            }
          }
        }
        break
      }

      case 'force_feed': {
        // Force Feed: apenas remove o item e armazena info do alvo
        // O consumo real e delegado ao GameBoard que chama startConsumption com forcedTarget
        // Isso garante que o PillReveal overlay seja exibido corretamente
        // Nota: targetId contem o pillId, opponentId e calculado no GameBoard
        break
      }

      // ========== CHAOS ITEMS ==========

      case 'shuffle': {
        // Embaralha as pilulas da mesa
        const shuffledPillPool = shuffleArray([...state.pillPool])
        newState.pillPool = shuffledPillPool
        break
      }

      case 'discard': {
        // Remove pilula sem ativar efeito
        if (targetId) {
          const newPillPool = state.pillPool.filter((p) => p.id !== targetId)
          const newTypeCounts = countPillTypes(newPillPool)
          const newShapeCounts = countPillShapes(newPillPool)
          newState.pillPool = newPillPool
          newState.typeCounts = newTypeCounts
          newState.shapeCounts = newShapeCounts

          // Remove da lista de reveladas tambem
          newState.revealedPills = state.revealedPills.filter((id) => id !== targetId)

          // Verifica se pool esvaziou - inicia transicao de rodada
          if (newPillPool.length === 0) {
            newState.phase = 'roundEnding'
            setTimeout(() => {
              get().resetRound()
            }, ROUND_TRANSITION_DELAY)
          }
        }
        break
      }
    }

    set(newState)
  },

  /**
   * Remove um item do inventario do jogador
   */
  removeItemFromInventory: (playerId: PlayerId, itemId: string) => {
    const state = get()
    const player = state.players[playerId]

    set({
      players: {
        ...state.players,
        [playerId]: {
          ...player,
          inventory: {
            ...player.inventory,
            items: player.inventory.items.filter((i) => i.id !== itemId),
          },
        },
      },
    })
  },

  // ============ PLAYER EFFECTS ACTIONS ============

  /**
   * Aplica um efeito a um jogador (ex: Shield, Handcuffs)
   * Se o jogador ja tiver um efeito do mesmo tipo, nao adiciona duplicata
   */
  applyPlayerEffect: (playerId: PlayerId, effect: PlayerEffect) => {
    const state = get()
    const player = state.players[playerId]

    // Verifica se ja tem efeito do mesmo tipo
    const hasEffect = player.effects.some((e) => e.type === effect.type)
    if (hasEffect) return

    set({
      players: {
        ...state.players,
        [playerId]: {
          ...player,
          effects: [...player.effects, effect],
        },
      },
    })
  },

  /**
   * Remove um tipo especifico de efeito do jogador
   */
  removePlayerEffect: (playerId: PlayerId, effectType: PlayerEffectType) => {
    const state = get()
    const player = state.players[playerId]

    set({
      players: {
        ...state.players,
        [playerId]: {
          ...player,
          effects: player.effects.filter((e) => e.type !== effectType),
        },
      },
    })
  },

  /**
   * Decrementa as rodadas restantes de todos os efeitos do jogador
   * Remove automaticamente efeitos que chegam a 0 rodadas
   */
  decrementEffectRounds: (playerId: PlayerId) => {
    const state = get()
    const player = state.players[playerId]

    const updatedEffects = player.effects
      .map((effect) => ({
        ...effect,
        roundsRemaining: effect.roundsRemaining - 1,
      }))
      .filter((effect) => effect.roundsRemaining > 0)

    set({
      players: {
        ...state.players,
        [playerId]: {
          ...player,
          effects: updatedEffects,
        },
      },
    })
  },

  // ============ REVEALED PILLS ACTIONS ============

  /**
   * Adiciona uma pilula a lista de reveladas (usado pelo Scanner)
   */
  addRevealedPill: (pillId: string) => {
    const state = get()

    // Evita duplicatas
    if (state.revealedPills.includes(pillId)) return

    set({
      revealedPills: [...state.revealedPills, pillId],
    })
  },

  /**
   * Remove uma pilula da lista de reveladas
   */
  removeRevealedPill: (pillId: string) => {
    const state = get()

    set({
      revealedPills: state.revealedPills.filter((id) => id !== pillId),
    })
  },

  /**
   * Limpa todas as pilulas reveladas (usado ao iniciar nova rodada)
   */
  clearRevealedPills: () => {
    set({ revealedPills: [] })
  },

  // ============ PILL MODIFIERS ACTIONS ============

  /**
   * Marca uma pilula como invertida (dano vira cura, cura vira dano)
   * Usado pelo item Inverter
   */
  invertPill: (pillId: string) => {
    const state = get()
    const pillIndex = state.pillPool.findIndex((p) => p.id === pillId)
    if (pillIndex === -1) return

    const newPillPool = [...state.pillPool]
    newPillPool[pillIndex] = {
      ...newPillPool[pillIndex],
      inverted: true,
    }

    set({ pillPool: newPillPool })
  },

  /**
   * Marca uma pilula como dobrada (efeito x2)
   * Usado pelo item Double
   */
  doublePill: (pillId: string) => {
    const state = get()
    const pillIndex = state.pillPool.findIndex((p) => p.id === pillId)
    if (pillIndex === -1) return

    const newPillPool = [...state.pillPool]
    newPillPool[pillIndex] = {
      ...newPillPool[pillIndex],
      doubled: true,
    }

    set({ pillPool: newPillPool })
  },

  /**
   * Remove todos os modificadores de uma pilula
   */
  clearPillModifiers: (pillId: string) => {
    const state = get()
    const pillIndex = state.pillPool.findIndex((p) => p.id === pillId)
    if (pillIndex === -1) return

    const newPillPool = [...state.pillPool]
    newPillPool[pillIndex] = {
      ...newPillPool[pillIndex],
      inverted: false,
      doubled: false,
    }

    set({ pillPool: newPillPool })
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
      LIFE: 0,
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

