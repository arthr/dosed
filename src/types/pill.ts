/**
 * Tipos de pilulas disponiveis no jogo
 * Conforme documentacao em docs/GAME-IDEA.md
 */
export type PillType = 'SAFE' | 'DMG_LOW' | 'DMG_HIGH' | 'FATAL' | 'HEAL'

/**
 * Formas visuais das pilulas
 */
export type PillShape = 'capsule' | 'round' | 'triangle' | 'oval' | 'hexagon'

/**
 * Estatisticas de efeito da pilula
 */
export interface PillStats {
  /** Dano causado (0 para SAFE/HEAL, 1-2 para DMG_LOW, 3-4 para DMG_HIGH, 999 para FATAL) */
  damage: number
  /** Se a pilula e fatal (zera resistencia instantaneamente) */
  isFatal: boolean
  /** Quantidade de cura (0 para nao-cura, 2+ para HEAL) */
  heal: number
}

/**
 * Propriedades visuais da pilula
 */
export interface PillVisuals {
  /** Cor da pilula (real quando revelada, neutra quando oculta) */
  color: string
  /** Forma da pilula */
  shape: PillShape
  /** Label exibido (tipo real quando revelada, "???" quando oculta) */
  label: string
}

/**
 * Representa uma pilula no pool da mesa
 */
export interface Pill {
  /** ID unico da pilula */
  id: string
  /** Tipo da pilula (determina o efeito) */
  type: PillType
  /** Se a pilula foi revelada para os jogadores */
  isRevealed: boolean
  /** Estatisticas de efeito */
  stats: PillStats
  /** Propriedades visuais */
  visuals: PillVisuals
  /** Se o efeito da pilula esta invertido (dano vira cura, cura vira dano) */
  inverted?: boolean
  /** Se o efeito da pilula esta dobrado */
  doubled?: boolean
}

/**
 * Configuracao para geracao de pilulas
 */
export interface PillConfig {
  /** Dano minimo e maximo para cada tipo */
  damageRange: {
    DMG_LOW: [number, number]
    DMG_HIGH: [number, number]
  }
  /** Quantidade de cura para HEAL */
  healAmount: number
  /** Probabilidades de cada tipo (devem somar 1) */
  probabilities: Record<PillType, number>
}

