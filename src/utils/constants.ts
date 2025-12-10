import type { GameConfig, PillConfig, PillShape, PillType } from '@/types'

// Shape images (16 shapes com PNG)
import shapeCapsule from '@/assets/shapes/shape_1.png'
import shapeCross from '@/assets/shapes/shape_2.png'
import shapeSkull from '@/assets/shapes/shape_3.png'
import shapeFlower from '@/assets/shapes/shape_4.png'
import shapeBear from '@/assets/shapes/shape_5.png'
import shapeRound from '@/assets/shapes/shape_6.png'
import shapePineapple from '@/assets/shapes/shape_7.png'
import shapeTriangle from '@/assets/shapes/shape_8.png'
import shapeHeart from '@/assets/shapes/shape_9.png'
import shapeFruit from '@/assets/shapes/shape_10.png'
import shapeOval from '@/assets/shapes/shape_11.png'
import shapePumpkin from '@/assets/shapes/shape_12.png'
import shapeStar from '@/assets/shapes/shape_13.png'
import shapeCoin from '@/assets/shapes/shape_14.png'
import shapeGem from '@/assets/shapes/shape_15.png'
import shapeDomino from '@/assets/shapes/shape_16.png'

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
  difficulty: 'normal',
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
}

/**
 * Dano fixo para pilula fatal (valor alto para garantir colapso)
 */
export const FATAL_DAMAGE = 999

/**
 * Delay em ms para transicao entre rodadas (fase roundEnding)
 * Permite que toasts/animacoes terminem antes de mostrar nova rodada
 */
export const ROUND_TRANSITION_DELAY = 2000

/**
 * Timeout de seguranca para animacoes (fallback)
 * Se animacao demorar mais que isso, forca transicao de fase
 * Previne jogo travado quando usuario troca de aba do navegador
 */
export const ANIMATION_FALLBACK_TIMEOUT = 8000

/**
 * Cores associadas a cada tipo de pilula (Tailwind classes)
 */
export const PILL_COLORS: Record<PillType, string> = {
  SAFE: 'bg-pill-safe',
  DMG_LOW: 'bg-pill-dmg-low',
  DMG_HIGH: 'bg-pill-dmg-high',
  FATAL: 'bg-pill-fatal',
  HEAL: 'bg-pill-heal',
  LIFE: 'bg-pill-life',
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
  LIFE: '#ec4899',
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
  LIFE: 'Vida',
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
  LIFE: 'Restaura +1 vida perdida.',
}


// ============================================
// SHAPE IMAGES (16 shapes com PNG)
// ============================================

/**
 * Mapeamento de shapes para imagens PNG
 * Cada shape tem uma imagem com fundo transparente
 */
export const SHAPE_IMAGES: Record<PillShape, string> = {
  capsule: shapeCapsule,
  round: shapeRound,
  triangle: shapeTriangle,
  oval: shapeOval,
  cross: shapeCross,
  heart: shapeHeart,
  flower: shapeFlower,
  star: shapeStar,
  pumpkin: shapePumpkin,
  coin: shapeCoin,
  bear: shapeBear,
  gem: shapeGem,
  skull: shapeSkull,
  domino: shapeDomino,
  pineapple: shapePineapple,
  fruit: shapeFruit,
}

/**
 * Classes CSS para cada shape (fallback se imagem nao carregar)
 * Usadas pelo componente Pill.tsx para renderizar formato visual
 */
export const SHAPE_CLASSES: Record<PillShape, string> = {
  capsule: 'rounded-full aspect-[1.6]',
  round: 'rounded-full aspect-square',
  triangle: 'aspect-square',
  oval: 'rounded-full aspect-[1.3]',
  cross: 'aspect-square',
  heart: 'aspect-square',
  flower: 'aspect-square',
  star: 'aspect-square',
  pumpkin: 'aspect-square',
  coin: 'rounded-full aspect-square',
  bear: 'aspect-square',
  gem: 'aspect-square',
  skull: 'aspect-square',
  domino: 'aspect-[1.5]',
  pineapple: 'aspect-square',
  fruit: 'aspect-square',
}

/**
 * Clip-paths CSS para shapes (fallback se imagem nao carregar)
 * null = usa apenas border-radius
 */
export const SHAPE_CLIP_PATHS: Record<PillShape, string | null> = {
  capsule: null,
  round: null,
  triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
  oval: null,
  cross: 'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)',
  heart: null,
  flower: null,
  star: null,
  pumpkin: null,
  coin: null,
  bear: null,
  gem: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  skull: null,
  domino: 'rounded',
  pineapple: null,
  fruit: null,
}

/**
 * Labels de exibicao para cada shape (para UI e acessibilidade)
 */
export const SHAPE_LABELS: Record<PillShape, string> = {
  capsule: 'Capsula',
  round: 'Redonda',
  triangle: 'Triangulo',
  oval: 'Oval',
  cross: 'Cruz',
  heart: 'Coracao',
  flower: 'Flor',
  star: 'Estrela',
  pumpkin: 'Abobora',
  coin: 'Moeda',
  bear: 'Urso',
  gem: 'Gema',
  skull: 'Caveira',
  domino: 'Domino',
  pineapple: 'Abacaxi',
  fruit: 'Fruta',
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

