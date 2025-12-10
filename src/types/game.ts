import type { TargetSelectionState } from './item'
import type { Pill, PillShape, PillType } from './pill'
import type { Player, PlayerId } from './player'
import type { ShapeQuest } from './quest'
import type { StoreState } from './store'

/**
 * Fases do jogo
 */
export type GamePhase = 'setup' | 'itemSelection' | 'playing' | 'roundEnding' | 'shopping' | 'ended'

/**
 * Fases dentro de um turno
 */
export type TurnPhase = 'items' | 'consume' | 'resolution'

/**
 * Estado completo do jogo
 */
export interface GameState {
  /** Fase atual do jogo */
  phase: GamePhase
  /** Fase atual do turno */
  turnPhase: TurnPhase
  /** ID do jogador com o turno atual */
  currentTurn: PlayerId
  /** Estado dos jogadores */
  players: Record<PlayerId, Player>
  /** Pilulas disponiveis na mesa */
  pillPool: Pill[]
  /** Contagem publica de tipos de pilulas (visivel para ambos jogadores) */
  typeCounts: Record<PillType, number>
  /** Contagem publica de shapes de pilulas (visivel para ambos jogadores) */
  shapeCounts: Record<PillShape, number>
  /** Objetivo de shape de cada jogador */
  shapeQuests: Record<PlayerId, ShapeQuest | null>
  /** Numero da rodada atual */
  round: number
  /** ID do vencedor (null se jogo em andamento) */
  winner: PlayerId | null
  /** Historico de acoes para replay/log */
  actionHistory: GameAction[]
  /** Estado de selecao de alvo para uso de item */
  targetSelection: TargetSelectionState
  /** IDs de pilulas reveladas pelo Scanner (visiveis apenas para quem usou) */
  revealedPills: string[]
  /** Status de confirmacao de selecao de itens por jogador */
  itemSelectionConfirmed: Record<PlayerId, boolean>
  /** Estado da Pill Store (apenas durante fase shopping) */
  storeState: StoreState | null
  /** Ultimo reset de quest (para animacao de shake) */
  lastQuestReset: { playerId: PlayerId; timestamp: number } | null
  /** Quantidade de pills a revelar automaticamente no inicio da proxima rodada (por jogador) */
  revealAtStart: Record<PlayerId, number>
}

/**
 * Tipos de acoes do jogo para historico
 */
export type GameActionType =
  | 'CONSUME_PILL'
  | 'REVEAL_PILL'
  | 'COLLAPSE'
  | 'ELIMINATE'
  | 'NEW_ROUND'
  | 'GAME_START'
  | 'GAME_END'
  | 'USE_ITEM'
  | 'SKIP_TURN'

/**
 * Registro de acao do jogo
 */
export interface GameAction {
  /** Tipo da acao */
  type: GameActionType
  /** ID do jogador que executou a acao */
  playerId: PlayerId
  /** Timestamp da acao */
  timestamp: number
  /** Dados adicionais da acao */
  payload?: Record<string, unknown>
}

/**
 * Configuracao inicial do jogo
 */
export interface GameConfig {
  /** Configuracao do Player 1 */
  player1: {
    name: string
    isAI: boolean
  }
  /** Configuracao do Player 2 */
  player2: {
    name: string
    isAI: boolean
  }
  /** Vidas iniciais por jogador */
  startingLives: number
  /** Resistencia inicial por jogador */
  startingResistance: number
}

/**
 * Estatisticas do jogo para tela de fim
 */
export interface GameStats {
  /** Total de rodadas */
  totalRounds: number
  /** Total de pilulas consumidas */
  pillsConsumed: number
  /** Pilulas consumidas por tipo */
  pillsByType: Record<PillType, number>
  /** Total de colapsos */
  totalCollapses: number
  /** Duracao do jogo em ms */
  duration: number
}

