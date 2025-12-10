import type {
  AIDecisionContext,
  DifficultyLevel,
  InventoryItem,
  ItemEvaluation,
  ItemType,
  Pill,
  PillShape,
  PillType,
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

/** Info de pilula revelada */
interface RevealedPillInfo {
  id: string
  type: PillType
}

/**
 * Mapeia pilulas reveladas com seus tipos
 */
function getRevealedPillsInfo(pillPool: Pill[], revealedPills: string[]): RevealedPillInfo[] {
  return revealedPills
    .map((id) => {
      const pill = pillPool.find((p) => p.id === id)
      return pill ? { id: pill.id, type: pill.type } : null
    })
    .filter((info): info is RevealedPillInfo => info !== null)
}

/**
 * Encontra pilula SAFE revelada
 */
function findSafeRevealedPill(revealedInfo: RevealedPillInfo[]): string | null {
  const safe = revealedInfo.find((p) => p.type === 'SAFE')
  return safe?.id ?? null
}

/**
 * Encontra pilula HEAL revelada
 */
function findHealRevealedPill(revealedInfo: RevealedPillInfo[]): string | null {
  const heal = revealedInfo.find((p) => p.type === 'HEAL')
  return heal?.id ?? null
}

/**
 * Encontra pilula nao revelada
 */
function findUnknownPill(pillPool: Pill[], revealedPills: string[]): string | null {
  const unknown = pillPool.find((p) => !revealedPills.includes(p.id))
  return unknown?.id ?? null
}

/**
 * Encontra pilula do quest (proxima shape esperada na sequencia)
 */
function findQuestPill(
  pillPool: Pill[],
  quest: { sequence: PillShape[]; progress: number },
  revealedPills: string[]
): string | null {
  const targetShape = quest.sequence[quest.progress]
  if (!targetShape) return null

  const questPill = pillPool.find(
    (p) => p.visuals.shape === targetShape && !revealedPills.includes(p.id)
  )
  return questPill?.id ?? null
}

/**
 * Selecao inteligente de pilula (Hard/Insane)
 * Usa typeCounts, deducao e analise de risco
 */
function selectSmartPill(ctx: AIDecisionContext): string | null {
  const { pillPool, revealedPills, config, aiQuest } = ctx

  // Mapeia pilulas reveladas com seus tipos
  const revealedInfo = getRevealedPillsInfo(pillPool, revealedPills)

  // Calcula probabilidades e deducoes
  const riskAnalysis = analyzePoolRisk(ctx)
  const deductions = config.usesDeduction ? deduceNonRevealedTypes(ctx) : null

  // Prioridade 1: Shape Quest (Insane only)
  if (config.prioritizesShapeQuest && aiQuest) {
    const questPill = findQuestPill(pillPool, aiQuest, revealedPills)
    if (questPill) return questPill
  }

  // Prioridade 2: Pilulas seguras reveladas
  const safePill = findSafeRevealedPill(revealedInfo)
  if (safePill) return safePill

  // Prioridade 3: Pilulas de cura (se precisar)
  if (ctx.aiPlayer.resistance < ctx.aiPlayer.maxResistance * 0.5) {
    const healPill = findHealRevealedPill(revealedInfo)
    if (healPill) return healPill
  }

  // Prioridade 4 (Insane): Usar deducao para encontrar pilula "segura"
  if (deductions) {
    for (const pill of pillPool) {
      if (revealedPills.includes(pill.id)) continue
      const possibleTypes = deductions.get(pill.id)
      if (possibleTypes) {
        const canBeDangerous =
          possibleTypes.includes('FATAL') || possibleTypes.includes('DMG_HIGH')
        if (!canBeDangerous) {
          return pill.id // Garantido nao ser perigosa!
        }
      }
    }
  }

  // Prioridade 5: Se risco baixo, pode arriscar qualquer uma
  if (riskAnalysis.level === 'low') {
    return selectRandomPill(pillPool)
  }

  // Prioridade 6: Evitar perigosas reveladas, pegar nao-revelada
  if (config.avoidsRevealedDanger) {
    const unknownPill = findUnknownPill(pillPool, revealedPills)
    if (unknownPill) return unknownPill
  }

  // Fallback: aleatorio
  return selectRandomPill(pillPool)
}

/**
 * Seleciona pilula para IA consumir baseado na dificuldade
 * Funcao principal de selecao de pilulas
 */
export function selectAIPill(ctx: AIDecisionContext): string | null {
  const { pillPool, config } = ctx

  // Easy: aleatorio puro
  if (!config.usesRevealedPills && !config.usesTypeCounts) {
    return selectRandomPill(pillPool)
  }

  // Normal: aleatorio (typeCounts usado so para itens)
  if (!config.usesRevealedPills) {
    return selectRandomPill(pillPool)
  }

  // Hard/Insane: considera reveladas + typeCounts
  return selectSmartPill(ctx)
}

/**
 * Selecao aleatoria simples de pilula
 * Usado pelo nivel Easy e como fallback para outros niveis
 * @param pillPool Array de pilulas disponiveis
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
 * Usa config.itemUseChance com bonus se risco alto e tem item defensivo
 */
export function shouldAIUseItem(ctx: AIDecisionContext): boolean {
  const { aiPlayer, config } = ctx

  // Sem itens = nao pode usar
  if (aiPlayer.inventory.items.length === 0) return false

  // Bonus de chance se risco alto/critico e tem item defensivo
  let useChance = config.itemUseChance
  if (config.usesTypeCounts) {
    const risk = analyzePoolRisk(ctx)
    const hasDefensiveItem = aiPlayer.inventory.items.some(
      (i) => i.type === 'shield' || i.type === 'pocket_pill'
    )
    if ((risk.level === 'critical' || risk.level === 'high') && hasDefensiveItem) {
      useChance = Math.min(useChance + 0.25, 1.0)
    }
  }

  return Math.random() < useChance
}

/**
 * Encontra shape com mais pilulas no pool
 */
function findShapeWithMostPills(pillPool: Pill[]): { shape: PillShape; count: number } | null {
  const counts: Partial<Record<PillShape, number>> = {}
  for (const pill of pillPool) {
    const shape = pill.visuals.shape
    counts[shape] = (counts[shape] || 0) + 1
  }

  let maxShape: PillShape | null = null
  let maxCount = 0
  for (const [shape, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count
      maxShape = shape as PillShape
    }
  }

  return maxShape ? { shape: maxShape, count: maxCount } : null
}

/**
 * Avalia valor de um item no contexto atual
 * Usa analise de risco baseada em typeCounts
 */
function evaluateItem(item: InventoryItem, ctx: AIDecisionContext): ItemEvaluation {
  const { aiPlayer, opponent, pillPool, config } = ctx

  const basePriority = ITEM_PRIORITY[item.type]
  let contextBonus = 0
  let reason = 'prioridade base'

  // Calcular analise de risco se config permitir
  const riskAnalysis = config.usesTypeCounts ? analyzePoolRisk(ctx) : null

  const aiResistPct = aiPlayer.resistance / aiPlayer.maxResistance
  const oppResistPct = opponent.resistance / opponent.maxResistance
  const isAILowLife = aiPlayer.lives <= 1
  const isOppLowResist = oppResistPct < 0.4
  const hasManyPills = pillPool.length >= 4

  switch (item.type) {
    case 'shield':
      // Prioridade MAXIMA se risco critico/alto
      if (riskAnalysis?.level === 'critical') {
        contextBonus = 35
        reason = 'risco CRITICO - protecao essencial'
      } else if (riskAnalysis?.level === 'high') {
        contextBonus = 28
        reason = 'risco alto - protecao recomendada'
      } else if (isAILowLife) {
        contextBonus = 25
        reason = 'vida critica - protecao maxima'
      }
      break

    case 'pocket_pill':
      // Mais valioso se risco alto E resistencia baixa
      if (riskAnalysis?.level === 'high' && aiResistPct < 0.5) {
        contextBonus = 28
        reason = 'risco alto + resistencia baixa'
      } else if (aiResistPct < 0.5) {
        contextBonus = 20
        reason = 'resistencia baixa - cura urgente'
      }
      break

    case 'scanner':
    case 'shape_scanner':
      // Menos valioso se maioria e segura (typeCounts mostra)
      if (riskAnalysis?.safeOdds && riskAnalysis.safeOdds > 0.6) {
        contextBonus = 5
        reason = 'maioria segura - info menos valiosa'
      } else if (hasManyPills) {
        contextBonus = 15
        reason = 'muitas pilulas - informacao valiosa'
      }
      break

    case 'force_feed':
      // MUITO valioso se FATAL presente e pool pequeno
      if (riskAnalysis?.typeOdds.FATAL && riskAnalysis.typeOdds.FATAL > 0.2) {
        contextBonus = 30
        reason = `${Math.round(riskAnalysis.typeOdds.FATAL * 100)}% chance FATAL - forcar!`
      } else if (config.targetsWeakPlayer && isOppLowResist) {
        contextBonus = 20
        reason = 'oponente vulneravel - forcar consumo'
      }
      break

    case 'handcuffs':
      // Valioso em risco critico (forca oponente a encarar perigo)
      if (riskAnalysis?.level === 'critical') {
        contextBonus = 25
        reason = 'risco critico - forcar oponente a encarar'
      } else if (config.targetsWeakPlayer && isOppLowResist) {
        contextBonus = 15
        reason = 'turno extra para finalizar'
      }
      break

    case 'discard':
      // Valioso se FATAL presente (pode remover ela)
      if (riskAnalysis?.typeOdds.FATAL && riskAnalysis.typeOdds.FATAL > 0) {
        contextBonus = 18
        reason = 'pode remover FATAL do pool'
      }
      break

    case 'shape_bomb': {
      const shapeWithMost = findShapeWithMostPills(pillPool)
      if (shapeWithMost && shapeWithMost.count >= 3) {
        contextBonus = 18
        reason = `eliminar ${shapeWithMost.count} pilulas de uma vez`
      }
      break
    }

    case 'inverter':
      // Insane: inverter HEAL revelada para dano
      if (config.usesRevealedPills) {
        const hasRevealedHeal = pillPool.some(
          (p) => ctx.revealedPills.includes(p.id) && p.type === 'HEAL'
        )
        if (hasRevealedHeal) {
          contextBonus = 12
          reason = 'inverter cura revelada'
        }
      }
      break

    case 'double':
      // Insane: dobrar FATAL revelada + Force Feed
      if (config.usesRevealedPills) {
        const hasRevealedFatal = pillPool.some(
          (p) => ctx.revealedPills.includes(p.id) && p.type === 'FATAL'
        )
        if (hasRevealedFatal && aiPlayer.inventory.items.some((i) => i.type === 'force_feed')) {
          contextBonus = 22
          reason = 'combo: dobrar fatal + forcar'
        }
      }
      break

    default:
      contextBonus = 0
  }

  return {
    item,
    score: basePriority + contextBonus,
    reason,
  }
}

/**
 * Seleciona qual item a IA deve usar
 * Usa evaluateItem para pontuar cada item no contexto atual
 */
export function selectAIItem(ctx: AIDecisionContext): InventoryItem | null {
  const { aiPlayer } = ctx
  const items = aiPlayer.inventory.items

  if (items.length === 0) return null

  // Avalia cada item
  const evaluations = items.map((item) => evaluateItem(item, ctx))

  // Ordena por score (maior primeiro)
  evaluations.sort((a, b) => b.score - a.score)

  // Retorna melhor (se score > 0)
  const best = evaluations[0]
  return best.score > 0 ? best.item : null
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
 * Usa contexto para selecao inteligente em niveis Hard/Insane
 */
export function selectAIItemTarget(
  itemType: ItemType,
  ctx: AIDecisionContext,
  opponentId: string
): string | undefined {
  const { pillPool, revealedPills, config } = ctx
  const itemDef = ITEM_CATALOG[itemType]

  // Casos especiais para itens de shape
  switch (itemType) {
    case 'shape_bomb':
      // Seleciona pill da shape com mais pilulas (maximiza impacto)
      return findPillOfMostCommonShape(pillPool) ?? selectRandomPill(pillPool) ?? undefined

    case 'shape_scanner':
      // Seleciona pill da shape com mais pilulas NAO reveladas (maximiza info)
      return (
        findPillOfMostCommonShape(pillPool, true, revealedPills) ??
        selectRandomPill(pillPool) ??
        undefined
      )

    case 'force_feed':
      // Hard/Insane: prioriza pilulas perigosas reveladas
      if (config.usesRevealedPills) {
        const dangerousPill = pillPool.find(
          (p) =>
            revealedPills.includes(p.id) &&
            (p.type === 'FATAL' || p.type === 'DMG_HIGH' || p.type === 'DMG_LOW')
        )
        if (dangerousPill) return dangerousPill.id
      }
      // Insane: usar deducao para encontrar pilula provavelmente perigosa
      if (config.usesDeduction) {
        const deductions = deduceNonRevealedTypes(ctx)
        for (const pill of pillPool) {
          if (revealedPills.includes(pill.id)) continue
          const possibleTypes = deductions.get(pill.id)
          // Se so pode ser tipos perigosos, e uma boa escolha
          if (
            possibleTypes &&
            possibleTypes.every((t) => t === 'FATAL' || t === 'DMG_HIGH' || t === 'DMG_LOW')
          ) {
            return pill.id
          }
        }
      }
      return selectRandomPill(pillPool) ?? undefined

    case 'inverter':
      // Insane: inverter pilula HEAL revelada (transforma em dano)
      if (config.usesRevealedPills) {
        const healPill = pillPool.find((p) => revealedPills.includes(p.id) && p.type === 'HEAL')
        if (healPill) return healPill.id
      }
      return selectRandomPill(pillPool) ?? undefined

    case 'double':
      // Insane: dobrar FATAL revelada (combo com force_feed)
      if (config.usesRevealedPills) {
        const fatalPill = pillPool.find((p) => revealedPills.includes(p.id) && p.type === 'FATAL')
        if (fatalPill) return fatalPill.id
        // Ou dobrar DMG_HIGH
        const dmgHighPill = pillPool.find(
          (p) => revealedPills.includes(p.id) && p.type === 'DMG_HIGH'
        )
        if (dmgHighPill) return dmgHighPill.id
      }
      return selectRandomPill(pillPool) ?? undefined
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

// ============================================
// Selecao de Itens Pre-Jogo
// ============================================

/**
 * Embaralha array (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Seleciona itens variados (1 por categoria se possivel)
 * Usado por Normal
 */
function selectVariedItems(availableItems: ItemType[]): ItemType[] {
  const selected: ItemType[] = []
  const categories = ['intel', 'sustain', 'control', 'chaos'] as const

  // Tenta pegar 1 de cada categoria
  for (const category of categories) {
    const categoryItems = availableItems.filter((item) => {
      const def = ITEM_CATALOG[item]
      return def.category === category && !selected.includes(item)
    })
    if (categoryItems.length > 0) {
      selected.push(categoryItems[Math.floor(Math.random() * categoryItems.length)])
    }
  }

  // Completa com aleatorios ate 5
  const remaining = availableItems.filter((item) => !selected.includes(item))
  const shuffled = shuffleArray(remaining)
  while (selected.length < 5 && shuffled.length > 0) {
    selected.push(shuffled.pop()!)
  }

  return selected
}

/**
 * Seleciona itens ofensivos (prioriza control/chaos)
 * Usado por Hard
 */
function selectOffensiveItems(availableItems: ItemType[]): ItemType[] {
  const offensivePriority: ItemType[] = [
    'force_feed',
    'handcuffs',
    'double',
    'inverter',
    'shape_bomb',
    'discard',
  ]

  const selected: ItemType[] = []

  // Prioriza ofensivos
  for (const item of offensivePriority) {
    if (availableItems.includes(item) && !selected.includes(item)) {
      selected.push(item)
      if (selected.length >= 5) break
    }
  }

  // Completa com outros
  const remaining = availableItems.filter((item) => !selected.includes(item))
  const shuffled = shuffleArray(remaining)
  while (selected.length < 5 && shuffled.length > 0) {
    selected.push(shuffled.pop()!)
  }

  return selected
}

/**
 * Seleciona composicao otimizada (2 Intel, 2 Sustain, 1 Control)
 * Usado por Insane
 */
function selectOptimalItems(availableItems: ItemType[]): ItemType[] {
  const selected: ItemType[] = []

  // Composicao ideal: 2 Intel, 2 Sustain, 1 Control
  const composition = [
    { category: 'intel' as const, count: 2 },
    { category: 'sustain' as const, count: 2 },
    { category: 'control' as const, count: 1 },
  ]

  for (const { category, count } of composition) {
    const categoryItems = availableItems.filter((item) => {
      const def = ITEM_CATALOG[item]
      return def.category === category && !selected.includes(item)
    })
    const shuffled = shuffleArray(categoryItems)
    for (let i = 0; i < count && shuffled.length > 0; i++) {
      selected.push(shuffled.pop()!)
    }
  }

  // Completa ate 5 se necessario
  const remaining = availableItems.filter((item) => !selected.includes(item))
  const shuffled = shuffleArray(remaining)
  while (selected.length < 5 && shuffled.length > 0) {
    selected.push(shuffled.pop()!)
  }

  return selected
}

/**
 * Seleciona itens iniciais baseado na dificuldade
 */
export function selectAIInitialItems(
  difficulty: DifficultyLevel,
  availableItems: ItemType[]
): ItemType[] {
  switch (difficulty) {
    case 'easy':
      return shuffleArray(availableItems).slice(0, 5)
    case 'normal':
      return selectVariedItems(availableItems)
    case 'hard':
      return selectOffensiveItems(availableItems)
    case 'insane':
      return selectOptimalItems(availableItems)
    default:
      return shuffleArray(availableItems).slice(0, 5)
  }
}

