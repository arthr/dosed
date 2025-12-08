import type { PillType } from '@/types'

/**
 * Regra de progressao para um tipo de pilula
 */
export interface PillRule {
  /** Rodada minima para a pilula comecar a aparecer */
  unlockRound: number
  /** Probabilidade (%) no momento do desbloqueio */
  startPct: number
  /** Probabilidade (%) na rodada maxima (maxRound) */
  endPct: number
}

/**
 * Configuracao completa de progressao
 */
export interface ProgressionConfig {
  /** Rodada teto para interpolacao */
  maxRound: number
  /** Regras por tipo de pilula */
  rules: Record<PillType, PillRule>
}

/**
 * Configuracao padrao - Single Source of Truth do balanceamento
 *
 * NOTAS DE DESIGN:
 * - Rodada 1 ja tem algum risco (DMG_HIGH 15%) para criar tensao imediata
 * - HEAL desbloqueia rodada 2, ANTES de FATAL, como "valvula de escape"
 * - FATAL limitado a 18% max para evitar late game muito punitivo/aleatorio
 * - LIFE desativado (unlockRound: 99) - ativar quando pronto
 * - maxRound 15 para evitar estagnacao em partidas longas
 */
export const PROGRESSION: ProgressionConfig = {
  maxRound: 15,
  rules: {
    SAFE: { unlockRound: 1, startPct: 45, endPct: 10 },
    DMG_LOW: { unlockRound: 1, startPct: 30, endPct: 15 },
    DMG_HIGH: { unlockRound: 1, startPct: 15, endPct: 25 },
    HEAL: { unlockRound: 2, startPct: 10, endPct: 15 },
    FATAL: { unlockRound: 4, startPct: 5, endPct: 18 },
    LIFE: { unlockRound: 99, startPct: 0, endPct: 0 },
  },
}

/**
 * Interpolacao linear entre dois valores
 * @param start - Valor inicial
 * @param end - Valor final
 * @param t - Progresso (0 a 1)
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

/**
 * Calcula distribuicao de probabilidades para uma rodada
 * @param round - Numero da rodada atual
 * @param config - Configuracao de progressao (opcional, usa PROGRESSION)
 * @returns Record com probabilidades normalizadas (soma = 100)
 */
export function getPillChances(
  round: number,
  config: ProgressionConfig = PROGRESSION
): Record<PillType, number> {
  const { maxRound, rules } = config
  const clampedRound = Math.max(1, Math.min(round, maxRound))

  // 1. Calcula pesos brutos
  const rawWeights: Record<PillType, number> = {
    SAFE: 0,
    DMG_LOW: 0,
    DMG_HIGH: 0,
    FATAL: 0,
    HEAL: 0,
    LIFE: 0,
  }

  let totalWeight = 0

  for (const [type, rule] of Object.entries(rules)) {
    const pillType = type as PillType

    // Tipo nao desbloqueado ainda
    if (clampedRound < rule.unlockRound) {
      rawWeights[pillType] = 0
      continue
    }

    // Calcula progresso (t) da interpolacao
    const roundSpan = maxRound - rule.unlockRound
    const t = roundSpan <= 0 ? 1 : (clampedRound - rule.unlockRound) / roundSpan

    const value = lerp(rule.startPct, rule.endPct, t)
    rawWeights[pillType] = value
    totalWeight += value
  }

  // 2. Normaliza para 100%
  const normalized: Record<PillType, number> = { ...rawWeights }

  if (totalWeight > 0) {
    for (const type of Object.keys(normalized) as PillType[]) {
      normalized[type] = Number(((normalized[type] * 100) / totalWeight).toFixed(2))
    }
  }

  return normalized
}

/**
 * Sorteia um tipo de pilula baseado nas chances da rodada
 * @param round - Numero da rodada atual
 * @param config - Configuracao de progressao
 */
export function rollPillType(
  round: number,
  config: ProgressionConfig = PROGRESSION
): PillType {
  const chances = getPillChances(round, config)
  const randomValue = Math.random() * 100

  let accumulated = 0
  for (const [type, chance] of Object.entries(chances)) {
    accumulated += chance
    if (randomValue <= accumulated) {
      return type as PillType
    }
  }

  return 'SAFE' // Fallback de seguranca
}
