import type { PillShape } from '@/types'

/**
 * Regra de progressao para uma shape
 */
export interface ShapeRule {
  /** Rodada em que a shape e desbloqueada */
  unlockRound: number
  /** Porcentagem inicial (na rodada de desbloqueio) */
  startPct: number
  /** Porcentagem final (na rodada maxima) */
  endPct: number
}

/**
 * Configuracao de progressao de shapes
 */
export interface ShapeProgressionConfig {
  /** Rodada maxima para interpolacao */
  maxRound: number
  /** Regras de progressao por shape */
  rules: Record<PillShape, ShapeRule>
}

/**
 * Configuracao padrao de progressao de shapes
 *
 * NOTAS DE DESIGN:
 * - Rodada 1: apenas round e capsule (formas basicas, faceis de distinguir)
 * - Rodada 2: oval entra (forma intermediaria)
 * - Rodada 3: triangle entra (forma angular, mais distinta)
 * - Rodada 5: hexagon entra (forma complexa, late game)
 * - Late game: distribuicao mais equilibrada entre todas shapes
 */
export const SHAPE_PROGRESSION: ShapeProgressionConfig = {
  maxRound: 15,
  rules: {
    round: { unlockRound: 1, startPct: 50, endPct: 15 },
    capsule: { unlockRound: 1, startPct: 50, endPct: 20 },
    oval: { unlockRound: 2, startPct: 20, endPct: 20 },
    triangle: { unlockRound: 3, startPct: 15, endPct: 25 },
    hexagon: { unlockRound: 5, startPct: 10, endPct: 20 },
  },
}

/**
 * Calcula distribuicao de probabilidades de shapes para uma rodada
 * Usa interpolacao linear (lerp) entre startPct e endPct
 *
 * @param round - Numero da rodada
 * @param config - Configuracao de progressao (opcional, usa padrao)
 * @returns Probabilidades normalizadas por shape (soma = 100)
 */
export function getShapeChances(
  round: number,
  config: ShapeProgressionConfig = SHAPE_PROGRESSION
): Record<PillShape, number> {
  const { maxRound, rules } = config
  const clampedRound = Math.max(1, Math.min(round, maxRound))

  const rawWeights: Record<PillShape, number> = {
    round: 0,
    capsule: 0,
    oval: 0,
    triangle: 0,
    hexagon: 0,
  }

  let totalWeight = 0

  for (const [shape, rule] of Object.entries(rules)) {
    const shapeType = shape as PillShape

    // Shape nao desbloqueada ainda
    if (clampedRound < rule.unlockRound) {
      rawWeights[shapeType] = 0
      continue
    }

    // Interpolacao linear entre startPct e endPct
    const roundSpan = maxRound - rule.unlockRound
    const t = roundSpan <= 0 ? 1 : (clampedRound - rule.unlockRound) / roundSpan

    const value = rule.startPct + (rule.endPct - rule.startPct) * t
    rawWeights[shapeType] = value
    totalWeight += value
  }

  // Normaliza para 100%
  const normalized: Record<PillShape, number> = { ...rawWeights }

  if (totalWeight > 0) {
    for (const shape of Object.keys(normalized) as PillShape[]) {
      normalized[shape] = Number(((normalized[shape] * 100) / totalWeight).toFixed(2))
    }
  }

  return normalized
}

/**
 * Sorteia uma shape baseada nas chances da rodada
 *
 * @param round - Numero da rodada
 * @param config - Configuracao de progressao (opcional)
 * @returns Shape sorteada
 */
export function rollShape(
  round: number,
  config: ShapeProgressionConfig = SHAPE_PROGRESSION
): PillShape {
  const chances = getShapeChances(round, config)
  const randomValue = Math.random() * 100

  let accumulated = 0
  for (const [shape, chance] of Object.entries(chances)) {
    accumulated += chance
    if (randomValue <= accumulated) {
      return shape as PillShape
    }
  }

  // Fallback (nunca deve acontecer se chances estao normalizadas)
  return 'round'
}

/**
 * Distribui shapes proporcionalmente baseado nas porcentagens da rodada
 * Mesmo algoritmo usado para distribuir tipos de pilula
 *
 * @param count - Quantidade total de shapes a distribuir
 * @param round - Numero da rodada
 * @param config - Configuracao de progressao (opcional)
 * @returns Quantidade de cada shape a ser distribuida
 */
export function distributeShapes(
  count: number,
  round: number,
  config: ShapeProgressionConfig = SHAPE_PROGRESSION
): Record<PillShape, number> {
  const chances = getShapeChances(round, config)

  const distribution: Record<PillShape, number> = {
    round: 0,
    capsule: 0,
    oval: 0,
    triangle: 0,
    hexagon: 0,
  }

  // Calcula quantidades ideais e floors
  const idealAmounts: Array<{
    shape: PillShape
    ideal: number
    floor: number
    remainder: number
  }> = []

  for (const [shape, chance] of Object.entries(chances)) {
    const shapeType = shape as PillShape
    if (chance <= 0) continue

    const ideal = (count * chance) / 100
    const floor = Math.floor(ideal)
    const remainder = ideal - floor

    distribution[shapeType] = floor
    idealAmounts.push({ shape: shapeType, ideal, floor, remainder })
  }

  // Distribui pilulas restantes para quem tem maior remainder
  let distributed = Object.values(distribution).reduce((a, b) => a + b, 0)
  let remaining = count - distributed

  // Ordena por remainder decrescente
  idealAmounts.sort((a, b) => b.remainder - a.remainder)

  for (const item of idealAmounts) {
    if (remaining <= 0) break
    distribution[item.shape]++
    remaining--
  }

  return distribution
}

