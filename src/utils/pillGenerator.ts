import { v4 as uuidv4 } from 'uuid'
import type { Pill, PillConfig, PillType } from '@/types'
import {
  FATAL_DAMAGE,
  HIDDEN_PILL_HEX,
  PILL_CONFIG,
  PILL_HEX_COLORS,
  PILL_SHAPES,
} from './constants'

/**
 * Gera um numero aleatorio dentro de um range [min, max]
 */
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Seleciona um tipo de pilula baseado nas probabilidades configuradas
 */
function selectPillType(probabilities: Record<PillType, number>): PillType {
  const random = Math.random()
  let cumulative = 0

  const types: PillType[] = ['SAFE', 'DMG_LOW', 'DMG_HIGH', 'FATAL', 'HEAL']

  for (const type of types) {
    cumulative += probabilities[type]
    if (random < cumulative) {
      return type
    }
  }

  // Fallback para SAFE se algo der errado
  return 'SAFE'
}

/**
 * Calcula as estatisticas de uma pilula baseado no tipo
 */
function calculatePillStats(
  type: PillType,
  config: PillConfig
): { damage: number; isFatal: boolean; heal: number } {
  switch (type) {
    case 'SAFE':
      return { damage: 0, isFatal: false, heal: 0 }

    case 'DMG_LOW': {
      const [min, max] = config.damageRange.DMG_LOW
      return { damage: randomInRange(min, max), isFatal: false, heal: 0 }
    }

    case 'DMG_HIGH': {
      const [min, max] = config.damageRange.DMG_HIGH
      return { damage: randomInRange(min, max), isFatal: false, heal: 0 }
    }

    case 'FATAL':
      return { damage: FATAL_DAMAGE, isFatal: true, heal: 0 }

    case 'HEAL':
      return { damage: 0, isFatal: false, heal: config.healAmount }

    default:
      return { damage: 0, isFatal: false, heal: 0 }
  }
}

/**
 * Cria uma unica pilula com tipo especifico
 */
export function createPill(type: PillType, config: PillConfig = PILL_CONFIG): Pill {
  const stats = calculatePillStats(type, config)

  return {
    id: uuidv4(),
    type,
    isRevealed: false,
    stats: {
      damage: stats.damage,
      isFatal: stats.isFatal,
      heal: stats.heal,
    },
    visuals: {
      // Cor oculta por padrao (sera revelada quando isRevealed = true)
      color: HIDDEN_PILL_HEX,
      shape: PILL_SHAPES[type] as Pill['visuals']['shape'],
      label: '???',
    },
  }
}

/**
 * Gera um pool de pilulas para uma rodada
 *
 * @param count - Quantidade de pilulas a gerar
 * @param config - Configuracao de probabilidades e dano
 * @returns Array de pilulas com isRevealed = false
 */
export function generatePillPool(
  count: number,
  config: PillConfig = PILL_CONFIG
): Pill[] {
  const pills: Pill[] = []

  for (let i = 0; i < count; i++) {
    const type = selectPillType(config.probabilities)
    pills.push(createPill(type, config))
  }

  return pills
}

/**
 * Conta a quantidade de cada tipo de pilula no pool
 * (usado para exibicao publica sem revelar quais sao quais)
 */
export function countPillTypes(pills: Pill[]): Record<PillType, number> {
  const counts: Record<PillType, number> = {
    SAFE: 0,
    DMG_LOW: 0,
    DMG_HIGH: 0,
    FATAL: 0,
    HEAL: 0,
  }

  for (const pill of pills) {
    counts[pill.type]++
  }

  return counts
}

/**
 * Revela uma pilula (atualiza visuals para mostrar tipo real)
 */
export function revealPill(pill: Pill): Pill {
  if (pill.isRevealed) return pill

  return {
    ...pill,
    isRevealed: true,
    visuals: {
      ...pill.visuals,
      color: PILL_HEX_COLORS[pill.type],
      label: pill.type,
    },
  }
}

/**
 * Gera um pool garantindo pelo menos uma pilula de cada tipo especificado
 * Util para balanceamento em partidas
 */
export function generateBalancedPillPool(
  count: number,
  guaranteedTypes: PillType[] = ['SAFE', 'HEAL'],
  config: PillConfig = PILL_CONFIG
): Pill[] {
  const pills: Pill[] = []

  // Adiciona pilulas garantidas
  for (const type of guaranteedTypes) {
    if (pills.length < count) {
      pills.push(createPill(type, config))
    }
  }

  // Preenche o resto com pilulas aleatorias
  while (pills.length < count) {
    const type = selectPillType(config.probabilities)
    pills.push(createPill(type, config))
  }

  // Embaralha o array para nao ter ordem previsivel
  return shuffleArray(pills)
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

