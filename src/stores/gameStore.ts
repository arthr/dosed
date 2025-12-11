import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type {
  DifficultyLevel,
  GameAction,
  GameConfig,
  GameEvent,
  GameState,
  GameStats,
  InventoryItem,
  ItemType,
  MultiplayerEventEmit,
  Pill,
  PillType,
  Player,
  PlayerEffect,
  PlayerEffectType,
  PlayerId,
  ShapeQuest,
} from '@/types'
import { DEFAULT_GAME_CONFIG, ROUND_TRANSITION_DELAY } from '@/utils/constants'
import { useEffectsStore } from '@/stores/game/effectsStore'
import { usePillPoolStore } from '@/stores/game/pillPoolStore'
import { usePlayerStore } from '@/stores/game/playerStore'
import { useItemUsageStore } from '@/stores/game/itemUsageStore'
import { useShopStore } from '@/stores/game/shopStore'
import { useGameFlowStore } from '@/stores/game/gameFlowStore'
import { applyPillEffect, applyHeal, createPlayer, hasPlayerEffect } from '@/utils/gameLogic'
import {
  countPillTypes,
  generatePillPool,
  revealPill,
} from '@/utils/pillGenerator'
import { countPillShapes } from '@/utils/shapeProgression'
import { ITEM_CATALOG } from '@/utils/itemCatalog'
import { POCKET_PILL_HEAL } from '@/utils/itemLogic'
import { generateShapeQuest, checkQuestProgress } from '@/utils/questGenerator'
import { DEFAULT_STORE_CONFIG, getStoreItemById } from '@/utils/storeConfig'
import { useToastStore } from '@/stores/toastStore'

// ============ MULTIPLAYER SYNC ============

/**
 * Flag para evitar loop de sincronizacao
 * Quando true, acoes NAO emitem eventos (estao sendo aplicadas de fonte remota)
 */
let isSyncingFromRemote = false

/**
 * Define flag de sincronizacao remota
 * Usado pelo multiplayerStore ao aplicar eventos recebidos
 */
export function setSyncingFromRemote(value: boolean): void {
  isSyncingFromRemote = value
}

/**
 * Retorna se esta sincronizando de fonte remota
 */
export function getIsSyncingFromRemote(): boolean {
  return isSyncingFromRemote
}

/**
 * Emite evento para multiplayer se aplicavel
 * Verifica modo e flag de sync antes de emitir
 * Usa import dinamico para evitar dependencia circular
 * Funcao sincrona que agenda emissao - erros sao logados mas nao propagados
 */
function emitMultiplayerEvent(
  mode: string,
  event: MultiplayerEventEmit
): void {
  // Nao emite se nao for multiplayer ou se estiver sincronizando de fonte remota
  if (mode !== 'multiplayer' || isSyncingFromRemote) {
    return
  }

  // Import dinamico para evitar dependencia circular
  // Agenda emissao de forma assincrona com tratamento de erro
  import('@/stores/multiplayerStore')
    .then(({ useMultiplayerStore }) => {
      const multiplayerStore = useMultiplayerStore.getState()
      multiplayerStore.sendEvent({
        type: event.type as Parameters<typeof multiplayerStore.sendEvent>[0]['type'],
        payload: event.payload,
      })
    })
    .catch((err) => {
      console.error('[GameStore] Erro ao emitir evento multiplayer:', err, {
        type: event.type,
        payload: event.payload,
      })
    })
}

/**
 * Interface do Store com estado e actions
 */
interface GameStore extends GameState {
  // Actions - Game Flow
  initGame: (config?: Partial<GameConfig>) => void
  consumePill: (pillId: string, options?: { forcedTarget?: PlayerId }) => void
  revealPillById: (pillId: string) => void
  nextTurn: () => void
  resetRound: (syncData?: { pillPool: Pill[]; shapeQuests: Record<PlayerId, ShapeQuest | null> }) => void
  endGame: (winnerId: PlayerId) => void
  resetGame: () => void

  // Actions - Item Selection (pre-game)
  startItemSelectionPhase: () => void
  selectItem: (playerId: PlayerId, itemType: ItemType, itemId?: string) => void
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

  // Actions - Pill Store
  toggleWantsStore: (playerId: PlayerId) => void
  checkAndStartShopping: () => void
  addToCart: (playerId: PlayerId, itemId: string) => void
  removeFromCart: (playerId: PlayerId, itemId: string) => void
  processCart: (playerId: PlayerId, itemIds?: string[]) => string[]
  /** @deprecated Use addToCart/removeFromCart */
  purchaseStoreItem: (playerId: PlayerId, itemId: string) => void
  confirmStorePurchases: (playerId: PlayerId, itemIds?: string[]) => void
  checkShoppingComplete: () => void
  applyPendingBoosts: () => void

  // Actions - Multiplayer Sync
  applyRemoteEvent: (event: GameEvent) => void

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
  difficulty: 'normal' as DifficultyLevel,
  mode: 'single_player',
  roomId: null,
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
    capsule: 0,
    round: 0,
    triangle: 0,
    oval: 0,
    cross: 0,
    heart: 0,
    flower: 0,
    star: 0,
    pumpkin: 0,
    coin: 0,
    bear: 0,
    gem: 0,
    skull: 0,
    domino: 0,
    pineapple: 0,
    fruit: 0,
  },
  shapeQuests: {
    player1: null,
    player2: null,
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
  storeState: null,
  lastQuestReset: null,
  revealAtStart: {
    player1: 0,
    player2: 0,
  },
}

/**
 * Zustand Store para gerenciamento do estado do jogo
 */
