import type {
  AIDecisionContext,
  InventoryItem,
  ItemType,
  Pill,
  PillShape,
  PillType,
  Player,
  PoolRiskAnalysis,
  PoolRiskLevel,
} from '@/types'
import { ITEM_CATALOG } from './itemCatalog'

/**
 * Logica da IA para selecao de pilulas e uso de itens
 */

// ============================================
// Constantes
// ============================================

/** Chance base da IA usar um item (35%) */
const AI_ITEM_USE_CHANCE = 0.35

/** Prioridade de itens por tipo (maior = mais prioritario) */
const ITEM_PRIORITY: Record<ItemType, number> = {
  shield: 10,
  pocket_pill: 9,
  scanner: 7,
  shape_scanner: 7,
  handcuffs: 6,
  force_feed: 5,
  inverter: 4,
  double: 3,
  shape_bomb: 3,
  discard: 2,
  shuffle: 1,
}

// ============================================
// Analise de Risco (usa typeCounts publico)
// ============================================

/**
 * Calcula probabilidade de cada tipo nas pilulas NAO reveladas
 * Usa typeCounts (publico) - tipos revelados = probabilidades reais
 */
export function calculateTypeOdds(ctx: AIDecisionContext): Record<PillType, number> {
  const { typeCounts, revealedPills, pillPool } = ctx

  // Conta tipos das pilulas reveladas
  const revealedTypeCounts: Record<PillType, number> = {
    SAFE: 0,
    DMG_LOW: 0,
    DMG_HIGH: 0,
    FATAL: 0,
    HEAL: 0,
    LIFE: 0,
  }

  for (const pillId of revealedPills) {
    const pill = pillPool.find((p) => p.id === pillId)
    if (pill) {
      revealedTypeCounts[pill.type]++
    }
  }

  // Calcula tipos restantes no pool nao-revelado
  const unrevealed = pillPool.length - revealedPills.length

  // Converte para probabilidades
  const odds: Record<PillType, number> = {
    SAFE: 0,
    DMG_LOW: 0,
    DMG_HIGH: 0,
    FATAL: 0,
    HEAL: 0,
    LIFE: 0,
  }

  for (const type of Object.keys(typeCounts) as PillType[]) {
    const remaining = typeCounts[type] - revealedTypeCounts[type]
    odds[type] = unrevealed > 0 ? remaining / unrevealed : 0
  }

  return odds
}

/**
 * Analisa nivel de risco do pool atual
 */
export function analyzePoolRisk(ctx: AIDecisionContext): PoolRiskAnalysis {
  const odds = calculateTypeOdds(ctx)
  const poolSize = ctx.pillPool.length - ctx.revealedPills.length

  const damageOdds = odds.DMG_LOW + odds.DMG_HIGH + odds.FATAL
  const safeOdds = odds.SAFE + odds.HEAL + odds.LIFE

  // Determina nivel de risco
  let level: PoolRiskLevel
  let recommendation: 'attack' | 'defend' | 'neutral'

  // CRITICO: FATAL presente em pool pequeno
  if (odds.FATAL > 0 && poolSize <= 3) {
    level = 'critical'
    recommendation = 'defend'
  }
  // ALTO: Maioria e dano
  else if (damageOdds > 0.5) {
    level = 'high'
    recommendation = 'defend'
  }
  // BAIXO: Maioria e seguro
  else if (safeOdds > 0.5) {
    level = 'low'
    recommendation = 'attack'
  }
  // MEDIO: Equilibrado
  else {
    level = 'medium'
    recommendation = 'neutral'
  }

  return { level, typeOdds: odds, damageOdds, safeOdds, recommendation }
}

/**
 * Deduz informacao de pilulas baseado em typeCounts + reveladas
 * Exemplo: Se typeCounts.FATAL=1 e uma revelada e FATAL, as outras NAO sao FATAL
 * Usado apenas por nivel Insane (config.usesDeduction)
 */
