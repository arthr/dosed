# Design: Refatoracao da AI Logic + Sistema de Dificuldade

## Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SISTEMA DE DIFICULDADE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [App.tsx - Setup Screen]                                               │
│         │                                                               │
│         │ selectedDifficulty                                            │
│         ▼                                                               │
│  [gameStore.initGame(difficulty)]                                       │
│         │                                                               │
│         │ state.difficulty                                              │
│         ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │                      aiLogic.ts                              │       │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │       │
│  │  │ AI_CONFIGS  │→ │ getAIConfig │→ │ AI Decision │           │       │
│  │  │ (4 niveis)  │  │ (selector)  │  │  Functions  │           │       │
│  │  └─────────────┘  └─────────────┘  └─────────────┘           │       │
│  │                          ↓                                   │       │
│  │  ┌─────────────────────────────────────────────────────┐     │       │
│  │  │                  DECISION LAYER                     │     │       │
│  │  │                                                     │     │       │
│  │  │  selectPill()      - Escolha de pilula              │     │       │
│  │  │  shouldUseItem()   - Decisao de usar item           │     │       │
│  │  │  selectItem()      - Qual item usar                 │     │       │
│  │  │  selectTarget()    - Alvo do item                   │     │       │
│  │  │  selectInitial()   - Itens pre-jogo                 │     │       │
│  │  │  storeDecision()   - Compras na loja                │     │       │
│  │  └─────────────────────────────────────────────────────┘     │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                         │
│  [useAIPlayer.ts]  ←─── Consome aiLogic                                 │
│  [useAIItemSelection.ts] ←─── Consome aiLogic                           │
│  [useAIStore.ts] ←─── NOVO: Comportamento na loja                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Novos Types

### `types/game.ts`

```typescript
/**
 * Niveis de dificuldade da IA
 */
export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'insane'

/**
 * Labels de exibicao para dificuldade
 */
export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'Paciente',
  normal: 'Cobaia',
  hard: 'Sobrevivente',
  insane: 'Hofmann',
}

/**
 * Descricoes para tooltip
 */
export const DIFFICULTY_DESCRIPTIONS: Record<DifficultyLevel, string> = {
  easy: 'IA previsivel, ideal para aprender',
  normal: 'Experiencia balanceada',
  hard: 'IA agressiva e estrategica',
  insane: 'IA calculista, sem piedade',
}

/**
 * Atualizar GameConfig
 */
export interface GameConfig {
  player1: { name: string; isAI: boolean }
  player2: { name: string; isAI: boolean }
  startingLives: number
  startingResistance: number
  difficulty: DifficultyLevel // NOVO
}

/**
 * Atualizar GameState
 */
export interface GameState {
  // ... campos existentes
  difficulty: DifficultyLevel // NOVO
}
```

---

### `types/ai.ts` (NOVO ARQUIVO)

```typescript
import type { DifficultyLevel } from './game'

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
```

---

## Configuracao da IA

### `utils/aiConfig.ts` (NOVO ARQUIVO)

```typescript
import type { AIConfig, DifficultyLevel } from '@/types'

/**
 * Configuracoes de IA por nivel de dificuldade
 */
export const AI_CONFIGS: Record<DifficultyLevel, AIConfig> = {
  easy: {
    itemUseChance: 0.15,
    thinkingDelayMin: 1500,
    thinkingDelayMax: 3500,
    usesTypeCounts: false,       // Ignora probabilidades
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
    usesTypeCounts: true,        // Usa para decidir itens defensivos
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
    usesTypeCounts: true,        // Calcula risco, usa para itens e pilulas
    usesRevealedPills: true,
    avoidsRevealedDanger: true,
    usesDeduction: false,        // Nao faz deducao completa
    prioritizesShapeQuest: false,
    usesStoreStrategically: true,
    targetsWeakPlayer: true,
    storeInterestThreshold: 2,
  },
  insane: {
    itemUseChance: 0.80,
    thinkingDelayMin: 500,
    thinkingDelayMax: 1200,
    usesTypeCounts: true,        // Maximiza uso de probabilidades
    usesRevealedPills: true,
    avoidsRevealedDanger: true,
    usesDeduction: true,         // Deduz tipos impossiveis
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
```

---

## Refatoracao da aiLogic.ts

### Estrutura Proposta

