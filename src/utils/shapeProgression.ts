import type { Pill, PillShape } from '@/types'

/**
 * Lista de todas as shapes disponiveis
 */
export const ALL_SHAPES: PillShape[] = [
    'capsule',
    'round',
    'triangle',
    'oval',
    'cross',
    'heart',
    'flower',
    'star',
    'pumpkin',
    'coin',
    'bear',
    'gem',
    'skull',
    'domino',
    'pineapple',
    'fruit',
]

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
 * Configuracao padrao de progressao de shapes (16 shapes)
 *
 * NOTAS DE DESIGN:
 * - Rodada 1: capsule, round (2 basicas)
 * - Rodada 2: + triangle, oval (4)
 * - Rodada 3: + cross, heart (6)
 * - Rodada 4: + flower, star (8)
 * - Rodada 5: + pumpkin, coin (10)
 * - Rodada 6: + bear, gem (12)
 * - Rodada 7: + skull, domino (14)
 * - Rodada 8+: + pineapple, fruit (16 - todas)
 */
export const SHAPE_PROGRESSION: ShapeProgressionConfig = {
    maxRound: 15,
    rules: {
        capsule: { unlockRound: 1, startPct: 0, endPct: 0 },
        round: { unlockRound: 1, startPct: 45, endPct: 4 },
        triangle: { unlockRound: 1, startPct: 0, endPct: 0 },
        oval: { unlockRound: 1, startPct: 0, endPct: 0 },
        cross: { unlockRound: 1, startPct: 0, endPct: 0 },
        heart: { unlockRound: 1, startPct: 0, endPct: 0 },
        flower: { unlockRound: 1, startPct: 18, endPct: 8 },
        star: { unlockRound: 1, startPct: 0, endPct: 0 },
        pumpkin: { unlockRound: 3, startPct: 45, endPct: 7 },
        coin: { unlockRound: 1, startPct: 0, endPct: 0 },
        bear: { unlockRound: 5, startPct: 45, endPct: 9 },
        gem: { unlockRound: 1, startPct: 0, endPct: 0 },
        skull: { unlockRound: 3, startPct: 15, endPct: 20 },
        domino: { unlockRound: 7, startPct: 0, endPct: 0 },
        pineapple: { unlockRound: 8, startPct: 0, endPct: 0 },
        fruit: { unlockRound: 1, startPct: 50, endPct: 4 },
    },
}

/**
 * Cria um objeto Record<PillShape, number> inicializado com zeros
 */
function createEmptyShapeCounts(): Record<PillShape, number> {
    return {
        capsule: 0,
        round: 0,
        triangle: 0,
        oval: 0,
        cross: 0,
        heart: 0,
        flower: 0,
        star: 0,
        pumpkin: 0,
        coin: 0,
        bear: 0,
        gem: 0,
        skull: 0,
        domino: 0,
        pineapple: 0,
        fruit: 0,
    }
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

    const rawWeights = createEmptyShapeCounts()
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
    const distribution = createEmptyShapeCounts()

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

/**
 * Conta quantidade de cada shape no pool de pilulas
 *
 * @param pills - Array de pilulas
 * @returns Contagem de cada shape
 */
export function countPillShapes(pills: Pill[]): Record<PillShape, number> {
    const counts = createEmptyShapeCounts()

    for (const pill of pills) {
        counts[pill.visuals.shape]++
    }

    return counts
}

/**
 * Retorna um objeto Record<PillShape, number> inicializado com zeros
 * Util para inicializacao de estado
 */
export function getInitialShapeCounts(): Record<PillShape, number> {
    return createEmptyShapeCounts()
}