export function deduceNonRevealedTypes(ctx: AIDecisionContext): Map<string, PillType[]> {
  const { typeCounts, revealedPills, pillPool } = ctx
  const deductions = new Map<string, PillType[]>()

  // Para cada tipo, verifica se todas instancias estao reveladas
  const revealedByType: Record<PillType, number> = {
    SAFE: 0,
    DMG_LOW: 0,
    DMG_HIGH: 0,
    FATAL: 0,
    HEAL: 0,
    LIFE: 0,
  }

  for (const pillId of revealedPills) {
    const pill = pillPool.find((p) => p.id === pillId)
    if (pill) revealedByType[pill.type]++
  }

  // Tipos esgotados (todas reveladas)
  const exhaustedTypes: PillType[] = []
  for (const [type, total] of Object.entries(typeCounts)) {
    if (revealedByType[type as PillType] >= total && total > 0) {
      exhaustedTypes.push(type as PillType)
    }
  }

  // Para cada pilula nao-revelada, deduz tipos impossiveis
  const allTypes: PillType[] = ['SAFE', 'DMG_LOW', 'DMG_HIGH', 'FATAL', 'HEAL', 'LIFE']
  for (const pill of pillPool) {
    if (!revealedPills.includes(pill.id)) {
      // Esta pilula NAO pode ser nenhum tipo esgotado
      const possibleTypes = allTypes.filter((t) => !exhaustedTypes.includes(t))
      deductions.set(pill.id, possibleTypes)
    }
  }

  return deductions
}

/**
 * Calcula nivel de risco do pool de forma simplificada
 * Versao rapida para uso em decisoes simples
 */
export function calculatePoolRisk(
  typeCounts: Record<PillType, number>,
  poolSize: number
): PoolRiskLevel {
  const total = Object.values(typeCounts).reduce((sum, n) => sum + n, 0)
  if (total === 0) return 'low'

  const damageCount = typeCounts.DMG_LOW + typeCounts.DMG_HIGH + typeCounts.FATAL
  const safeCount = typeCounts.SAFE + typeCounts.HEAL + typeCounts.LIFE

  // CRITICO: FATAL presente em pool pequeno
  if (typeCounts.FATAL > 0 && poolSize <= 3) {
    return 'critical'
  }
  // ALTO: Maioria e dano
  if (damageCount / total > 0.5) {
    return 'high'
  }
  // BAIXO: Maioria e seguro
  if (safeCount / total > 0.5) {
    return 'low'
  }
  // MEDIO: Equilibrado
  return 'medium'
}

// ============================================
// Selecao de Pilulas
// ============================================

/**
 * Seleciona uma pilula aleatoria do pool disponivel
 * @param pillPool Array de pilulas disponiveis (nao reveladas)
 * @returns ID da pilula selecionada ou null se pool vazio
 */
export function selectRandomPill(pillPool: Pill[]): string | null {
  // Filtra apenas pilulas nao reveladas
  const availablePills = pillPool.filter((pill) => !pill.isRevealed)

  if (availablePills.length === 0) {
    return null
  }

  // Seleciona indice aleatorio
  const randomIndex = Math.floor(Math.random() * availablePills.length)
  return availablePills[randomIndex].id
}

/**
 * Retorna um delay aleatorio para simular "pensamento" da IA
 * @returns Delay em milissegundos (entre 1000ms e 3000ms)
 */
export function getAIThinkingDelay(): number {
  const minDelay = 1000 // 1 segundo
  const maxDelay = 3000 // 3 segundos
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay
}

// ============================================
// Decisao de Uso de Itens
// ============================================

/**
 * Decide se a IA deve usar um item neste turno
 * @param player Jogador IA
 * @returns true se deve usar item
 */
export function shouldAIUseItem(player: Player): boolean {
  // Sem itens, nao pode usar
  if (player.inventory.items.length === 0) {
    return false
  }

  // Rola chance base
  return Math.random() < AI_ITEM_USE_CHANCE
}

/**
 * Seleciona qual item a IA deve usar com base em heuristicas
 * @param player Jogador IA
 * @param pillPool Pool de pilulas na mesa
 * @returns Item selecionado ou null
 */
export function selectAIItem(
  player: Player,
  pillPool: Pill[]
): InventoryItem | null {
  const items = player.inventory.items

  if (items.length === 0) return null

  // Calcula scores para cada item baseado em contexto
  const scoredItems = items.map((item) => ({
    item,
    score: calculateItemScore(item.type, player, pillPool),
  }))

  // Ordena por score (maior primeiro)
  scoredItems.sort((a, b) => b.score - a.score)

  // Retorna item com maior score (se score > 0)
  const best = scoredItems[0]
  return best.score > 0 ? best.item : null
}

/**
 * Calcula score de um item baseado no contexto atual
 */
