import type { GameConfig, PillConfig, PillType } from '@/types'

/**
 * Configuracao padrao do jogo
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  player1: {
    name: 'Player 1',
    isAI: false,
  },
  player2: {
    name: 'Player 2',
    isAI: true,
  },
  startingLives: 3,
  startingResistance: 6,
  pillsPerRound: 6,
  pillProbabilities: {
    SAFE: 0.35,
    DMG_LOW: 0.25,
    DMG_HIGH: 0.15,
    FATAL: 0.10,
    HEAL: 0.15,
  },
}

/**
 * Configuracao de pilulas (dano, cura, etc)
 */
export const PILL_CONFIG: PillConfig = {
  damageRange: {
    DMG_LOW: [1, 2],
    DMG_HIGH: [3, 4],
  },
  healAmount: 2,
  probabilities: DEFAULT_GAME_CONFIG.pillProbabilities,
}

/**
 * Dano fixo para pilula fatal (valor alto para garantir colapso)
 */
export const FATAL_DAMAGE = 999

/**
 * Cores associadas a cada tipo de pilula (Tailwind classes)
 */
export const PILL_COLORS: Record<PillType, string> = {
  SAFE: 'bg-pill-safe',
  DMG_LOW: 'bg-pill-dmg-low',
  DMG_HIGH: 'bg-pill-dmg-high',
  FATAL: 'bg-pill-fatal',
  HEAL: 'bg-pill-heal',
}

/**
 * Cores hex para cada tipo (para uso programatico)
 */
export const PILL_HEX_COLORS: Record<PillType, string> = {
  SAFE: '#22c55e',
  DMG_LOW: '#f59e0b',
  DMG_HIGH: '#ef4444',
  FATAL: '#7c3aed',
  HEAL: '#06b6d4',
}

/**
 * Cor para pilula oculta
 */
export const HIDDEN_PILL_COLOR = 'bg-pill-hidden'
export const HIDDEN_PILL_HEX = '#374151'

/**
 * Labels de exibicao para cada tipo de pilula
 */
export const PILL_LABELS: Record<PillType, string> = {
  SAFE: 'Placebo',
  DMG_LOW: 'Veneno',
  DMG_HIGH: 'Toxina',
  FATAL: 'Cianeto',
  HEAL: 'Antidoto',
}

/**
 * Descricoes dos efeitos de cada tipo
 */
export const PILL_DESCRIPTIONS: Record<PillType, string> = {
  SAFE: 'Sem efeito. Passa a vez em seguranca.',
  DMG_LOW: 'Causa 1-2 de dano a resistencia.',
  DMG_HIGH: 'Causa 3-4 de dano a resistencia.',
  FATAL: 'Zera a resistencia instantaneamente!',
  HEAL: 'Recupera +2 de resistencia.',
}

/**
 * Formas associadas a cada tipo de pilula
 */
export const PILL_SHAPES: Record<PillType, string> = {
  SAFE: 'round',
  DMG_LOW: 'capsule',
  DMG_HIGH: 'oval',
  FATAL: 'triangle',
  HEAL: 'hexagon',
}

/**
 * Limites do jogo
 */
export const GAME_LIMITS = {
  MIN_LIVES: 1,
  MAX_LIVES: 5,
  MIN_RESISTANCE: 3,
  MAX_RESISTANCE: 10,
  MIN_PILLS_PER_ROUND: 4,
  MAX_PILLS_PER_ROUND: 12,
} as const

/**
 * Cores para barra de resistencia baseado em porcentagem
 */
export const HEALTH_BAR_THRESHOLDS = {
  HIGH: 0.66, // Verde acima de 66%
  MID: 0.33,  // Amarelo entre 33% e 66%
  // Vermelho abaixo de 33%
} as const

/**
 * Retorna a classe de cor para a barra de resistencia
 */
export function getHealthBarColor(current: number, max: number): string {
  const percentage = current / max
  if (percentage > HEALTH_BAR_THRESHOLDS.HIGH) return 'bg-health-full'
  if (percentage > HEALTH_BAR_THRESHOLDS.MID) return 'bg-health-mid'
  return 'bg-health-low'
}

/**
 * Cores hex para barra de resistencia
 */
const HEALTH_BAR_HEX_COLORS = {
  full: '#22c55e',   // green-500
  mid: '#f59e0b',    // amber-500
  low: '#ef4444',    // red-500
} as const

/**
 * Retorna a cor hex para a barra de resistencia
 */
export function getHealthBarHexColor(current: number, max: number): string {
  const percentage = current / max
  if (percentage > HEALTH_BAR_THRESHOLDS.HIGH) return HEALTH_BAR_HEX_COLORS.full
  if (percentage > HEALTH_BAR_THRESHOLDS.MID) return HEALTH_BAR_HEX_COLORS.mid
  return HEALTH_BAR_HEX_COLORS.low
}

