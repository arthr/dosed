import { v4 as uuidv4 } from 'uuid'
import type { Pill, PillConfig, PillShape, PillType } from '@/types'
import {
  FATAL_DAMAGE,
  HIDDEN_PILL_HEX,
  PILL_CONFIG,
  PILL_HEX_COLORS,
} from './constants'
import { getPillCount, distributePillTypes } from './pillProgression'
import { distributeShapes } from './shapeProgression'

/**
 * Gera um numero aleatorio dentro de um range [min, max]
 */
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Calcula as estatisticas de uma pilula baseado no tipo
 */
function calculatePillStats(
  type: PillType,
  config: PillConfig
): { damage: number; isFatal: boolean; heal: number; livesRestore: number } {
  switch (type) {
    case 'SAFE':
      return { damage: 0, isFatal: false, heal: 0, livesRestore: 0 }

    case 'DMG_LOW': {
      const [min, max] = config.damageRange.DMG_LOW
      return { damage: randomInRange(min, max), isFatal: false, heal: 0, livesRestore: 0 }
    }

    case 'DMG_HIGH': {
      const [min, max] = config.damageRange.DMG_HIGH
      return { damage: randomInRange(min, max), isFatal: false, heal: 0, livesRestore: 0 }
    }

    case 'FATAL':
      return { damage: FATAL_DAMAGE, isFatal: true, heal: 0, livesRestore: 0 }

    case 'HEAL':
      return { damage: 0, isFatal: false, heal: config.healAmount, livesRestore: 0 }

    case 'LIFE':
      return { damage: 0, isFatal: false, heal: 0, livesRestore: 1 }

    default:
      return { damage: 0, isFatal: false, heal: 0, livesRestore: 0 }
  }
}

/**
 * Cria uma unica pilula com tipo e shape especificos
 *
 * @param type - Tipo da pilula
 * @param shape - Shape da pilula
 * @param config - Configuracao de dano/cura (opcional)
 */
export function createPillWithShape(
  type: PillType,
  shape: PillShape,
  config: PillConfig = PILL_CONFIG
): Pill {
  const stats = calculatePillStats(type, config)

  return {
    id: uuidv4(),
    type,
    isRevealed: false,
    stats: {
      damage: stats.damage,
      isFatal: stats.isFatal,
      heal: stats.heal,
      livesRestore: stats.livesRestore,
    },
    visuals: {
      color: HIDDEN_PILL_HEX,
      shape,
      label: '???',
    },
  }
}

/**
 * Cria uma unica pilula com tipo especifico
 * @deprecated Use createPillWithShape() para controle explicito da shape
 */
export function createPill(type: PillType, config: PillConfig = PILL_CONFIG): Pill {
  // Fallback para round shape (retrocompatibilidade)
  return createPillWithShape(type, 'round', config)
}

/**
 * Gera um pool de pilulas para uma rodada com progressao dinamica
 * Usa distribuicao PROPORCIONAL para tipos E shapes
 *
 * @param round - Numero da rodada (determina quantidade, tipos e shapes disponiveis)
 * @param config - Configuracao de dano/cura (opcional)
 * @returns Array de pilulas embaralhado com isRevealed = false
 */
export function generatePillPool(
  round: number = 1,
  config: PillConfig = PILL_CONFIG
): Pill[] {
  const count = getPillCount(round)
  const typeDistribution = distributePillTypes(count, round)
  const shapeDistribution = distributeShapes(count, round)

  // Cria pool de shapes embaralhado para atribuicao aleatoria
  const shapePool: PillShape[] = []
  for (const [shape, shapeCount] of Object.entries(shapeDistribution)) {
    for (let i = 0; i < shapeCount; i++) {
      shapePool.push(shape as PillShape)
    }
  }
  const shuffledShapes = shuffleArray(shapePool)

  // Cria pilulas com tipos distribuidos e shapes aleatorias
  const pills: Pill[] = []
  let shapeIndex = 0

  for (const [type, typeCount] of Object.entries(typeDistribution)) {
    for (let i = 0; i < typeCount; i++) {
      const shape = shuffledShapes[shapeIndex++]
      pills.push(createPillWithShape(type as PillType, shape, config))
    }
  }

  // Embaralha para ordem nao previsivel
  return shuffleArray(pills)
}

/**
 * Gera um pool de pilulas com quantidade especifica (override manual)
 * Usa distribuicao PROPORCIONAL para tipos E shapes
 *
 * @param count - Quantidade de pilulas a gerar
 * @param round - Numero da rodada (determina tipos e shapes disponiveis)
 * @param config - Configuracao de dano/cura (opcional)
 * @returns Array de pilulas embaralhado com isRevealed = false
 */
export function generatePillPoolWithCount(
  count: number,
  round: number = 1,
  config: PillConfig = PILL_CONFIG
): Pill[] {
  const typeDistribution = distributePillTypes(count, round)
  const shapeDistribution = distributeShapes(count, round)

  // Cria pool de shapes embaralhado
  const shapePool: PillShape[] = []
  for (const [shape, shapeCount] of Object.entries(shapeDistribution)) {
    for (let i = 0; i < shapeCount; i++) {
      shapePool.push(shape as PillShape)
    }
  }
  const shuffledShapes = shuffleArray(shapePool)

  const pills: Pill[] = []
  let shapeIndex = 0

  for (const [type, typeCount] of Object.entries(typeDistribution)) {
    for (let i = 0; i < typeCount; i++) {
      const shape = shuffledShapes[shapeIndex++]
      pills.push(createPillWithShape(type as PillType, shape, config))
    }
  }

  return shuffleArray(pills)
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
    LIFE: 0,
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