```typescript
// utils/aiLogic.ts

import type {
  AIConfig,
  AIDecisionContext,
  DifficultyLevel,
  InventoryItem,
  ItemEvaluation,
  ItemType,
  Pill,
  PillType,
  Player,
  ShapeQuest,
} from '@/types'
import { getAIConfig } from './aiConfig'
import { ITEM_CATALOG } from './itemCatalog'

// ============================================
// ANALISE DE RISCO (baseada em typeCounts)
// ============================================

/**
 * Calcula probabilidade de cada tipo nas pilulas NAO reveladas
 * Usa typeCounts (publico) - revealedTypes = odds reais
 */
export function calculateTypeOdds(ctx: AIDecisionContext): Record<PillType, number> {
  const { typeCounts, revealedPills, pillPool } = ctx
  
  // Conta tipos das pilulas reveladas
  const revealedTypeCounts: Record<PillType, number> = {
    SAFE: 0, DMG_LOW: 0, DMG_HIGH: 0, FATAL: 0, HEAL: 0, LIFE: 0
  }
  
  for (const pillId of revealedPills) {
    const pill = pillPool.find(p => p.id === pillId)
    if (pill) {
      revealedTypeCounts[pill.type]++
    }
  }
  
  // Calcula tipos restantes no pool nao-revelado
  const remainingCounts: Record<PillType, number> = {} as any
  const unrevealed = pillPool.length - revealedPills.length
  
  for (const type of Object.keys(typeCounts) as PillType[]) {
    remainingCounts[type] = typeCounts[type] - revealedTypeCounts[type]
  }
  
  // Converte para probabilidades
  const odds: Record<PillType, number> = {} as any
  for (const type of Object.keys(remainingCounts) as PillType[]) {
    odds[type] = unrevealed > 0 ? remainingCounts[type] / unrevealed : 0
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
 */
export function deduceNonRevealedTypes(ctx: AIDecisionContext): Map<string, PillType[]> {
  const { typeCounts, revealedPills, pillPool } = ctx
  const deductions = new Map<string, PillType[]>()
  
  // Para cada tipo, verifica se todas instancias estao reveladas
  const revealedByType: Record<PillType, number> = {
    SAFE: 0, DMG_LOW: 0, DMG_HIGH: 0, FATAL: 0, HEAL: 0, LIFE: 0
  }
  
  for (const pillId of revealedPills) {
    const pill = pillPool.find(p => p.id === pillId)
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
  for (const pill of pillPool) {
    if (!revealedPills.includes(pill.id)) {
      // Esta pilula NAO pode ser nenhum tipo esgotado
      const possibleTypes = (['SAFE', 'DMG_LOW', 'DMG_HIGH', 'FATAL', 'HEAL', 'LIFE'] as PillType[])
        .filter(t => !exhaustedTypes.includes(t))
      deductions.set(pill.id, possibleTypes)
    }
  }
  
  return deductions
}

// ============================================
// SELECAO DE PILULAS
// ============================================

/**
 * Seleciona pilula para IA consumir baseado na dificuldade
 */
export function selectAIPill(ctx: AIDecisionContext): string | null {
  const { pillPool, revealedPills, config, aiQuest } = ctx
  
  // Easy: aleatorio puro
  if (!config.usesRevealedPills && !config.usesTypeCounts) {
    return selectRandomPill(pillPool)
  }
  
  // Normal: aleatorio, mas pode usar typeCounts para decidir itens antes
  if (!config.usesRevealedPills) {
    return selectRandomPill(pillPool)
  }
  
  // Hard/Insane: considera reveladas + typeCounts
  return selectSmartPill(ctx)
}

/**
 * Selecao aleatoria simples (Easy/Normal)
 */
export function selectRandomPill(pillPool: Pill[]): string | null {
  const available = pillPool.filter(p => !p.isRevealed)
  if (available.length === 0) return null
  
  const idx = Math.floor(Math.random() * available.length)
  return available[idx].id
}

/**
 * Selecao inteligente (Hard/Insane)
 * ATUALIZADO: Usa typeCounts, deducao e analise de risco
 */
function selectSmartPill(ctx: AIDecisionContext): string | null {
  const { pillPool, revealedPills, config, aiQuest } = ctx
  
  // Mapeia pilulas reveladas com seus tipos
  const revealedInfo = getRevealedPillsInfo(pillPool, revealedPills)
  
  // Calcula probabilidades e deducoes
  const riskAnalysis = analyzePoolRisk(ctx)
  const deductions = config.usesDeduction 
    ? deduceNonRevealedTypes(ctx) 
    : null
  
  // Prioridade 1: Shape Quest (Insane only)
  if (config.prioritizesShapeQuest && aiQuest) {
    const questPill = findQuestPill(pillPool, aiQuest, revealedInfo)
    if (questPill) return questPill
  }
  
  // Prioridade 2: Pilulas seguras reveladas
  const safePill = findSafePill(revealedInfo)
  if (safePill) return safePill
  
  // Prioridade 3: Pilulas de cura (se precisar)
  if (ctx.aiPlayer.resistance < ctx.aiPlayer.maxResistance * 0.5) {
    const healPill = findHealPill(revealedInfo)
    if (healPill) return healPill
  }
  
  // Prioridade 4 (Insane): Usar deducao para encontrar pilula "segura"
  if (deductions) {
    // Encontra pilula que NAO pode ser FATAL nem DMG_HIGH
    for (const pill of pillPool) {
      if (revealedPills.includes(pill.id)) continue
      
      const possibleTypes = deductions.get(pill.id)
      if (possibleTypes) {
        const canBeDangerous = possibleTypes.includes('FATAL') || possibleTypes.includes('DMG_HIGH')
        if (!canBeDangerous) {
          return pill.id // Garantido nao ser perigosa!
        }
      }
    }
  }
  
  // Prioridade 5: Se risco baixo (typeCounts), pode arriscar qualquer uma
  if (riskAnalysis.level === 'low') {
    // Pool majoritariamente seguro, aleatorio e OK
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

// ============================================
// DECISAO DE USO DE ITENS
// ============================================

/**
 * Decide se IA deve usar item neste turno
 */
export function shouldAIUseItem(ctx: AIDecisionContext): boolean {
  const { aiPlayer, config } = ctx
  
  // Sem itens = nao pode usar
  if (aiPlayer.inventory.items.length === 0) return false
  
  // Rola chance baseada na dificuldade
  return Math.random() < config.itemUseChance
}

/**
 * Seleciona melhor item para usar
 */
export function selectAIItem(ctx: AIDecisionContext): InventoryItem | null {
  const { aiPlayer } = ctx
  const items = aiPlayer.inventory.items
  
  if (items.length === 0) return null
  
  // Avalia cada item
  const evaluations = items.map(item => evaluateItem(item, ctx))
  
  // Ordena por score
  evaluations.sort((a, b) => b.score - a.score)
  
  // Retorna melhor (se score > 0)
  const best = evaluations[0]
  return best.score > 0 ? best.item : null
}

/**
 * Avalia valor de um item no contexto atual
 * ATUALIZADO: Usa analise de risco baseada em typeCounts
 */
function evaluateItem(item: InventoryItem, ctx: AIDecisionContext): ItemEvaluation {
  const { aiPlayer, opponent, pillPool, config } = ctx
  
  const basePriority = ITEM_PRIORITY[item.type]
  let contextBonus = 0
  let reason = 'base priority'
  
  // Calcular analise de risco se config permitir
  const riskAnalysis = config.usesTypeCounts 
    ? analyzePoolRisk(ctx) 
    : null
  
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
      
    case 'shape_bomb':
      const shapeWithMost = findShapeWithMostPills(pillPool)
      if (shapeWithMost && shapeWithMost.count >= 3) {
        contextBonus = 18
        reason = `eliminar ${shapeWithMost.count} pilulas de uma vez`
      }
      break
      
    case 'inverter':
      // Insane: inverter HEAL revelada para dano
      if (config.usesRevealedPills) {
        const hasRevealedHeal = pillPool.some(p => 
          ctx.revealedPills.includes(p.id) && p.type === 'HEAL'
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
        const hasRevealedFatal = pillPool.some(p =>
          ctx.revealedPills.includes(p.id) && p.type === 'FATAL'
        )
        if (hasRevealedFatal && aiPlayer.inventory.items.some(i => i.type === 'force_feed')) {
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

// ============================================
// SELECAO DE ITENS PRE-JOGO
// ============================================

/**
 * Seleciona itens iniciais baseado na dificuldade
 */
export function selectAIInitialItems(
  difficulty: DifficultyLevel,
  availableItems: ItemType[]
): ItemType[] {
  switch (difficulty) {
    case 'easy':
      // Aleatorio puro
      return shuffleArray(availableItems).slice(0, 5)
      
    case 'normal':
      // Variedade (1 de cada categoria)
      return selectVariedItems(availableItems)
      
    case 'hard':
      // Prioriza ofensivos
      return selectOffensiveItems(availableItems)
      
    case 'insane':
      // Composicao otimizada
      return selectOptimalItems(availableItems)
      
    default:
      return shuffleArray(availableItems).slice(0, 5)
  }
}

// ============================================
// COMPORTAMENTO NA LOJA
// ============================================

/**
 * Decide se IA deve sinalizar interesse na loja
 */
export function shouldAIWantStore(
  difficulty: DifficultyLevel,
  pillCoins: number
): boolean {
  const config = getAIConfig(difficulty)
  return pillCoins >= config.storeInterestThreshold
}

/**
 * Seleciona itens para comprar na loja
 */
export function selectAIStoreItems(
  ctx: AIDecisionContext,
  availableCoins: number,
  storeItems: StoreItem[]
): StoreItem[] {
  const { config, aiPlayer } = ctx
  
  // Easy: nao compra nada
  if (!config.usesStoreStrategically) {
    return []
  }
  
  // Avalia e prioriza itens
  const cart: StoreItem[] = []
  let remainingCoins = availableCoins
  
  // Prioridade 1: 1-Up se vida = 1
  if (aiPlayer.lives === 1) {
    const oneUp = storeItems.find(i => i.id === 'boost_life')
    if (oneUp && oneUp.cost <= remainingCoins) {
      cart.push(oneUp)
      remainingCoins -= oneUp.cost
    }
  }
  
  // Prioridade 2: Scanner-2X
  const scanner2x = storeItems.find(i => i.id === 'boost_scanner')
  if (scanner2x && scanner2x.cost <= remainingCoins) {
    cart.push(scanner2x)
    remainingCoins -= scanner2x.cost
  }
  
  // Prioridade 3: Shield (se nao tem)
  const hasShield = aiPlayer.inventory.items.some(i => i.type === 'shield')
  if (!hasShield) {
    const shield = storeItems.find(i => i.id === 'item_shield')
    if (shield && shield.cost <= remainingCoins) {
      cart.push(shield)
      remainingCoins -= shield.cost
    }
  }
  
  return cart
}
```

