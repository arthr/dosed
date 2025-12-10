import type { ItemType } from './item'
import type { PlayerId } from './player'

/**
 * Eventos de jogo que precisam sincronizar entre clientes
 */
export type GameEventType =
  | 'room_created'
  | 'player_joined'
  | 'player_left'
  | 'game_started'
  | 'item_selected'
  | 'item_deselected'
  | 'selection_confirmed'
  | 'pill_consumed'
  | 'item_used'
  | 'turn_ended'
  | 'wants_store_toggled'
  | 'cart_updated'
  | 'store_confirmed'
  | 'round_reset'
  | 'game_ended'
  | 'player_disconnected'
  | 'player_reconnected'
  | 'state_sync'
  | 'heartbeat'

/**
 * Evento base com metadados comuns
 */
export interface GameEventBase {
  /** Tipo do evento */
  type: GameEventType
  /** ID da sala */
  roomId: string
  /** ID do jogador que originou o evento */
  playerId: PlayerId
  /** Timestamp do evento */
  timestamp: number
  /** Numero de sequencia (para ordenacao) */
  sequence: number
}

// ============================================
// Eventos de Sala
// ============================================

/**
 * Evento: sala criada
 */
export interface RoomCreatedEvent extends GameEventBase {
  type: 'room_created'
  payload: {
    hostName: string
  }
}

/**
 * Evento: jogador entrou na sala
 */
export interface PlayerJoinedEvent extends GameEventBase {
  type: 'player_joined'
  payload: {
    guestName: string
  }
}

/**
 * Evento: jogador saiu da sala
 */
export interface PlayerLeftEvent extends GameEventBase {
  type: 'player_left'
  payload: {
    reason: 'voluntary' | 'timeout' | 'error'
    /** Role de quem saiu - host encerra sala, guest libera vaga. Opcional para retrocompatibilidade */
    role?: 'host' | 'guest'
  }
}

/**
 * Evento: jogo iniciado
 */
export interface GameStartedEvent extends GameEventBase {
  type: 'game_started'
  payload: {
    /** Seed para geracao deterministica do pool */
    seed: number
  }
}

// ============================================
// Eventos de Selecao de Itens (Pre-jogo)
// ============================================

/**
 * Evento: item selecionado (pre-jogo)
 */
export interface ItemSelectedEvent extends GameEventBase {
  type: 'item_selected'
  payload: {
    itemType: ItemType
    /** ID do item gerado (para sincronizacao multiplayer) */
    itemId: string
  }
}

/**
 * Evento: item desselecionado (pre-jogo)
 */
export interface ItemDeselectedEvent extends GameEventBase {
  type: 'item_deselected'
  payload: {
    itemId: string
  }
}

/**
 * Evento: selecao de itens confirmada
 */
export interface SelectionConfirmedEvent extends GameEventBase {
  type: 'selection_confirmed'
}

// ============================================
// Eventos de Gameplay
// ============================================

/**
 * Tipo de efeito para feedback visual
 */
export type PillEffectType = 'damage' | 'heal' | 'safe' | 'collapse' | 'fatal'

/**
 * Evento: pilula consumida
 */
export interface PillConsumedEvent extends GameEventBase {
  type: 'pill_consumed'
  payload: {
    pillId: string
    /** PlayerId forcado (Force Feed) */
    forcedTarget?: PlayerId
    /** Dados para feedback visual remoto */
    feedback?: {
      /** Tipo da pilula revelada */
      pillType: import('./pill').PillType
      /** Tipo do efeito aplicado */
      effectType: PillEffectType
      /** Valor do efeito (dano ou cura) */
      effectValue: number
      /** ID do jogador que sofreu o efeito */
      consumerId: PlayerId
    }
  }
}

/**
 * Evento: item usado durante partida
 */
export interface ItemUsedEvent extends GameEventBase {
  type: 'item_used'
  payload: {
    itemId: string
    /** ID do alvo (pilula ou oponente) */
    targetId?: string
    /** Tipo do item para feedback visual remoto */
    itemType?: import('./item').ItemType
  }
}

/**
 * Evento: turno encerrado
 */
export interface TurnEndedEvent extends GameEventBase {
  type: 'turn_ended'
  payload: {
    nextPlayer: PlayerId
  }
}

// ============================================
// Eventos de Loja
// ============================================

/**
 * Evento: toggle wantsStore
 */
export interface WantsStoreToggledEvent extends GameEventBase {
  type: 'wants_store_toggled'
  payload: {
    wantsStore: boolean
  }
}

/**
 * Evento: carrinho atualizado
 */
export interface CartUpdatedEvent extends GameEventBase {
  type: 'cart_updated'
  payload: {
    action: 'add' | 'remove'
    itemId: string
  }
}

/**
 * Evento: compras confirmadas
 */
export interface StoreConfirmedEvent extends GameEventBase {
  type: 'store_confirmed'
  payload?: {
    /** IDs dos power-ups comprados (para sincronizacao multiplayer) */
    itemIds?: string[]
  }
}

// ============================================
// Eventos de Rodada
// ============================================

/**
 * Evento: rodada resetada
 */
export interface RoundResetEvent extends GameEventBase {
  type: 'round_reset'
  payload: {
    roundNumber: number
    /** Seed para geracao do novo pool */
    seed: number
  }
}

/**
 * Evento: jogo encerrado
 */
export interface GameEndedEvent extends GameEventBase {
  type: 'game_ended'
  payload: {
    winner: PlayerId | null
    reason: 'elimination' | 'disconnect' | 'forfeit'
  }
}

// ============================================
// Eventos de Conexao
// ============================================

/**
 * Evento: jogador desconectou
 */
export interface PlayerDisconnectedEvent extends GameEventBase {
  type: 'player_disconnected'
}

/**
 * Evento: jogador reconectou
 */
export interface PlayerReconnectedEvent extends GameEventBase {
  type: 'player_reconnected'
}

/**
 * Evento: sincronizacao de estado (enviado pelo host apos reconexao)
 */
export interface StateSyncEvent extends GameEventBase {
  type: 'state_sync'
  payload: {
    /** Modo de jogo - critico para emissao de eventos */
    mode: import('./multiplayer').GameMode
    /** ID da sala - critico para emissao de eventos */
    roomId: string | null
    currentTurn: import('./player').PlayerId
    phase: import('./game').GamePhase
    pillPool: import('./pill').Pill[]
    players: Record<import('./player').PlayerId, import('./player').Player>
    round: number
    revealedPills: string[]
    shapeQuests: Record<import('./player').PlayerId, import('./quest').ShapeQuest | null>
    typeCounts: Record<import('./pill').PillType, number>
    shapeCounts: Record<import('./pill').PillShape, number>
    storeState: import('./store').StoreState | null
  }
}

// ============================================
// Union de Todos os Eventos
// ============================================

/**
 * Union de todos os eventos de jogo
 */
export type GameEvent =
  | RoomCreatedEvent
  | PlayerJoinedEvent
  | PlayerLeftEvent
  | GameStartedEvent
  | ItemSelectedEvent
  | ItemDeselectedEvent
  | SelectionConfirmedEvent
  | PillConsumedEvent
  | ItemUsedEvent
  | TurnEndedEvent
  | WantsStoreToggledEvent
  | CartUpdatedEvent
  | StoreConfirmedEvent
  | RoundResetEvent
  | GameEndedEvent
  | PlayerDisconnectedEvent
  | PlayerReconnectedEvent
  | StateSyncEvent