export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  /**
   * Inicializa um novo jogo com configuracao
   * Em multiplayer, o guest recebe syncData do host para garantir estado identico
   * @delegate Inicializa todos os stores modulares
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

    // Em multiplayer com syncData (guest), usa dados do host
    // Caso contrario (host ou single player), gera localmente
    let pillPool: Pill[]
    let shapeQuests: Record<PlayerId, ShapeQuest | null>

    if (finalConfig.syncData) {
      // Guest: usa dados sincronizados do host
      pillPool = finalConfig.syncData.pillPool
      shapeQuests = finalConfig.syncData.shapeQuests
      console.log('[GameStore] Usando dados sincronizados do host')
    } else {
      // Host ou single player: gera localmente
      pillPool = generatePillPool(1)
      const shapeCounts = countPillShapes(pillPool)
      shapeQuests = {
        player1: generateShapeQuest(1, shapeCounts),
        player2: generateShapeQuest(1, shapeCounts),
      }
    }

    const typeCounts = countPillTypes(pillPool)
    const shapeCounts = countPillShapes(pillPool)

    // Inicializa stores modulares
    const playerIds: PlayerId[] = ['player1', 'player2']

    useEffectsStore.getState().initializeForPlayers(playerIds)
    useItemUsageStore.getState().initializeForPlayers(playerIds)
    usePillPoolStore.getState().setPool(pillPool)
    useGameFlowStore.getState().initialize(playerIds, {
      difficulty: finalConfig.difficulty,
      mode: finalConfig.mode,
      roomId: finalConfig.roomId ?? null,
    })

    const startAction: GameAction = {
      type: 'GAME_START',
      playerId: 'player1',
      timestamp: Date.now(),
      payload: { config: finalConfig },
    }

    // DUAL-WRITE: Sync local state
    set({
      phase: 'itemSelection',
      turnPhase: 'consume',
      currentTurn: 'player1',
      difficulty: finalConfig.difficulty,
      mode: finalConfig.mode,
      roomId: finalConfig.roomId ?? null,
      players: { player1, player2 },
      pillPool,
      typeCounts,
      shapeCounts,
      shapeQuests,
      round: 0,
      winner: null,
      actionHistory: [startAction],
      // Reset item system state
      itemSelectionConfirmed: { player1: false, player2: false },
      targetSelection: initialState.targetSelection,
      revealedPills: [],
      storeState: null,
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

    // Determina tipo de efeito para feedback visual remoto
    const getEffectType = (): 'damage' | 'heal' | 'safe' | 'collapse' | 'fatal' => {
      if (result.eliminated) return 'fatal'
      if (result.collapsed) return 'collapse'
      if (result.damageDealt > 0) return 'damage'
      if (result.healReceived > 0) return 'heal'
      return 'safe'
    }

    // Emite evento multiplayer com dados de feedback para UI remota
    emitMultiplayerEvent(state.mode, {
      type: 'pill_consumed',
      payload: {
        pillId,
        forcedTarget: options?.forcedTarget,
        feedback: {
          pillType: revealedPill.type,
          effectType: getEffectType(),
          effectValue: result.damageDealt || result.healReceived,
          consumerId,
        },
      },
    })

    // Delega para pillPoolStore
    usePillPoolStore.getState().consumePill(pillId)

    // DUAL-WRITE: Sync local state
    const newPillPool = state.pillPool.filter((p) => p.id !== pillId)
    const newTypeCounts = countPillTypes(newPillPool)
    const newShapeCounts = countPillShapes(newPillPool)

    // Verifica progresso do quest do jogador que consumiu
    const consumedShape = pill.visuals.shape
    const currentQuest = state.shapeQuests[consumerId]
    let newShapeQuests = { ...state.shapeQuests }
    let earnedPillCoin = false
    let questWasReset = false

    if (currentQuest && !currentQuest.completed) {
      const { updatedQuest, justCompleted, wasReset } = checkQuestProgress(currentQuest, consumedShape)
      newShapeQuests[consumerId] = updatedQuest
      earnedPillCoin = justCompleted
      questWasReset = wasReset
    }

    // Toast de feedback do quest (apos pequeno delay para nao sobrepor toast da pilula)
    // Nota: desativado temporariamente para nao sobrepor toast da pilula
    // Já existe animação de shake quando o quest é resetado + feedback com texto `Reset`
    // if (questWasReset) {
    //   setTimeout(() => {
    //     useToastStore.getState().show({
    //       type: 'quest',
    //       message: 'Sequencia reiniciada!',
    //       playerId: consumerId,
    //       duration: 1200,
    //     })
    //   }, 800)
    // }

    // Toast de celebracao quando completar quest
    // Nota: desativado temporariamente para nao sobrepor toast da pilula
    // TODO: Implementar uma animação mais polida para representar o ganho de Pill Coin
    // if (earnedPillCoin) {
    //   setTimeout(() => {
    //     useToastStore.getState().show({
    //       type: 'quest',
    //       message: '+1 Pill Coin!',
    //       playerId: consumerId,
    //       duration: 2000,
    //     })
    //   }, 800)
    // }

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

      // Atualiza pillCoins se completou quest (mesmo sendo eliminado)
      const eliminatedPlayer: Player = earnedPillCoin
        ? { ...result.player, pillCoins: result.player.pillCoins + 1 }
        : result.player

      set({
        players: {
          ...state.players,
          [consumerId]: eliminatedPlayer,
        },
        pillPool: newPillPool,
        typeCounts: newTypeCounts,
        shapeCounts: newShapeCounts,
        shapeQuests: newShapeQuests,
        phase: 'ended',
        winner: winnerId,
        actionHistory: [...state.actionHistory, ...actions],
        lastQuestReset: questWasReset ? { playerId: consumerId, timestamp: Date.now() } : null,
      })
      return
    }

    // Atualiza jogador que consumiu com efeitos decrementados e pillCoins
    // DUAL-WRITE: Decrementa effects no effectsStore
    useEffectsStore.getState().decrementEffects(consumerId)

    let updatedConsumer = decrementPlayerEffects(result.player)
    if (earnedPillCoin) {
      updatedConsumer = { ...updatedConsumer, pillCoins: updatedConsumer.pillCoins + 1 }
    }

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
        shapeQuests: newShapeQuests,
        actionHistory: [...state.actionHistory, ...actions],
        lastQuestReset: questWasReset ? { playerId: consumerId, timestamp: Date.now() } : null,
      })

      // Verifica se pool esvaziou
      if (newPillPool.length === 0) {
        set({ phase: 'roundEnding' })
        setTimeout(() => {
          get().checkAndStartShopping()
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
      // DUAL-WRITE: Remove handcuffed do effectsStore
      useEffectsStore.getState().removeEffect(nextPlayerId, 'handcuffed')

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
      shapeQuests: newShapeQuests,
      currentTurn: actualNextTurn,
      actionHistory: [...state.actionHistory, ...actions],
      lastQuestReset: questWasReset ? { playerId: consumerId, timestamp: Date.now() } : null,
    })

    // Verifica se pool esvaziou - inicia fase de transicao
    if (newPillPool.length === 0) {
      // Muda para fase roundEnding
      set({ phase: 'roundEnding' })

      // Apos delay, verifica se alguem quer ir a loja
      setTimeout(() => {
        get().checkAndStartShopping()
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
   * @delegate gameFlowStore.nextTurn
   */
  nextTurn: () => {
    const state = get()
    if (state.phase !== 'playing') return

    // Delega para gameFlowStore (usa getNextTurn que suporta N jogadores)
    const alivePlayers = Object.keys(state.players).filter(
      (id) => state.players[id as PlayerId].lives > 0
    ) as PlayerId[]
    const nextPlayer = useGameFlowStore.getState().nextTurn(alivePlayers)

    // DUAL-WRITE: Sync local state para retrocompatibilidade
    set({ currentTurn: nextPlayer })
  },

  /**
   * Inicia nova rodada (chamado apos fase roundEnding)
   * Em multiplayer, apenas host gera dados e emite evento para sincronizar
   * Guest deve chamar com syncData recebido via evento round_reset
   * @param syncData - Dados sincronizados (apenas guest em multiplayer)
   * @delegate effectsStore.removeEffectFromAll + pillPoolStore.setPool
   */
  resetRound: (syncData?: { pillPool: Pill[]; shapeQuests: Record<PlayerId, ShapeQuest | null> }) => {
    const state = get()
    // Aceita tanto 'playing' quanto 'roundEnding' quanto 'shopping'
    if (state.phase !== 'playing' && state.phase !== 'roundEnding' && state.phase !== 'shopping') return

    // Verifica se ambos jogadores ainda tem vidas
    const { player1, player2 } = state.players
    if (player1.lives <= 0 || player2.lives <= 0) {
      // Nao inicia nova rodada se alguem foi eliminado
      return
    }

    // Delega para effectsStore
    useEffectsStore.getState().removeEffectFromAll('shield')

    // DUAL-WRITE: Sync local state
    const player1Updated: Player = {
      ...player1,
      effects: player1.effects.filter((e) => e.type !== 'shield'),
      wantsStore: false,
    }
    const player2Updated: Player = {
      ...player2,
      effects: player2.effects.filter((e) => e.type !== 'shield'),
      wantsStore: false,
    }

    const newRound = state.round + 1

    // Em multiplayer com syncData (guest), usa dados do host
    // Caso contrario (host ou single player), gera localmente
    let newPillPool: Pill[]
    let newShapeQuests: Record<PlayerId, ShapeQuest | null>

    if (syncData) {
      // Guest: usa dados sincronizados do host
      newPillPool = syncData.pillPool
      newShapeQuests = syncData.shapeQuests
      console.log('[GameStore] resetRound: usando dados sincronizados do host')
    } else {
      // Host ou single player: gera localmente
      newPillPool = generatePillPool(newRound)
      const newShapeCounts = countPillShapes(newPillPool)
      newShapeQuests = {
        player1: generateShapeQuest(newRound, newShapeCounts),
        player2: generateShapeQuest(newRound, newShapeCounts),
      }

      // Em multiplayer (host), emite evento para sincronizar com guest
      if (state.mode === 'multiplayer') {
        emitMultiplayerEvent(state.mode, {
          type: 'round_reset',
          payload: {
            roundNumber: newRound,
            syncData: {
              pillPool: newPillPool,
              shapeQuests: newShapeQuests,
            },
          },
        })
      }
    }

    const newTypeCounts = countPillTypes(newPillPool)
    const newShapeCounts = countPillShapes(newPillPool)

    // Delega para pillPoolStore
    usePillPoolStore.getState().setPool(newPillPool)

    // Aplica revealAtStart - revela pills automaticamente para quem comprou Scanner-2X
    const { revealAtStart } = state
    const pillsToReveal: string[] = []

    // Calcula total de pills a revelar (soma de ambos jogadores)
    const totalToReveal = revealAtStart.player1 + revealAtStart.player2

    if (totalToReveal > 0 && newPillPool.length > 0) {
      // Seleciona pills aleatorias para revelar
      const shuffledPillIds = shuffleArray(newPillPool.map((p) => p.id))
      const revealCount = Math.min(totalToReveal, shuffledPillIds.length)
      for (let i = 0; i < revealCount; i++) {
        pillsToReveal.push(shuffledPillIds[i])
      }
    }

    // Delega revealed pills para pillPoolStore
    usePillPoolStore.getState().clearRevealedPills()
    pillsToReveal.forEach((pillId) => {
      usePillPoolStore.getState().addRevealedPill(pillId)
    })

    const roundAction: GameAction = {
      type: 'NEW_ROUND',
      playerId: state.currentTurn,
      timestamp: Date.now(),
      payload: { round: newRound },
    }

    // DUAL-WRITE: Sync local state
    set({
      phase: 'playing', // Volta para playing
      pillPool: newPillPool,
      typeCounts: newTypeCounts,
      shapeCounts: newShapeCounts,
      shapeQuests: newShapeQuests,
      round: newRound,
      actionHistory: [...state.actionHistory, roundAction],
      revealedPills: pillsToReveal, // Pills reveladas automaticamente
      storeState: null, // Limpa estado da loja
      revealAtStart: { player1: 0, player2: 0 }, // Reseta flag
      players: {
        player1: player1Updated,
        player2: player2Updated,
      },
    })
  },

  /**
   * Finaliza o jogo com um vencedor
   * @delegate gameFlowStore.endGame
   */
  endGame: (winnerId: PlayerId) => {
    // Delega para gameFlowStore
    useGameFlowStore.getState().endGame(winnerId)

    // DUAL-WRITE: Sync local state para retrocompatibilidade
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
   * @delegate Todos os stores modulares
   */
  resetGame: () => {
    // Reseta todos os stores modulares
    useEffectsStore.getState().reset()
    useShopStore.getState().reset()
    usePillPoolStore.getState().reset()
    useItemUsageStore.getState().reset()
    useGameFlowStore.getState().reset()

    // Reseta estado local
    set(initialState)
  },

  // ============ ITEM SELECTION ACTIONS ============

  /**
   * Inicia a fase de selecao de itens
   * @delegate gameFlowStore.startItemSelection
   */
  startItemSelectionPhase: () => {
    // Delega para gameFlowStore
    useGameFlowStore.getState().startItemSelection()

    // DUAL-WRITE: Sync local state para retrocompatibilidade
    set({ phase: 'itemSelection' })
  },

  /**
   * Adiciona um item ao inventario do jogador
   * @param playerId - ID do jogador
   * @param itemType - Tipo do item
   * @param itemId - ID do item (opcional, usado para sincronizacao multiplayer)
   */
  selectItem: (playerId: PlayerId, itemType: ItemType, itemId?: string) => {
    const state = get()
    const player = state.players[playerId]

    // Verifica limite de itens
    if (player.inventory.items.length >= player.inventory.maxItems) {
      return
    }

    // Usa itemId fornecido (evento remoto) ou gera novo (local)
    const newItemId = itemId ?? uuidv4()

    // NOTA: NAO delegar para playerStore aqui - ele nao esta inicializado
    // durante a fase itemSelection (antes do jogo comecar)
    const newItem: InventoryItem = {
      id: newItemId,
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

    // Emite evento multiplayer (apenas se nao for evento remoto)
    if (!itemId) {
      emitMultiplayerEvent(state.mode, {
        type: 'item_selected',
        payload: { itemType, itemId: newItemId },
      })
    }
  },

  /**
   * Remove um item do inventario do jogador (pre-game)
   * NOTA: NAO delega para playerStore - ele nao esta inicializado durante itemSelection
   */
  deselectItem: (playerId: PlayerId, itemId: string) => {
    const state = get()
    const player = state.players[playerId]
    if (!player) return
    
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

    // Emite evento multiplayer
    emitMultiplayerEvent(state.mode, {
      type: 'item_deselected',
      payload: { itemId },
    })
  },

  /**
   * Confirma a selecao de itens de um jogador
   * Quando ambos confirmarem, inicia o jogo
   * @delegate itemUsageStore.confirmSelection + gameFlowStore.startGame
   */
  confirmItemSelection: (playerId: PlayerId) => {
    const state = get()

    // Verifica se estamos na fase correta
    if (state.phase !== 'itemSelection') return

    // Emite evento multiplayer (antes de aplicar)
    emitMultiplayerEvent(state.mode, {
      type: 'selection_confirmed',
    })

    // Delega para itemUsageStore
    useItemUsageStore.getState().confirmSelection(playerId)

    // DUAL-WRITE: Sync local state
    const newConfirmed = {
      ...state.itemSelectionConfirmed,
      [playerId]: true,
    }

    // Se apenas este jogador confirmou, aguarda o outro
    // TODO: Usar itemUsageStore.isAllConfirmed() quando initializeForPlayers for integrado (Batch 3.1)
    if (!newConfirmed.player1 || !newConfirmed.player2) {
      set({ itemSelectionConfirmed: newConfirmed })
      return
    }

    // Ambos confirmaram - delega para gameFlowStore
    useGameFlowStore.getState().startGame()

    // DUAL-WRITE: Sync local state
    const startAction: GameAction = {
      type: 'GAME_START',
      playerId,
      timestamp: Date.now(),
    }

    set({
      phase: 'playing',
      round: 1,
      itemSelectionConfirmed: newConfirmed,
      actionHistory: [...state.actionHistory, startAction],
    })
  },

  // ============ ITEM USAGE ACTIONS ============
  // Gradualmente delegando para itemUsageStore

  /**
   * Inicia o uso de um item (ativa modo de selecao de alvo se necessario)
   * @delegate itemUsageStore.startItemUsage (parcial)
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

    // Se item nao requer alvo (self, table, ou opponent que e automatico), executa imediatamente
    if (
      itemDef.targetType === 'self' ||
      itemDef.targetType === 'table' ||
      itemDef.targetType === 'opponent'
    ) {
      get().executeItem(itemId)
      return
    }

    // Delega para itemUsageStore (para itens que requerem alvo)
    useItemUsageStore.getState().startItemUsage(itemId, item.type, itemDef.targetType)

    // Sync local state para retrocompatibilidade
    let validTargets: 'pills' | 'opponent' | null = null
    if (itemDef.targetType === 'pill' || itemDef.targetType === 'pill_to_opponent') {
      validTargets = 'pills'
    } else if (itemDef.targetType === 'opponent') {
      validTargets = 'opponent'
    }
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
   * @delegate itemUsageStore.cancelItemUsage
   */
  cancelItemUsage: () => {
    // Delega para itemUsageStore
    useItemUsageStore.getState().cancelItemUsage()
    
    // Sync local state para retrocompatibilidade
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

    // Emite evento multiplayer (antes de aplicar) com itemType para feedback remoto
    emitMultiplayerEvent(state.mode, {
      type: 'item_used',
      payload: {
        itemId,
        targetId,
        itemType: item.type,
      },
    })

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
          // Delega para pillPoolStore
          usePillPoolStore.getState().addRevealedPill(targetId)
          // DUAL-WRITE: Sync local state
          newState.revealedPills = [...state.revealedPills, targetId]
        }
        break
      }

      case 'inverter': {
        // Marca a pilula como invertida
        if (targetId) {
          // Delega para pillPoolStore
          usePillPoolStore.getState().invertPill(targetId)
          // DUAL-WRITE: Sync local state
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
          // Delega para pillPoolStore
          usePillPoolStore.getState().doublePill(targetId)
          // DUAL-WRITE: Sync local state
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
          // DUAL-WRITE: Adiciona shield no effectsStore
          useEffectsStore.getState().applyEffect(currentPlayerId, { type: 'shield', roundsRemaining: 1 })

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
            // DUAL-WRITE: Adiciona handcuffs no effectsStore
            useEffectsStore.getState().applyEffect(opponentId, { type: 'handcuffed', roundsRemaining: 1 })

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
              get().checkAndStartShopping()
            }, ROUND_TRANSITION_DELAY)
          }
        }
        break
      }

      case 'shape_bomb': {
        // Shape Bomb: remove TODAS pilulas da mesma shape da pill selecionada
        if (targetId) {
          const targetPill = state.pillPool.find((p) => p.id === targetId)
          if (!targetPill) break

          const targetShape = targetPill.visuals.shape
          const removedCount = state.pillPool.filter((p) => p.visuals.shape === targetShape).length
          const newPillPool = state.pillPool.filter((p) => p.visuals.shape !== targetShape)
          const newTypeCounts = countPillTypes(newPillPool)
          const newShapeCounts = countPillShapes(newPillPool)

          newState.pillPool = newPillPool
          newState.typeCounts = newTypeCounts
          newState.shapeCounts = newShapeCounts

          // Remove pills dessa shape da lista de reveladas
          const removedPillIds = state.pillPool
            .filter((p) => p.visuals.shape === targetShape)
            .map((p) => p.id)
          newState.revealedPills = state.revealedPills.filter((id) => !removedPillIds.includes(id))

          // Toast com feedback
          const toastStore = useToastStore.getState()
          toastStore.show({
            message: `Shape Bomb! ${removedCount} pilulas eliminadas`,
            type: 'item',
            playerId: currentPlayerId,
          })

          // Verifica se pool esvaziou - inicia transicao de rodada
          if (newPillPool.length === 0) {
            newState.phase = 'roundEnding'
            setTimeout(() => {
              get().checkAndStartShopping()
            }, ROUND_TRANSITION_DELAY)
          }
        }
        break
      }

      case 'shape_scanner': {
        // Shape Scanner: revela TODAS pilulas da mesma shape da pill selecionada
        if (targetId) {
          const targetPill = state.pillPool.find((p) => p.id === targetId)
          if (!targetPill) break

          const targetShape = targetPill.visuals.shape

          // Encontra todas pills dessa shape e adiciona aos revelados
          const pillsToReveal = state.pillPool
            .filter((p) => p.visuals.shape === targetShape)
            .map((p) => p.id)
            .filter((id) => !state.revealedPills.includes(id)) // Evita duplicatas

          // Delega para pillPoolStore
          pillsToReveal.forEach((pillId) => {
            usePillPoolStore.getState().addRevealedPill(pillId)
          })

          // DUAL-WRITE: Sync local state
          const revealedCount = pillsToReveal.length
          newState.revealedPills = [...state.revealedPills, ...pillsToReveal]

          // Toast com feedback
          const toastStore = useToastStore.getState()
          toastStore.show({
            message: `Shape Scanner! ${revealedCount} pilulas reveladas`,
            type: 'item',
            playerId: currentPlayerId,
          })
        }
        break
      }
    }

    set(newState)
  },

  /**
   * Remove um item do inventario do jogador (durante o jogo)
   * NOTA: playerStore pode nao estar inicializado, entao nao delegamos
   */
  removeItemFromInventory: (playerId: PlayerId, itemId: string) => {
    const state = get()
    const player = state.players[playerId]
    if (!player) return

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
  // NOTA: DUAL-WRITE - Atualiza tanto effectsStore quanto player.effects
  // Durante a migracao, ambos sao mantidos em sincronia
  // @see ADR-001-store-decomposition.md

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

    // DUAL-WRITE: Atualiza effectsStore
    useEffectsStore.getState().applyEffect(playerId, effect)

    // DUAL-WRITE: Atualiza player.effects (retrocompatibilidade)
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

    // DUAL-WRITE: Atualiza effectsStore
    useEffectsStore.getState().removeEffect(playerId, effectType)

    // DUAL-WRITE: Atualiza player.effects (retrocompatibilidade)
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

    // DUAL-WRITE: Atualiza effectsStore
    useEffectsStore.getState().decrementEffects(playerId)

    // DUAL-WRITE: Atualiza player.effects (retrocompatibilidade)
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
  // DELEGADO para pillPoolStore

  /**
   * Adiciona uma pilula a lista de reveladas (usado pelo Scanner)
   * @delegate pillPoolStore.addRevealedPill
   */
  addRevealedPill: (pillId: string) => {
    usePillPoolStore.getState().addRevealedPill(pillId)
    // Sync local state para retrocompatibilidade
    const state = get()
    if (!state.revealedPills.includes(pillId)) {
      set({ revealedPills: [...state.revealedPills, pillId] })
    }
  },

  /**
   * Remove uma pilula da lista de reveladas
   * @delegate pillPoolStore.removeRevealedPill
   */
  removeRevealedPill: (pillId: string) => {
    usePillPoolStore.getState().removeRevealedPill(pillId)
    // Sync local state para retrocompatibilidade
    set({ revealedPills: get().revealedPills.filter((id) => id !== pillId) })
  },

  /**
   * Limpa todas as pilulas reveladas (usado ao iniciar nova rodada)
   * @delegate pillPoolStore.clearRevealedPills
   */
  clearRevealedPills: () => {
    usePillPoolStore.getState().clearRevealedPills()
    // Sync local state para retrocompatibilidade
    set({ revealedPills: [] })
  },

  // ============ PILL MODIFIERS ACTIONS ============
  // DELEGADO para pillPoolStore

  /**
   * Marca uma pilula como invertida (dano vira cura, cura vira dano)
   * Usado pelo item Inverter
   * @delegate pillPoolStore.invertPill
   */
  invertPill: (pillId: string) => {
    usePillPoolStore.getState().invertPill(pillId)
    // Sync local state para retrocompatibilidade
    const state = get()
    const pillIndex = state.pillPool.findIndex((p) => p.id === pillId)
    if (pillIndex === -1) return
    const newPillPool = [...state.pillPool]
    newPillPool[pillIndex] = { ...newPillPool[pillIndex], inverted: !newPillPool[pillIndex].inverted }
    set({ pillPool: newPillPool })
  },

  /**
   * Marca uma pilula como dobrada (efeito x2)
   * Usado pelo item Double
   * @delegate pillPoolStore.doublePill
   */
  doublePill: (pillId: string) => {
    usePillPoolStore.getState().doublePill(pillId)
    // Sync local state para retrocompatibilidade
    const state = get()
    const pillIndex = state.pillPool.findIndex((p) => p.id === pillId)
    if (pillIndex === -1) return
    const newPillPool = [...state.pillPool]
    newPillPool[pillIndex] = { ...newPillPool[pillIndex], doubled: true }
    set({ pillPool: newPillPool })
  },

  /**
   * Remove todos os modificadores de uma pilula
   * @delegate pillPoolStore.clearPillModifiers
   */
  clearPillModifiers: (pillId: string) => {
    usePillPoolStore.getState().clearPillModifiers(pillId)
    // Sync local state para retrocompatibilidade
    const state = get()
    const pillIndex = state.pillPool.findIndex((p) => p.id === pillId)
    if (pillIndex === -1) return
    const newPillPool = [...state.pillPool]
    newPillPool[pillIndex] = { ...newPillPool[pillIndex], inverted: undefined, doubled: undefined }
    set({ pillPool: newPillPool })
  },

  // ============ PILL STORE ============

  /**
   * Toggle: jogador quer/nao quer visitar a loja ao fim da rodada
   * Chamado quando jogador clica no icone de Pill Coins
   */
  toggleWantsStore: (playerId: PlayerId) => {
    const state = get()
    const player = state.players[playerId]

    // Validacao: precisa ter coins para ativar
    if (player.pillCoins === 0) {
      useToastStore.getState().show({
        type: 'quest',
        message: 'Sem Pill Coins! Complete quests para obter.',
        playerId,
        duration: 2000,
      })
      return
    }

    const newWantsStore = !player.wantsStore

    // Toggle wantsStore
    set({
      players: {
        ...state.players,
        [playerId]: {
          ...player,
          wantsStore: newWantsStore,
        },
      },
    })

    // Emite evento multiplayer
    emitMultiplayerEvent(state.mode, {
      type: 'wants_store_toggled',
      payload: { wantsStore: newWantsStore },
    })

    // Toast de feedback
    useToastStore.getState().show({
      type: 'quest',
      message: newWantsStore ? 'Loja solicitada!' : 'Loja cancelada!',
      playerId,
      duration: 1200,
    })
  },

  /**
   * Verifica se deve abrir loja ao fim da rodada
   * Chamado quando pool esvazia (apos verificar Game Over)
   * Em multiplayer, apenas host inicia nova rodada - guest aguarda evento
   * @delegate shopStore.openShop
   */
  checkAndStartShopping: () => {
    const state = get()
    const { players } = state

    // Verifica se alguem quer ir a loja E tem coins
    const p1Wants = players.player1.wantsStore && players.player1.pillCoins > 0
    const p2Wants = players.player2.wantsStore && players.player2.pillCoins > 0

    if (p1Wants || p2Wants) {
      // Delega para shopStore (suporta N jogadores)
      const playerIds = Object.keys(players) as PlayerId[]
      useShopStore.getState().openShop(DEFAULT_STORE_CONFIG.shoppingTime, playerIds)

      // DUAL-WRITE: Sync local state + change phase
      set({
        phase: 'shopping',
        storeState: useShopStore.getState().storeState,
      })
    } else {
      // Ninguem quer ir a loja, proxima rodada direto
      // Em multiplayer, apenas host inicia - guest aguarda evento round_reset
      if (state.mode === 'multiplayer') {
        import('@/stores/multiplayerStore').then(({ useMultiplayerStore }) => {
          const mpState = useMultiplayerStore.getState()
          if (mpState.localRole === 'host') {
            get().resetRound()
          } else {
            console.log('[GameStore] Guest aguardando round_reset do host')
          }
        })
      } else {
        get().resetRound()
      }
    }
  },

  /**
   * Adiciona item ao carrinho de compras
   * NAO debita Pill Coins - apenas reserva para compra futura
   * @param playerId - ID do jogador
   * @param itemId - ID do item na loja
   */
  addToCart: (playerId: PlayerId, itemId: string) => {
    const state = get()
    const player = state.players[playerId]
    const storeState = state.storeState

    // Validacao: precisa estar na fase shopping
    if (state.phase !== 'shopping' || !storeState) {
      return
    }

    // Busca item no catalogo
    const item = getStoreItemById(itemId)
    if (!item) {
      return
    }

    // Calcula total do carrinho atual
    const currentCart = storeState.cart[playerId]
    const cartTotal = currentCart.reduce((sum, ci) => sum + ci.cost, 0)

    // Validacao: item nao-stackable ja esta no carrinho
    const isStackable = item.stackable ?? true
    if (!isStackable) {
      const alreadyInCart = currentCart.some((ci) => ci.storeItemId === itemId)
      if (alreadyInCart) {
        useToastStore.getState().show({
          type: 'quest',
          message: 'Limite de 1 por compra!',
          playerId,
          duration: 1500,
        })
        return
      }
    }

    // Validacao: coins suficientes para carrinho + novo item
    if (player.pillCoins < cartTotal + item.cost) {
      useToastStore.getState().show({
        type: 'quest',
        message: 'Pill Coins insuficientes!',
        playerId,
        duration: 1500,
      })
      return
    }

    // Validacao: item disponivel para o jogador (considerando carrinho)
    // Cria player simulado com itens do carrinho para validacao
    const cartPowerUps = currentCart.filter(ci => {
      const si = getStoreItemById(ci.storeItemId)
      return si?.type === 'power_up'
    })
    const simulatedPlayer = {
      ...player,
      inventory: {
        ...player.inventory,
        items: [
          ...player.inventory.items,
          ...cartPowerUps.map(() => ({ id: 'temp', type: 'scanner' as const })),
        ],
      },
    }

    if (item.isAvailable && !item.isAvailable(simulatedPlayer)) {
      useToastStore.getState().show({
        type: 'quest',
        message: 'Item indisponivel!',
        playerId,
        duration: 1500,
      })
      return
    }

    // Adiciona ao carrinho
    const newCart = [...currentCart, { storeItemId: itemId, cost: item.cost }]

    set({
      storeState: {
        ...storeState,
        cart: {
          ...storeState.cart,
          [playerId]: newCart,
        },
      },
    })

    // Emite evento multiplayer
    emitMultiplayerEvent(state.mode, {
      type: 'cart_updated',
      payload: {
        action: 'add',
        itemId,
      },
    })

    // Toast de feedback
    useToastStore.getState().show({
      type: 'quest',
      message: `${item.name} adicionado ao carrinho`,
      playerId,
      duration: 1000,
    })
  },

  /**
   * Remove item do carrinho de compras
   * @param playerId - ID do jogador
   * @param itemId - ID do item na loja a remover
   */
  removeFromCart: (playerId: PlayerId, itemId: string) => {
    const state = get()
    const storeState = state.storeState

    if (state.phase !== 'shopping' || !storeState) {
      return
    }

    const currentCart = storeState.cart[playerId]
    // Remove primeira ocorrencia do item
    const index = currentCart.findIndex(ci => ci.storeItemId === itemId)
    if (index === -1) return

    const newCart = [...currentCart]
    newCart.splice(index, 1)

    set({
      storeState: {
        ...storeState,
        cart: {
          ...storeState.cart,
          [playerId]: newCart,
        },
      },
    })

    // Emite evento multiplayer
    emitMultiplayerEvent(state.mode, {
      type: 'cart_updated',
      payload: {
        action: 'remove',
        itemId,
      },
    })

    const item = getStoreItemById(itemId)
    useToastStore.getState().show({
      type: 'quest',
      message: `${item?.name ?? 'Item'} removido do carrinho`,
      playerId,
      duration: 1000,
    })
  },

  /**
   * Processa o carrinho de compras - debita coins e aplica itens
   * Chamado internamente quando jogador confirma compras
   * @param playerId - ID do jogador
   * @param itemIds - IDs opcionais para power-ups (usado em multiplayer para sincronizar)
   * @returns Array de IDs gerados para power-ups (usado para sincronizar com outro cliente)
   */
  processCart: (playerId: PlayerId, itemIds?: string[]): string[] => {
    const state = get()
    const player = state.players[playerId]
    const storeState = state.storeState

    if (!storeState) return []

    const cart = storeState.cart[playerId]
    if (cart.length === 0) return []

    let updatedPlayer = { ...player }
    let newStoreState = { ...storeState }
    let totalCost = 0
    const generatedItemIds: string[] = []
    let itemIdIndex = 0

    for (const cartItem of cart) {
      const item = getStoreItemById(cartItem.storeItemId)
      if (!item) continue

      totalCost += item.cost

      if (item.type === 'power_up' && item.itemType) {
        // Usa ID fornecido (evento remoto) ou gera novo (local)
        const newItemId = itemIds?.[itemIdIndex] ?? uuidv4()
        generatedItemIds.push(newItemId)
        itemIdIndex++

        // Adiciona item ao inventario
        const newItem: InventoryItem = {
          id: newItemId,
          type: item.itemType,
        }
        updatedPlayer = {
          ...updatedPlayer,
          inventory: {
            ...updatedPlayer.inventory,
            items: [...updatedPlayer.inventory.items, newItem],
          },
        }
      } else if (item.type === 'boost' && item.boostType) {
        // Delega para shopStore
        useShopStore.getState().addPendingBoost(playerId, item.boostType)

        // DUAL-WRITE: Sync local state
        newStoreState = {
          ...newStoreState,
          pendingBoosts: {
            ...newStoreState.pendingBoosts,
            [playerId]: [...newStoreState.pendingBoosts[playerId], item.boostType],
          },
        }
      }
    }

    // Deduz total de coins
    updatedPlayer = {
      ...updatedPlayer,
      pillCoins: updatedPlayer.pillCoins - totalCost,
    }

    // Delega limpeza do carrinho para shopStore
    useShopStore.getState().clearCart(playerId)

    // DUAL-WRITE: Sync local state
    newStoreState = {
      ...newStoreState,
      cart: {
        ...newStoreState.cart,
        [playerId]: [],
      },
    }

    set({
      players: {
        ...state.players,
        [playerId]: updatedPlayer,
      },
      storeState: newStoreState,
    })

    // Toast de confirmacao
    // Nota: desativado temporariamente para nao sobrepor toast da pilula
    // if (totalCost > 0) {
    //   useToastStore.getState().show({
    //     type: 'quest',
    //     message: `-${totalCost} Pill Coins`,
    //     playerId,
    //     duration: 2000,
    //   })
    // }

    return generatedItemIds
  },

  /**
   * @deprecated Use addToCart/removeFromCart + confirmStorePurchases
   * Mantido para compatibilidade - agora apenas adiciona ao carrinho
   */
  purchaseStoreItem: (playerId: PlayerId, itemId: string) => {
    get().addToCart(playerId, itemId)
  },

  /**
   * Jogador confirma que terminou de fazer compras
   * Processa o carrinho (debita coins e aplica itens) antes de confirmar
   * @param playerId - ID do jogador confirmando
   * @param itemIds - IDs opcionais para power-ups (usado em multiplayer para sincronizar)
   * @delegate shopStore.confirmPlayer
   */
  confirmStorePurchases: (playerId: PlayerId, itemIds?: string[]) => {
    const state = get()
    const storeState = state.storeState

    // Validacao: precisa estar na fase shopping
    if (state.phase !== 'shopping' || !storeState) {
      return
    }

    // Ja confirmou - verifica via shopStore
    if (useShopStore.getState().isConfirmed(playerId)) {
      return
    }

    // Processa o carrinho antes de confirmar (debita coins e aplica itens)
    // Se itemIds fornecido (evento remoto), usa-os; senao gera novos
    const generatedItemIds = get().processCart(playerId, itemIds)

    // Emite evento multiplayer COM os IDs gerados (apenas se nao for evento remoto)
    // Isso garante que o outro cliente use os mesmos IDs
    if (!itemIds) {
      emitMultiplayerEvent(state.mode, {
        type: 'store_confirmed',
        payload: { itemIds: generatedItemIds },
      })
    }

    // Re-obtem estado atualizado apos processCart
    const updatedState = get()
    const updatedStoreState = updatedState.storeState
    if (!updatedStoreState) return

    const otherPlayerId: PlayerId = playerId === 'player1' ? 'player2' : 'player1'
    const otherPlayer = updatedState.players[otherPlayerId]

    // Verifica se outro jogador esta comprando (wantsStore && tem coins)
    const otherIsShopping = otherPlayer.wantsStore && otherPlayer.pillCoins > 0

    let newTimerDuration = updatedStoreState.timerDuration

    // Se outro ainda comprando e nao confirmou, reduz timer
    if (otherIsShopping && !useShopStore.getState().isConfirmed(otherPlayerId)) {
      const elapsed = Date.now() - (updatedStoreState.timerStartedAt ?? 0)
      const remaining = updatedStoreState.timerDuration - elapsed
      newTimerDuration = elapsed + (remaining * DEFAULT_STORE_CONFIG.reduceMultiplier)

      // Avisa o outro jogador
      useToastStore.getState().show({
        type: 'quest',
        message: 'Oponente finalizou! Tempo reduzido.',
        playerId: otherPlayerId,
        duration: 2000,
      })
    }

    // Delega para shopStore
    useShopStore.getState().confirmPlayer(playerId)

    // DUAL-WRITE: Sync local state
    set({
      storeState: {
        ...updatedStoreState,
        confirmed: {
          ...updatedStoreState.confirmed,
          [playerId]: true,
        },
        timerDuration: newTimerDuration,
      },
    })

    // Verifica se shopping terminou
    get().checkShoppingComplete()
  },

  /**
   * Verifica se a fase de shopping terminou
   * Chamado apos confirmacao ou timeout
   * @delegate shopStore.isConfirmed
   */
  checkShoppingComplete: () => {
    const state = get()
    const { players } = state
    const shopState = useShopStore.getState()

    if (state.phase !== 'shopping' || !shopState.storeState) {
      return
    }

    // Quem precisa confirmar: quem queria ir E tem coins (ou tinha no inicio)
    const p1NeedsConfirm = players.player1.wantsStore
    const p2NeedsConfirm = players.player2.wantsStore

    // Verifica se todos que precisam ja confirmaram (usando shopStore)
    const p1Done = !p1NeedsConfirm || shopState.isConfirmed('player1')
    const p2Done = !p2NeedsConfirm || shopState.isConfirmed('player2')

    if (p1Done && p2Done) {
      // Todos confirmaram - aplica boosts e inicia nova rodada
      get().applyPendingBoosts()

      // Em multiplayer, apenas host inicia nova rodada - guest aguarda evento
      const currentState = get()
      if (currentState.mode === 'multiplayer') {
        import('@/stores/multiplayerStore').then(({ useMultiplayerStore }) => {
          const mpState = useMultiplayerStore.getState()
          if (mpState.localRole === 'host') {
            get().resetRound()
          } else {
            console.log('[GameStore] Guest aguardando round_reset do host (shopping)')
          }
        })
      } else {
        get().resetRound()
      }
    }
  },

  /**
   * Aplica os boosts pendentes comprados na loja
   * Chamado antes de resetRound quando shopping termina
   * @delegate shopStore.getPendingBoosts + shopStore.closeShop
   */
  applyPendingBoosts: () => {
    const state = get()
    const { players, revealAtStart } = state
    const shopState = useShopStore.getState()

    // Verifica se loja esta aberta
    if (!shopState.storeState) {
      return
    }

    const newPlayers = { ...players }
    const newRevealAtStart = { ...revealAtStart }

    // Aplica boosts para cada jogador (usando shopStore)
    const playerIds = Object.keys(players) as PlayerId[]
    for (const playerId of playerIds) {
      // Delega para shopStore.getPendingBoosts
      const boosts = shopState.getPendingBoosts(playerId)
      let player = newPlayers[playerId]

      for (const boost of boosts) {
        switch (boost) {
          case 'life_up':
            // +1 vida (max MAX_LIVES do GAME_LIMITS)
            player = {
              ...player,
              lives: Math.min(player.lives + 1, player.maxLives),
            }
            break

          case 'full_resistance':
            // Resistencia MAX
            player = {
              ...player,
              resistance: player.maxResistance,
            }
            break

          case 'reveal_start':
            // Acumula quantidade de pills a revelar no inicio da rodada
            // Scanner-2X revela 2 pills
            newRevealAtStart[playerId] = (newRevealAtStart[playerId] || 0) + 2
            break
        }
      }

      // Reseta wantsStore para proxima rodada
      player = {
        ...player,
        wantsStore: false,
      }

      newPlayers[playerId] = player
    }

    // Delega para shopStore
    shopState.closeShop()

    // DUAL-WRITE: Sync local state
    set({
      players: newPlayers,
      storeState: null,
      revealAtStart: newRevealAtStart,
    })
  },

  // ============ MULTIPLAYER SYNC ============

  /**
   * Aplica evento recebido de jogador remoto
   * Bypassa emissao de eventos (evita loop)
   * Inclui validacoes para evitar estados invalidos
   */
  applyRemoteEvent: (event: GameEvent) => {
    const state = get()

    // Helper: log de evento invalido
    const logInvalid = (reason: string) => {
      console.warn(`[GameStore] Evento remoto invalido: ${reason}`, {
        type: event.type,
        playerId: event.playerId,
        payload: 'payload' in event ? event.payload : undefined,
        currentTurn: state.currentTurn,
        phase: state.phase,
      })
    }

    // Helper: verifica turno (apenas warning, nao rejeita)
    // Eventos remotos ja foram validados pelo remetente - rejeitar causa dessincronizacao
    const warnIfWrongTurn = (): void => {
      if (state.currentTurn !== event.playerId) {
        console.warn(`[GameStore] Evento de turno diferente (local: ${state.currentTurn}, remoto: ${event.playerId})`, {
          type: event.type,
          payload: 'payload' in event ? event.payload : undefined,
        })
      }
    }

    // Helper: valida se pillId existe no pool (usa pillPoolStore)
    const validatePill = (pillId: string): boolean => {
      const pill = usePillPoolStore.getState().getPill(pillId) ?? state.pillPool.find((p) => p.id === pillId)
      if (!pill) {
        logInvalid(`Pilula nao encontrada: ${pillId}`)
        return false
      }
      return true
    }

    // Helper: valida se itemId existe no inventario do jogador
    const validateItem = (playerId: PlayerId, itemId: string): boolean => {
      const player = state.players[playerId]
      const item = player?.inventory.items.find((i) => i.id === itemId)
      if (!item) {
        logInvalid(`Item nao encontrado no inventario: ${itemId}`)
        return false
      }
      return true
    }

    setSyncingFromRemote(true)

    console.log('[GameStore] applyRemoteEvent:', {
      eventType: event.type,
      eventPlayerId: event.playerId,
      currentTurn: state.currentTurn,
      phase: state.phase,
      pillPoolLength: state.pillPool.length,
    })

    try {
      switch (event.type) {
        case 'pill_consumed': {
          const payload = event.payload as {
            pillId: string
            forcedTarget?: PlayerId
            feedback?: {
              pillType: PillType
              effectType: 'damage' | 'heal' | 'safe' | 'collapse' | 'fatal'
              effectValue: number
              consumerId: PlayerId
            }
          }

          console.log('[GameStore] pill_consumed payload:', payload)

          // Verifica turno (apenas warning) e valida pilula
          warnIfWrongTurn()
          if (!validatePill(payload.pillId)) break

          get().consumePill(payload.pillId, {
            forcedTarget: payload.forcedTarget,
          })

          // Mostra toast de feedback para evento remoto
          if (payload.feedback) {
            const { pillType, effectType, effectValue, consumerId } = payload.feedback
            const opponentName = state.players[event.playerId]?.name ?? 'Oponente'

            // Mapeia effectType para ToastType
            const toastType = effectType === 'fatal' ? 'fatal'
              : effectType === 'collapse' ? 'collapse'
              : effectType === 'damage' ? 'damage'
              : effectType === 'heal' ? 'heal'
              : 'safe'

            // Mensagem contextualizada
            const getMessage = () => {
              if (effectType === 'fatal') return `${opponentName} se fudeu!`
              if (effectType === 'collapse') return `${opponentName}: teto preto?!`
              if (effectType === 'damage') return `${opponentName} tomou dano`
              if (effectType === 'heal') return `${opponentName} se curou`
              return `${opponentName} consumiu pilula`
            }

            useToastStore.getState().show({
              type: toastType,
              message: getMessage(),
              pillType,
              value: effectValue || undefined,
              playerId: consumerId,
              duration: 1500,
            })
          }
          break
        }

        case 'item_used': {
          const payload = event.payload as {
            itemId: string
            targetId?: string
            itemType?: ItemType
          }

          // Verifica turno (apenas warning) e valida item
          warnIfWrongTurn()
          if (!validateItem(event.playerId, payload.itemId)) break

          // Valida alvo se for pilula
          if (payload.targetId && state.pillPool.length > 0) {
            // Tenta validar como pill (pode ser outro tipo de alvo)
            const isPillTarget = state.pillPool.some((p) => p.id === payload.targetId)
            if (!isPillTarget) {
              // Nao e pill - pode ser outro tipo de alvo valido (ex: oponente)
              // Permite continuar
            }
          }

          get().executeItem(payload.itemId, payload.targetId)

          // Mostra toast de feedback para evento remoto
          if (payload.itemType) {
            const opponentName = state.players[event.playerId]?.name ?? 'Oponente'
            const itemDef = ITEM_CATALOG[payload.itemType]
            const itemName = itemDef?.name ?? 'item'

            useToastStore.getState().show({
              type: 'item',
              message: `${opponentName} usou ${itemName}`,
              itemType: payload.itemType,
              duration: 1500,
            })
          }
          break
        }

        case 'item_selected': {
          const payload = event.payload as { itemType: ItemType; itemId: string }

          // Valida fase
          if (state.phase !== 'itemSelection') {
            logInvalid(`Fase incorreta para selecao de item: ${state.phase}`)
            break
          }

          // Passa itemId para sincronizar IDs entre clientes
          get().selectItem(event.playerId, payload.itemType, payload.itemId)
          break
        }

        case 'item_deselected': {
          const payload = event.payload as { itemId: string }

          // Valida fase
          if (state.phase !== 'itemSelection') {
            logInvalid(`Fase incorreta para desselecao de item: ${state.phase}`)
            break
          }

          get().deselectItem(event.playerId, payload.itemId)
          break
        }

        case 'selection_confirmed': {
          // Valida fase
          if (state.phase !== 'itemSelection') {
            logInvalid(`Fase incorreta para confirmacao: ${state.phase}`)
            break
          }

          get().confirmItemSelection(event.playerId)
          break
        }

        case 'wants_store_toggled': {
          const payload = event.payload as { wantsStore: boolean }
          const player = state.players[event.playerId]

          if (!player) {
            logInvalid(`Jogador nao encontrado: ${event.playerId}`)
            break
          }

          // Toggle apenas se estado diferente
          if (player.wantsStore !== payload.wantsStore) {
            get().toggleWantsStore(event.playerId)
          }
          break
        }

        case 'cart_updated': {
          const payload = event.payload as { action: 'add' | 'remove'; itemId: string }

          // Valida fase
          if (state.phase !== 'shopping') {
            logInvalid(`Fase incorreta para atualizar carrinho: ${state.phase}`)
            break
          }

          if (payload.action === 'add') {
            get().addToCart(event.playerId, payload.itemId)
          } else {
            get().removeFromCart(event.playerId, payload.itemId)
          }
          break
        }

        case 'store_confirmed': {
          // Valida fase
          if (state.phase !== 'shopping') {
            logInvalid(`Fase incorreta para confirmar compras: ${state.phase}`)
            break
          }

          // Extrai itemIds do payload para sincronizar IDs de power-ups
          const storePayload = event.payload as { itemIds?: string[] } | undefined
          get().confirmStorePurchases(event.playerId, storePayload?.itemIds)
          break
        }

        default:
          console.warn('[GameStore] Evento remoto nao tratado:', event.type)
      }
    } catch (error) {
      // Recuperacao graceful - log erro mas nao crasha
      console.error('[GameStore] Erro ao aplicar evento remoto:', error, {
        type: event.type,
        playerId: event.playerId,
        payload: 'payload' in event ? event.payload : undefined,
      })
    } finally {
      setSyncingFromRemote(false)
    }
  },

  // ============ SELECTORS ============
  // Gradualmente delegando para stores modulares

  /**
   * Retorna o jogador do turno atual
   * @delegate playerStore.getPlayer
   */
  getCurrentPlayer: () => {
    const state = get()
    // Tenta playerStore primeiro
    const player = usePlayerStore.getState().getPlayer(state.currentTurn)
    if (player) return player
    // Fallback para estado local
    return state.players[state.currentTurn]
  },

  /**
   * Retorna o oponente do turno atual
   * @deprecated Use useTargetablePlayers() para suporte N-player
   */
  getOpponent: () => {
    const state = get()
    const opponentId: PlayerId =
      state.currentTurn === 'player1' ? 'player2' : 'player1'
    return state.players[opponentId]
  },

  /**
   * Busca uma pilula pelo ID
   * @delegate pillPoolStore.getPill
   */
  getPillById: (pillId: string) => {
    // Delega para pillPoolStore (fonte da verdade)
    const pill = usePillPoolStore.getState().getPill(pillId)
    if (pill) return pill
    // Fallback para estado local (retrocompatibilidade)
    return get().pillPool.find((p) => p.id === pillId)
  },

  /**
   * Verifica se o pool de pilulas esta vazio
   * @delegate pillPoolStore.isEmpty
   */
  isPillPoolEmpty: () => {
    // Delega para pillPoolStore
    return usePillPoolStore.getState().isEmpty()
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

/**
 * Hook para selecionar dificuldade atual
 */
export const useDifficulty = () => useGameStore((state) => state.difficulty)