---

## Alteracoes no gameStore.ts

### Novos campos e actions

```typescript
// Adicionar ao estado inicial
const initialState: GameState = {
  // ... existente
  difficulty: 'normal', // NOVO - padrao
}

// Atualizar initGame
initGame: (difficulty: DifficultyLevel = 'normal') => {
  set((state) => ({
    ...state,
    difficulty,
    phase: 'itemSelection',
    // ... resto da inicializacao
  }))
}

// Novo selector
export const useDifficulty = () => useGameStore((s) => s.difficulty)
```

---

## Alteracoes no useAIPlayer.ts

```typescript
// Importar nova aiLogic
import {
  selectAIPill,
  shouldAIUseItem,
  selectAIItem,
  selectAIItemTarget,
  getAIThinkingDelay,
} from '@/utils/aiLogic'
import { getAIConfig } from '@/utils/aiConfig'

// Dentro do hook, construir contexto
const difficulty = useGameStore((s) => s.difficulty)
const revealedPills = useGameStore((s) => s.revealedPills)
const aiQuest = useGameStore((s) => s.shapeQuests.player2)

// Criar contexto para decisoes
const ctx: AIDecisionContext = {
  aiPlayer: currentPlayer,
  opponent: players[opponentId],
  pillPool,
  revealedPills,
  aiQuest,
  round,
  config: getAIConfig(difficulty),
}

// Usar delay variavel por dificuldade
const delay = getAIThinkingDelay(difficulty)

// Chamar funcoes com contexto
if (shouldAIUseItem(ctx)) {
  const selectedItem = selectAIItem(ctx)
  // ...
}

const pillId = selectAIPill(ctx)
```

