import { v4 as uuidv4 } from 'uuid'
import type { Pill, PillConfig, PillType } from '@/types'
import {
  FATAL_DAMAGE,
  HIDDEN_PILL_HEX,
  PILL_CONFIG,
  PILL_HEX_COLORS,
  PILL_SHAPES,
} from './constants'
import { rollPillType, getPillCount, distributePillTypes } from './pillProgression'

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
      livesRestore: stats.livesRestore,
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
 * Gera um pool de pilulas para uma rodada com progressao dinamica
 * Usa distribuicao PROPORCIONAL - a porcentagem define a quantidade exata de cada tipo
 *
 * @param round - Numero da rodada (determina quantidade e tipos disponiveis)
 * @param config - Configuracao de dano/cura (opcional)
 * @returns Array de pilulas embaralhado com isRevealed = false
 */
export function generatePillPool(
  round: number = 1,
  config: PillConfig = PILL_CONFIG
): Pill[] {
  const count = getPillCount(round)
  const distribution = distributePillTypes(count, round)
  const pills: Pill[] = []

  // Cria pilulas baseado na distribuicao proporcional
  for (const [type, typeCount] of Object.entries(distribution)) {
    for (let i = 0; i < typeCount; i++) {
      pills.push(createPill(type as PillType, config))
    }
  }

  // Embaralha para ordem nao previsivel
  return shuffleArray(pills)
}

/**
 * Gera um pool de pilulas com quantidade especifica (override manual)
 * Usa distribuicao PROPORCIONAL - util para testes ou modos especiais
 *
 * @param count - Quantidade de pilulas a gerar
 * @param round - Numero da rodada (determina tipos disponiveis)
 * @param config - Configuracao de dano/cura (opcional)
 * @returns Array de pilulas embaralhado com isRevealed = false
 */
export function generatePillPoolWithCount(
  count: number,
  round: number = 1,
  config: PillConfig = PILL_CONFIG
): Pill[] {
  const distribution = distributePillTypes(count, round)
  const pills: Pill[] = []

  for (const [type, typeCount] of Object.entries(distribution)) {
    for (let i = 0; i < typeCount; i++) {
      pills.push(createPill(type as PillType, config))
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
 * Gera um pool garantindo pelo menos uma pilula de cada tipo especificado
 * Util para balanceamento em partidas
 *
 * @param count - Quantidade de pilulas a gerar
 * @param round - Numero da rodada (determina tipos disponiveis para o resto)
 * @param guaranteedTypes - Tipos garantidos no pool
 * @param config - Configuracao de dano/cura (opcional)
 */
export function generateBalancedPillPool(
  count: number,
  round: number = 1,
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

  // Preenche o resto com pilulas aleatorias baseadas na rodada
  while (pills.length < count) {
    const type = rollPillType(round)
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

