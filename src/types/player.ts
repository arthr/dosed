/**
 * Identificador unico do jogador
 */
export type PlayerId = 'player1' | 'player2'

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
}