---

## Componente de Selecao (UI)

### `components/game/DifficultySelect.tsx` (NOVO)

```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/8bit/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/8bit/tooltip'
import type { DifficultyLevel } from '@/types'
import { DIFFICULTY_LABELS, DIFFICULTY_DESCRIPTIONS } from '@/types'

interface DifficultySelectProps {
  value: DifficultyLevel
  onChange: (value: DifficultyLevel) => void
}

export function DifficultySelect({ value, onChange }: DifficultySelectProps) {
  const difficulties: DifficultyLevel[] = ['easy', 'normal', 'hard', 'insane']
  
  return (
    <div className="flex flex-col items-center gap-2">
      <label className="text-sm text-muted-foreground">
        Dificuldade
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {difficulties.map((diff) => (
            <Tooltip key={diff}>
              <TooltipTrigger asChild>
                <SelectItem value={diff}>
                  {DIFFICULTY_LABELS[diff]}
                </SelectItem>
              </TooltipTrigger>
              <TooltipContent side="right">
                {DIFFICULTY_DESCRIPTIONS[diff]}
              </TooltipContent>
            </Tooltip>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
```

### Integracao no App.tsx

```typescript
function GameContent() {
  const [selectedDifficulty, setSelectedDifficulty] = 
    useState<DifficultyLevel>('normal')
  
  // ...
  
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-12">
        {/* Titulo */}
        <div className="text-center space-y-2">
          <h2>Bem-vindo ao Dosed!</h2>
          <p>Escolha uma pilula. Sobreviva. Seja o ultimo!</p>
        </div>
        
        {/* NOVO: Seletor de dificuldade */}
        <DifficultySelect
          value={selectedDifficulty}
          onChange={setSelectedDifficulty}
        />
        
        {/* Botao iniciar */}
        <Button onClick={() => startGame(selectedDifficulty)}>
          Iniciar Partida
        </Button>
        
        {/* Info Panel */}
        <InfoPanel />
      </div>
    )
  }
}
```

