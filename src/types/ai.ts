import type { InventoryItem } from './item'
import type { Pill, PillShape, PillType } from './pill'
import type { Player } from './player'
import type { ShapeQuest } from './quest'

/**
 * Configuracao de comportamento da IA por dificuldade
 */
export interface AIConfig {
  /** Chance base de usar item (0-1) */
  itemUseChance: number
  /** Delay minimo de "pensamento" em ms */
  thinkingDelayMin: number
  /** Delay maximo de "pensamento" em ms */
  thinkingDelayMax: number
  /** Se usa typeCounts para calcular risco/probabilidades */
  usesTypeCounts: boolean
  /** Se considera pilulas reveladas na escolha */
  usesRevealedPills: boolean
  /** Se evita pilulas perigosas reveladas */
  avoidsRevealedDanger: boolean
  /** Se usa deducao logica (ex: se FATAL=1 revelada, outras nao sao FATAL) */
  usesDeduction: boolean
  /** Se prioriza completar Shape Quest */
  prioritizesShapeQuest: boolean
  /** Se usa loja estrategicamente */
  usesStoreStrategically: boolean
  /** Se foca em atacar jogador mais fraco */
  targetsWeakPlayer: boolean
  /** Minimo de coins para sinalizar interesse na loja */
  storeInterestThreshold: number
}

/**
 * Contexto disponivel para decisoes da IA
 * 
 * Nota: typeCounts e shapeCounts sao informacoes PUBLICAS visiveis a todos os jogadores.
 * Eles representam a distribuicao total de pilulas na rodada, permitindo calcular
 * probabilidades baseadas nas pilulas restantes (total - consumidas - reveladas).
 * 
 * @example
 * // Calcular probabilidade de FATAL no pool nao-revelado:
 * const fatalTotal = ctx.typeCounts.FATAL
 * const fatalRevealed = ctx.revealedPills.filter(id =>
 *   ctx.pillPool.find(p => p.id === id)?.type === 'FATAL'
 * ).length
 * const fatalRemaining = fatalTotal - fatalRevealed
 * const unrevealed = ctx.pillPool.length - ctx.revealedPills.length
 * const fatalOdds = unrevealed > 0 ? fatalRemaining / unrevealed : 0
 */
export interface AIDecisionContext {
  /** Jogador IA */
  aiPlayer: Player
  /** Jogador oponente */
  opponent: Player
  /** Pool de pilulas atual */
  pillPool: Pill[]
  /** IDs de pilulas reveladas */
  revealedPills: string[]
  /** Contagem publica de tipos (informacao visivel a todos) */
  typeCounts: Record<PillType, number>
  /** Contagem publica de shapes (informacao visivel a todos) */
  shapeCounts: Record<PillShape, number>
  /** Quest atual da IA (se houver) */
  aiQuest: ShapeQuest | null
  /** Rodada atual */
  round: number
  /** Configuracao da IA */
  config: AIConfig
}

/**
 * Nivel de risco calculado do pool
 */
export type PoolRiskLevel = 'critical' | 'high' | 'medium' | 'low'

/**
 * Analise de risco do pool atual
 */
export interface PoolRiskAnalysis {
  /** Nivel geral de risco */
  level: PoolRiskLevel
  /** Probabilidade de cada tipo (0-1) */
  typeOdds: Record<PillType, number>
  /** Probabilidade de dano (DMG_LOW + DMG_HIGH + FATAL) */
  damageOdds: number
  /** Probabilidade de seguro (SAFE + HEAL + LIFE) */
  safeOdds: number
  /** Recomendacao de acao */
  recommendation: 'attack' | 'defend' | 'neutral'
}

/**
 * Resultado de avaliacao de item
 */
export interface ItemEvaluation {
  /** Item avaliado */
  item: InventoryItem
  /** Score calculado (maior = melhor) */
  score: number
  /** Razao da pontuacao */
  reason: string
}

