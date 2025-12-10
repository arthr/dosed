import { v4 as uuidv4 } from 'uuid'
import type { PillShape, ShapeQuest, QuestConfig } from '@/types'

/**
 * Configuracao padrao de quests
 */
export const DEFAULT_QUEST_CONFIG: QuestConfig = {
  minLength: 2,
  maxLength: 3,
  increaseLengthAfterRound: 5,
}

/**
 * Gera uma sequencia aleatoria de shapes BASEADA no pool disponivel
 * Garante que a sequencia seja realizavel
 * @param length - Tamanho desejado da sequencia
 * @param shapeCounts - Contagem de shapes disponiveis no pool
 */
function generateSequenceFromPool(
  length: number,
  shapeCounts: Record<PillShape, number>
): PillShape[] {
  // Cria pool de shapes disponiveis
  const availablePool: PillShape[] = []
  for (const [shape, count] of Object.entries(shapeCounts)) {
    for (let i = 0; i < count; i++) {
      availablePool.push(shape as PillShape)
    }
  }

  // Limita tamanho ao pool disponivel
  const actualLength = Math.min(length, availablePool.length)
  const sequence: PillShape[] = []
  const poolCopy = [...availablePool]

  // Seleciona shapes aleatorias sem repeticao
  for (let i = 0; i < actualLength; i++) {
    const randomIndex = Math.floor(Math.random() * poolCopy.length)
    sequence.push(poolCopy[randomIndex])
    poolCopy.splice(randomIndex, 1)
  }

  return sequence
}

/**
 * Gera um novo Shape Quest
 * Ao completar, jogador recebe +1 Pill Coin
 * @param round - Rodada atual (afeta tamanho da sequencia)
 * @param shapeCounts - Contagem de shapes no pool atual
 * @param config - Configuracao de quest (opcional)
 */
export function generateShapeQuest(
  round: number,
  shapeCounts: Record<PillShape, number>,
  config: QuestConfig = DEFAULT_QUEST_CONFIG
): ShapeQuest {
  const totalPills = Object.values(shapeCounts).reduce((sum, count) => sum + count, 0)

  // Determina tamanho da sequencia
  let length = config.minLength
  if (round >= config.increaseLengthAfterRound) {
    // Apos rodada X, 50% de chance de sequencia maior
    length = Math.random() < 0.5 ? config.minLength : config.maxLength
  }
  // Limita ao total de pilulas disponiveis
  length = Math.min(length, totalPills)

  return {
    id: uuidv4(),
    sequence: generateSequenceFromPool(length, shapeCounts),
    progress: 0,
    completed: false,
  }
}

/**
 * Resultado da verificacao de progresso do quest
 */
export interface QuestProgressResult {
  /** Quest atualizado */
  updatedQuest: ShapeQuest
  /** Se o quest foi completado nesta verificacao */
  justCompleted: boolean
  /** Se o progresso foi resetado (errou a shape) */
  wasReset: boolean
}

/**
 * Verifica progresso do quest ao consumir pilula
 * @param quest - Quest atual do jogador
 * @param consumedShape - Shape da pilula consumida
 * @returns updatedQuest, justCompleted e wasReset
 * Se justCompleted = true, caller deve dar +1 Pill Coin ao jogador
 * Se wasReset = true, caller deve mostrar feedback de reset
 */
export function checkQuestProgress(
  quest: ShapeQuest,
  consumedShape: PillShape
): QuestProgressResult {
  // Quest ja completado, nao faz nada
  if (quest.completed) {
    return { updatedQuest: quest, justCompleted: false, wasReset: false }
  }

  const expectedShape = quest.sequence[quest.progress]

  // Shape correta: avanca progresso
  if (consumedShape === expectedShape) {
    const newProgress = quest.progress + 1
    const justCompleted = newProgress >= quest.sequence.length

    return {
      updatedQuest: {
        ...quest,
        progress: newProgress,
        completed: justCompleted,
      },
      justCompleted,
      wasReset: false,
    }
  }

  // Shape errada: reseta progresso (apenas se tinha progresso)
  const hadProgress = quest.progress > 0
  return {
    updatedQuest: { ...quest, progress: 0 },
    justCompleted: false,
    wasReset: hadProgress,
  }
}

