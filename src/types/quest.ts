import type { PillShape } from './pill'

/**
 * Objetivo de sequencia de shapes
 * Ao completar, jogador recebe +1 Pill Coin
 */
export interface ShapeQuest {
  /** ID unico do objetivo */
  id: string
  /** Sequencia de shapes a consumir em ordem */
  sequence: PillShape[]
  /** Indice da proxima shape esperada (0 = inicio) */
  progress: number
  /** Se o objetivo foi completado nesta rodada */
  completed: boolean
}

/**
 * Configuracao de geracao de quests
 */
export interface QuestConfig {
  /** Tamanho minimo da sequencia */
  minLength: number
  /** Tamanho maximo da sequencia */
  maxLength: number
  /** Rodada a partir da qual sequencias maiores podem aparecer */
  increaseLengthAfterRound: number
}
