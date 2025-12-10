import type { AIConfig, DifficultyLevel } from '@/types'

/**
 * Configuracoes de IA por nivel de dificuldade
 */
export const AI_CONFIGS: Record<DifficultyLevel, AIConfig> = {
  easy: {
    itemUseChance: 0.15,
    thinkingDelayMin: 1500,
    thinkingDelayMax: 3500,
    usesTypeCounts: false,
    usesRevealedPills: false,
    avoidsRevealedDanger: false,
    usesDeduction: false,
    prioritizesShapeQuest: false,
    usesStoreStrategically: false,
    targetsWeakPlayer: false,
    storeInterestThreshold: 999, // Nunca sinaliza
  },
  normal: {
    itemUseChance: 0.35,
    thinkingDelayMin: 1000,
    thinkingDelayMax: 3000,
    usesTypeCounts: true,
    usesRevealedPills: false,
    avoidsRevealedDanger: false,
    usesDeduction: false,
    prioritizesShapeQuest: false,
    usesStoreStrategically: false,
    targetsWeakPlayer: false,
    storeInterestThreshold: 3,
  },
  hard: {
    itemUseChance: 0.55,
    thinkingDelayMin: 800,
    thinkingDelayMax: 2000,
    usesTypeCounts: true,
    usesRevealedPills: true,
    avoidsRevealedDanger: true,
    usesDeduction: false,
    prioritizesShapeQuest: false,
    usesStoreStrategically: true,
    targetsWeakPlayer: true,
    storeInterestThreshold: 2,
  },
  insane: {
    itemUseChance: 0.80,
    thinkingDelayMin: 500,
    thinkingDelayMax: 1200,
    usesTypeCounts: true,
    usesRevealedPills: true,
    avoidsRevealedDanger: true,
    usesDeduction: true,
    prioritizesShapeQuest: true,
    usesStoreStrategically: true,
    targetsWeakPlayer: true,
    storeInterestThreshold: 1,
  },
}

/**
 * Retorna configuracao da IA para dificuldade especificada
 */
export function getAIConfig(difficulty: DifficultyLevel): AIConfig {
  return AI_CONFIGS[difficulty]
}

/**
 * Retorna delay de pensamento aleatorio para dificuldade
 */
export function getAIThinkingDelay(difficulty: DifficultyLevel): number {
  const config = AI_CONFIGS[difficulty]
  const range = config.thinkingDelayMax - config.thinkingDelayMin
  return Math.floor(Math.random() * range) + config.thinkingDelayMin
}

