import type { PlayerInventory } from './item'

/**
 * Identificador unico do jogador
 * Formato: 'player1', 'player2', ..., 'playerN'
 */
export type PlayerId = string

/**
 * Tipo de efeito ativo no jogador
 */
export type PlayerEffectType = 'shield' | 'handcuffed'

/**
 * Efeito ativo no jogador (ex: Shield, Handcuffs)
 */
export interface PlayerEffect {
  /** Tipo do efeito */
  type: PlayerEffectType
  /** Rodadas restantes do efeito */
  roundsRemaining: number
}

/**
 * Representa um jogador no jogo
 */
export interface Player {
  /** ID unico do jogador */
  id: PlayerId
  /** Nome de exibicao */
  name: string
  /** Vidas atuais (0 = eliminado) */
  lives: number
  /** Maximo de vidas */
  maxLives: number
  /** Resistencia atual (HP temporario) */
  resistance: number
  /** Maximo de resistencia */
  maxResistance: number
  /** Se o jogador e controlado por IA */
  isAI: boolean
  /** Inventario de itens do jogador */
  inventory: PlayerInventory
  /** Efeitos ativos no jogador */
  effects: PlayerEffect[]
  /** Quantidade de Pill Coins acumuladas */
  pillCoins: number
  /** Toggle: jogador quer visitar Pill Store ao fim da rodada */
  wantsStore: boolean
}

/**
 * Configuracao inicial do jogador
 */
export interface PlayerConfig {
  /** Nome do jogador */
  name: string
  /** Vidas iniciais */
  lives: number
  /** Resistencia inicial */
  resistance: number
  /** Se e controlado por IA */
  isAI: boolean
}

/**
 * Resultado de aplicar efeito ao jogador
 */
export interface PlayerEffectResult {
  /** Novo estado do jogador */
  player: Player
  /** Se houve colapso (resistencia <= 0) */
  collapsed: boolean
  /** Se o jogador foi eliminado (vidas <= 0) */
  eliminated: boolean
  /** Dano total recebido */
  damageDealt: number
  /** Cura total recebida */
  healReceived: number
  /** Vidas restauradas (para pilula LIFE) */
  livesRestored: number
}