---

## Riscos e Mitigacoes

| Risco | Impacto | Mitigacao |
| :--- | :--- | :--- |
| Quebra de comportamento existente | Alto | Mapear comportamento atual -> Normal |
| IA muito forte em Insane | Medio | Playtests e ajuste de parametros |
| IA muito fraca em Easy | Baixo | Ajustar itemUseChance |
| Performance (calculos extras) | Baixo | Memoizar onde possivel |
| Complexidade de manutencao | Medio | Documentar heuristicas |

---

## Testes Recomendados

1. **Unit Tests (aiLogic.ts):**
   - `selectRandomPill` retorna pilula valida
   - `selectSmartPill` evita perigosas reveladas
   - `evaluateItem` retorna scores consistentes
   - `selectAIInitialItems` respeita quantidade

2. **Integration Tests:**
   - IA joga corretamente em cada dificuldade
   - Delay varia por nivel
   - Selecao de itens pre-jogo diferenciada

3. **E2E Tests:**
   - Selecionar dificuldade na UI
   - Iniciar jogo com dificuldade escolhida
   - IA se comporta conforme nivel

---

## Diagrama de Sequencia (Turno da IA)

```
┌────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐
│ Store  │  │useAIPlayer│  │ aiLogic  │  │ aiConfig │
└───┬────┘  └─────┬─────┘  └────┬─────┘  └────┬─────┘
    │             │             │             │
    │ difficulty  │             │             │
    │────────────>│             │             │
    │             │             │             │
    │             │ getAIConfig │             │
    │             │─────────────────────────->│
    │             │             │             │
    │             │        AIConfig           │
    │             │<─────────────────────────-│
    │             │             │             │
    │             │ ctx = {...} │             │
    │             │─────────────>│            │
    │             │             │             │
    │             │shouldUseItem│             │
    │             │────────────>│             │
    │             │             │             │
    │             │  true/false │             │
    │             │<────────────│             │
    │             │             │             │
    │             │ selectAIItem│             │
    │             │────────────>│             │
    │             │             │             │
    │             │    item     │             │
    │             │<────────────│             │
    │             │             │             │
    │             │ selectAIPill│             │
    │             │────────────>│             │
    │             │             │             │
    │             │   pillId    │             │
    │             │<────────────│             │
    │             │             │             │
    │startConsumption           │             │
    │<────────────│             │             │
```