function calculateItemScore(
  itemType: ItemType,
  player: Player,
  pillPool: Pill[]
): number {
  const basePriority = ITEM_PRIORITY[itemType]
  let contextBonus = 0

  const resistancePercent = player.resistance / player.maxResistance
  const isLowLife = player.lives <= 1
  const isLowResistance = resistancePercent < 0.5
  const hasManyPills = pillPool.length >= 4

  switch (itemType) {
    case 'shield':
      // Shield e muito valioso se vida baixa
      if (isLowLife) contextBonus = 20
      break

    case 'pocket_pill':
      // Pocket Pill e util se resistencia baixa
      if (isLowResistance) contextBonus = 15
      break

    case 'scanner':
      // Scanner e mais util com muitas pilulas
      if (hasManyPills) contextBonus = 10
      break

    case 'handcuffs':
      // Handcuffs sempre e util
      contextBonus = 5
      break

    case 'force_feed':
      // Force Feed e bom se tem poucas pilulas (mais chance de FATAL)
      if (pillPool.length <= 3) contextBonus = 8
      break

    case 'discard':
      // Discard e util para remover pilula suspeita
      contextBonus = 3
      break

    case 'shape_bomb':
      // Shape Bomb e mais util com muitas pilulas da mesma shape
      if (hasManyPills) contextBonus = 8
      break

    case 'shape_scanner':
      // Shape Scanner e mais util com muitas pilulas
      if (hasManyPills) contextBonus = 10
      break

    default:
      contextBonus = 0
  }

  return basePriority + contextBonus
}

/**
 * Conta pills por shape no pool
 */
function countPillsByShape(pillPool: Pill[]): Record<PillShape, number> {
  const counts: Partial<Record<PillShape, number>> = {}
  for (const pill of pillPool) {
    const shape = pill.visuals.shape
    counts[shape] = (counts[shape] || 0) + 1
  }
  return counts as Record<PillShape, number>
}

/**
 * Encontra uma pill da shape com mais ocorrencias no pool
 * @param pillPool Pool de pilulas
 * @param excludeRevealed Se true, nao conta pills ja reveladas (para shape_scanner)
 * @param revealedPills Lista de IDs de pills reveladas
 */
function findPillOfMostCommonShape(
  pillPool: Pill[],
  excludeRevealed: boolean = false,
  revealedPills: string[] = []
): string | undefined {
  const relevantPills = excludeRevealed
    ? pillPool.filter((p) => !revealedPills.includes(p.id))
    : pillPool

  if (relevantPills.length === 0) return undefined

  // Conta pills por shape
  const shapeCounts = countPillsByShape(relevantPills)

  // Encontra shape com mais pills
  let maxCount = 0
  let bestShape: PillShape | null = null
  for (const [shape, count] of Object.entries(shapeCounts)) {
    if (count > maxCount) {
      maxCount = count
      bestShape = shape as PillShape
    }
  }

  if (!bestShape) return undefined

  // Retorna primeira pill dessa shape
  const targetPill = pillPool.find((p) => p.visuals.shape === bestShape)
  return targetPill?.id
}

/**
 * Seleciona alvo automatico para o item da IA
 * @param itemType Tipo do item
 * @param pillPool Pool de pilulas
 * @param opponentId ID do oponente
 * @param revealedPills Lista de IDs de pills reveladas (para shape_scanner)
 * @returns ID do alvo ou undefined se nao precisa de alvo
 */
export function selectAIItemTarget(
  itemType: ItemType,
  pillPool: Pill[],
  opponentId: string,
  revealedPills: string[] = []
): string | undefined {
  const itemDef = ITEM_CATALOG[itemType]

  // Casos especiais para itens de shape
  switch (itemType) {
    case 'shape_bomb':
      // Seleciona pill da shape com mais pilulas (maximiza impacto)
      return findPillOfMostCommonShape(pillPool) ?? selectRandomPill(pillPool) ?? undefined

    case 'shape_scanner':
      // Seleciona pill da shape com mais pilulas NAO reveladas (maximiza info)
      return findPillOfMostCommonShape(pillPool, true, revealedPills) ?? selectRandomPill(pillPool) ?? undefined
  }

  // Logica padrao por targetType
  switch (itemDef.targetType) {
    case 'self':
    case 'table':
      // Nao precisa de alvo
      return undefined

    case 'opponent':
      // Alvo e o oponente
      return opponentId

    case 'pill':
    case 'pill_to_opponent':
      // Seleciona pilula aleatoria
      return selectRandomPill(pillPool) ?? undefined

    default:
      return undefined
  }
}

/**
 * Verifica se o item requer selecao de alvo
 */
export function itemRequiresTarget(itemType: ItemType): boolean {
  const itemDef = ITEM_CATALOG[itemType]
  return itemDef.targetType !== 'self' && itemDef.targetType !== 'table'
}

