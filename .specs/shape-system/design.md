# Design: Sistema de Formas (Shape System)

> **ATUALIZADO:** Este documento foi originalmente escrito para 5 shapes. A implementacao
> atual suporta **16 shapes** com imagens PNG.
> 
> **SISTEMA DE SHAPES ATIVAS/SAZONAIS:**
> - **Shapes ATIVAS:** round, flower, fruit, pumpkin, skull, bear (aparecem no jogo)
> - **Shapes SAZONAIS:** capsule, triangle, oval, cross, heart, star, coin, gem, domino, pineapple
>   (desabilitadas, serao ativadas em eventos especiais)
>
> Consulte os arquivos fonte para a implementacao atual:
> - `src/utils/shapeProgression.ts` - Configuracao de progressao (SHAPE_PROGRESSION)
> - `src/types/pill.ts` - Tipo PillShape com 16 shapes
> - `src/utils/constants.ts` - SHAPE_IMAGES, SHAPE_CLASSES, SHAPE_LABELS

## Arquitetura Proposta

### Visao Geral da Integracao

```
+-------------------------------------------------------------------------+
|                    FLUXO DE SHAPES NO JOGO                               |
+-------------------------------------------------------------------------+
|                                                                         |
|  [gameStore]                                                            |
|      |                                                                  |
|      | initGame() / resetRound()                                        |
|      v                                                                  |
|  [pillGenerator.ts]                                                     |
|      |                                                                  |
|      +-> distributeShapes(count, round) -> shapes por progressao        |
|      |                                                                  |
|      +-> countPillShapes(pills) -> { round: 3, capsule: 2, ... }        |
|      |                                                                  |
|      v                                                                  |
|  [gameStore.pillPool + shapeCounts]                                     |
|      |                                                                  |
|      | consumePill()                                                    |
|      v                                                                  |
|  [questGenerator.ts]                                                    |
|      |                                                                  |
|      +-> checkQuestProgress(player, pill.shape)                         |
|      |      |                                                           |
|      |      +-> Match: avanca progresso                                 |
|      |      +-> Mismatch: reset progresso                               |
|      |      +-> Complete: aplica recompensa (NAO gera novo)             |
|      |                                                                  |
|      v                                                                  |
|  [UI Components]                                                        |
|      |                                                                  |
|      +-> Pill.tsx (renderiza shape visual)                              |
|      +-> ShapeQuestDisplay.tsx (mostra objetivo atual)                  |
|      +-> ShapeSelector.tsx (selecao para itens)                         |
|                                                                         |
+-------------------------------------------------------------------------+
```

---

## Nova Estrutura de Arquivos

```
src/
+-- types/
|   +-- pill.ts                # EXISTENTE: PillShape ja definido
|   +-- game.ts                # MODIFICADO: shapeCounts, shapeQuests
|   +-- item.ts                # MODIFICADO: novos ItemTypes
|   +-- quest.ts               # NOVO: ShapeQuest, QuestConfig
|   +-- index.ts               # MODIFICADO: exportar novos tipos
|
+-- utils/
|   +-- constants.ts           # MODIFICADO: SHAPE_CLASSES, remover PILL_SHAPES fixo
|   +-- pillGenerator.ts       # MODIFICADO: usar shapeProgression para distribuir shapes
|   +-- shapeProgression.ts    # NOVO: progressao de shapes (similar a pillProgression)
|   +-- questGenerator.ts      # NOVO: geracao e logica de quests
|   +-- itemCatalog.ts         # MODIFICADO: Shape Bomb, Shape Scanner
|   +-- itemLogic.ts           # MODIFICADO: efeitos dos novos itens
|
+-- stores/
|   +-- gameStore.ts           # MODIFICADO: shapeCounts, shapeQuests, quest progress
|
+-- components/game/
|   +-- Pill.tsx               # MODIFICADO: renderizar shapes
|   +-- ShapeIcon.tsx          # NOVO: icone de shape isolado
|   +-- ShapeQuestDisplay.tsx  # NOVO: UI do objetivo
|   +-- ShapeCounter.tsx       # NOVO (opcional): contagem de shapes
|   +-- ItemTargetSelector.tsx # MODIFICADO: instrucoes para shape items
```

---

## Modelagem de Dados

### Novos Tipos: Quest (`src/types/quest.ts`)

```typescript
import type { PillShape } from './pill'

/**
 * Objetivo de sequencia de shapes
 * Ao completar, jogador recebe +1 Pill Coin
 */
export interface ShapeQuest {
  /** ID unico */
  id: string
  /** Sequencia de shapes a consumir */
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
```

### Novos Tipos: Store (`src/types/store.ts`)

```typescript
import type { ItemType } from './item'
import type { Player } from './player'
import type { PlayerId } from './player'
import type { LucideIcon } from 'lucide-react'

/**
 * Tipos de Boosts (efeitos imediatos)
 */
export type BoostType = 
  | 'life_up'         // +1 vida
  | 'full_resistance' // Resistencia MAX
  | 'reveal_start'    // Inicia rodada com N pills reveladas

/**
 * Tipos de itens na loja
 */
export type StoreItemType = 'power_up' | 'boost'

/**
 * Item vendido na Pill Store
 */
export interface StoreItem {
  id: string
  type: StoreItemType
  name: string
  description: string
  cost: number
  icon: LucideIcon
  /** Para power_up: qual ItemType adicionar */
  itemType?: ItemType
  /** Para boost: qual efeito aplicar */
  boostType?: BoostType
  /** Condicao para estar disponivel */
  isAvailable?: (player: Player) => boolean
}

/**
 * Item no carrinho de compras
 */
export interface CartItem {
  /** ID do item da loja */
  storeItemId: string
  /** Custo do item */
  cost: number
}

/**
 * Estado da Pill Store (apenas fase shopping)
 * Nota: wantsStore fica no Player, nao aqui
 */
export interface StoreState {
  /** Jogadores que confirmaram compras */
  confirmed: Record<PlayerId, boolean>
  /** Timestamp de inicio do timer */
  timerStartedAt: number | null
  /** Duracao atual do timer (ms) */
  timerDuration: number
  /** Boosts comprados para aplicar na proxima rodada */
  pendingBoosts: Record<PlayerId, BoostType[]>
  /** Carrinho de compras de cada jogador */
  cart: Record<PlayerId, CartItem[]>
}

/**
 * Configuracao da loja
 */
export interface StoreConfig {
  items: StoreItem[]
  powerUpBaseCost: number
  shoppingTime: number       // 30000ms
  reduceMultiplier: number   // 0.5
}
```

### Alteracoes em GameState (`src/types/game.ts`)

```typescript
import type { PillShape } from './pill'
import type { ShapeQuest } from './quest'
import type { StoreState } from './store'
import type { PlayerId } from './player'

export type GamePhase = 
  | 'setup' 
  | 'itemSelection' 
  | 'playing' 
  | 'roundEnding' 
  | 'shopping'       // NOVA: fazendo compras na Pill Store
  | 'ended'

export interface GameState {
  // ... campos existentes ...
  
  /** Contagem de shapes no pool atual */
  shapeCounts: Record<PillShape, number>
  
  /** Objetivo de shape de cada jogador */
  shapeQuests: Record<PlayerId, ShapeQuest | null>
  
  /** Estado da Pill Store */
  storeState: StoreState | null
}
```

### Alteracoes em Player (`src/types/player.ts`)

```typescript
export interface Player {
  // ... campos existentes ...
  
  /** Quantidade de Pill Coins acumuladas */
  pillCoins: number
  
  /** Toggle: jogador quer visitar Pill Store ao fim da rodada */
  wantsStore: boolean
}
```

### Alteracoes em ItemType (`src/types/item.ts`)

```typescript
export type ItemType =
  // Existentes
  | 'SCANNER'
  | 'INVERTER'
  | 'DOUBLE'
  | 'POCKET_PILL'
  | 'SHIELD'
  | 'HANDCUFFS'
  | 'FORCE_FEED'
  | 'SHUFFLE'
  | 'DISCARD'
  // Novos
  | 'SHAPE_BOMB'
  | 'SHAPE_SCANNER'

/** Fonte de obtencao de item */
export type ItemSource = 'initial' | 'store'

/** ItemDefinition com novo atributo availableIn */
export interface ItemDefinition {
  // ... campos existentes ...
  /** Onde o item pode ser obtido. Se omitido, disponivel em TODOS os lugares */
  availableIn?: ItemSource[]
}
```

---

## Logica de Progressao de Shapes

### Novo Modulo: shapeProgression.ts (`src/utils/shapeProgression.ts`)

```typescript
import type { PillShape } from '@/types'

/**
 * Regra de progressao para uma shape
 */
export interface ShapeRule {
  unlockRound: number
  startPct: number
  endPct: number
}

/**
 * Configuracao de progressao de shapes
 */
export interface ShapeProgressionConfig {
  maxRound: number
  rules: Record<PillShape, ShapeRule>
}

/**
 * Configuracao padrao de progressao de shapes (16 shapes)
 * 
 * SISTEMA DE SHAPES SAZONAIS:
 * O jogo possui 16 shapes no total, mas nem todas estao ativas simultaneamente.
 * Shapes podem ser ATIVAS (aparecem no jogo) ou SAZONAIS (desabilitadas, ativadas em eventos).
 * 
 * SHAPES ATIVAS (configuracao padrao):
 * - Rodada 1: round, flower, fruit
 * - Rodada 3: + pumpkin, skull
 * - Rodada 5: + bear
 * 
 * SHAPES SAZONAIS (desabilitadas, pct: 0):
 * - capsule, triangle, oval, cross, heart, star, coin, gem, domino, pineapple
 * - Podem ser ativadas em eventos especiais (Halloween, Natal, etc)
 * 
 * Para ativar uma shape sazonal, ajuste startPct/endPct em SHAPE_PROGRESSION.
 * Consulte src/utils/shapeProgression.ts para configuracao atual.
 */
// Exemplo simplificado - implementacao real em src/utils/shapeProgression.ts
export const SHAPE_PROGRESSION: ShapeProgressionConfig = {
  maxRound: 15,
  rules: {
    // Shapes ATIVAS
    round:     { unlockRound: 1, startPct: 45, endPct: 4 },
    flower:    { unlockRound: 1, startPct: 18, endPct: 8 },
    fruit:     { unlockRound: 1, startPct: 50, endPct: 4 },
    pumpkin:   { unlockRound: 3, startPct: 45, endPct: 7 },
    skull:     { unlockRound: 3, startPct: 15, endPct: 20 },
    bear:      { unlockRound: 5, startPct: 45, endPct: 9 },
    // Shapes SAZONAIS (desabilitadas)
    capsule:   { unlockRound: 1, startPct: 0, endPct: 0 },
    // ... demais shapes sazonais com pct: 0
  },
}

/**
 * Calcula distribuicao de probabilidades de shapes para uma rodada
 */
export function getShapeChances(
  round: number,
  config: ShapeProgressionConfig = SHAPE_PROGRESSION
): Record<PillShape, number> {
  const { maxRound, rules } = config
  const clampedRound = Math.max(1, Math.min(round, maxRound))

  // Inicializa contagem para todas as 16 shapes
  const rawWeights = createEmptyShapeCounts() // Record<PillShape, number>

  let totalWeight = 0

  for (const [shape, rule] of Object.entries(rules)) {
    const shapeType = shape as PillShape

    if (clampedRound < rule.unlockRound) {
      rawWeights[shapeType] = 0
      continue
    }

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

  return 'round' // Fallback
}

/**
 * Distribui shapes proporcionalmente baseado nas porcentagens da rodada
 * Mesmo algoritmo usado para distribuir tipos de pilula
 */
export function distributeShapes(
  count: number,
  round: number,
  config: ShapeProgressionConfig = SHAPE_PROGRESSION
): Record<PillShape, number> {
  const chances = getShapeChances(round, config)

  // Inicializa distribuicao para todas as 16 shapes
  const distribution = createEmptyShapeCounts() // Record<PillShape, number>

  const idealAmounts: Array<{ shape: PillShape; ideal: number; floor: number; remainder: number }> = []

  for (const [shape, chance] of Object.entries(chances)) {
    const shapeType = shape as PillShape
    if (chance <= 0) continue

    const ideal = (count * chance) / 100
    const floor = Math.floor(ideal)
    const remainder = ideal - floor

    distribution[shapeType] = floor
    idealAmounts.push({ shape: shapeType, ideal, floor, remainder })
  }

  let distributed = Object.values(distribution).reduce((a, b) => a + b, 0)
  let remaining = count - distributed

  idealAmounts.sort((a, b) => b.remainder - a.remainder)

  for (const item of idealAmounts) {
    if (remaining <= 0) break
    distribution[item.shape]++
    remaining--
  }

  return distribution
}

/**
 * Conta quantidade de cada shape no pool
 */
export function countPillShapes(pills: Pill[]): Record<PillShape, number> {
  // Inicializa contagem para todas as 16 shapes
  const counts = createEmptyShapeCounts() // Record<PillShape, number>
  
  for (const pill of pills) {
    counts[pill.visuals.shape]++
  }
  
  return counts
}
```

### Alteracao em pillGenerator.ts

```typescript
import { distributeShapes, rollShape } from './shapeProgression'

/**
 * Gera pool de pilulas com distribuicao proporcional de TIPOS e SHAPES
 */
export function generatePillPool(
  round: number = 1,
  config: PillConfig = PILL_CONFIG
): Pill[] {
  const count = getPillCount(round)
  const typeDistribution = distributePillTypes(count, round)
  const shapeDistribution = distributeShapes(count, round)
  
  const pills: Pill[] = []
  
  // Cria pool de shapes para atribuir
  const shapePool: PillShape[] = []
  for (const [shape, shapeCount] of Object.entries(shapeDistribution)) {
    for (let i = 0; i < shapeCount; i++) {
      shapePool.push(shape as PillShape)
    }
  }
  
  // Embaralha shapes para atribuicao aleatoria
  shuffleArray(shapePool)
  
  let shapeIndex = 0
  
  // Cria pilulas com tipos e shapes distribuidos
  for (const [type, typeCount] of Object.entries(typeDistribution)) {
    for (let i = 0; i < typeCount; i++) {
      const pill = createPillWithShape(
        type as PillType, 
        shapePool[shapeIndex++], 
        config
      )
      pills.push(pill)
    }
  }

  return shuffleArray(pills)
}

/**
 * Cria pilula com shape especifica
 */
export function createPillWithShape(
  type: PillType, 
  shape: PillShape,
  config: PillConfig = PILL_CONFIG
): Pill {
  const stats = calculatePillStats(type, config)

  return {
    id: uuidv4(),
    type,
    isRevealed: false,
    stats: { ... },
    visuals: {
      color: HIDDEN_PILL_HEX,
      shape: shape,  // Shape atribuida externamente
      label: '???',
    },
  }
}
```

---

## Logica de Shape Quests

### Modulo: questGenerator.ts (`src/utils/questGenerator.ts`)

```typescript
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
 */
function generateSequenceFromPool(
  length: number, 
  shapeCounts: Record<PillShape, number>
): PillShape[] {
  const availablePool: PillShape[] = []
  for (const [shape, count] of Object.entries(shapeCounts)) {
    for (let i = 0; i < count; i++) {
      availablePool.push(shape as PillShape)
    }
  }
  
  const actualLength = Math.min(length, availablePool.length)
  const sequence: PillShape[] = []
  const poolCopy = [...availablePool]
  
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
 */
export function generateShapeQuest(
  round: number,
  shapeCounts: Record<PillShape, number>,
  config: QuestConfig = DEFAULT_QUEST_CONFIG
): ShapeQuest {
  const totalPills = Object.values(shapeCounts).reduce((sum, count) => sum + count, 0)
  
  let length = config.minLength
  if (round >= config.increaseLengthAfterRound) {
    length = Math.random() < 0.5 ? config.minLength : config.maxLength
  }
  length = Math.min(length, totalPills)
  
  return {
    id: uuidv4(),
    sequence: generateSequenceFromPool(length, shapeCounts),
    progress: 0,
    completed: false,
  }
}

/**
 * Verifica progresso do quest ao consumir pilula
 * @returns updatedQuest e justCompleted
 * Se justCompleted = true, caller deve dar +1 Pill Coin ao jogador
 */
export function checkQuestProgress(
  quest: ShapeQuest,
  consumedShape: PillShape
): { updatedQuest: ShapeQuest; justCompleted: boolean } {
  if (quest.completed) {
    return { updatedQuest: quest, justCompleted: false }
  }
  
  const expectedShape = quest.sequence[quest.progress]
  
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
    }
  } else {
    return {
      updatedQuest: { ...quest, progress: 0 },
      justCompleted: false,
    }
  }
}
```

---

## Logica da Pill Store

### Modulo: storeConfig.ts (`src/utils/storeConfig.ts`)

```typescript
import type { StoreConfig, StoreItem } from '@/types'
import { Heart, Shield, Eye, Bomb, Syringe, Scan } from 'lucide-react'
import { GAME_LIMITS } from './constants'

/** Limite de itens no inventario */
const MAX_INVENTORY_ITEMS = 5 // ou GAME_LIMITS.MAX_INVENTORY_ITEMS

export const STORE_ITEMS: StoreItem[] = [
  // BOOSTS (efeitos imediatos)
  {
    id: 'life_up',
    type: 'boost',
    name: '1-Up',
    description: '+1 vida',
    cost: 3,
    icon: Heart,
    boostType: 'life_up',
    isAvailable: (player) => player.lives < 3, // MAX_LIVES
  },
  {
    id: 'full_resistance',
    type: 'boost',
    name: 'Reboot',
    description: 'Resistencia MAX',
    cost: 2,
    icon: Shield,
    boostType: 'full_resistance',
    isAvailable: (player) => player.resistance < player.maxResistance,
  },
  {
    id: 'reveal_start',
    type: 'boost',
    name: 'Scanner-2X',
    description: 'Proxima rodada inicia com 2 pills reveladas',
    cost: 2,
    icon: Scan,
    boostType: 'reveal_start',
  },
  
  // POWER-UPS (adiciona itens existentes ao inventario)
  // Permite que jogadores "reabastecam" itens gastos durante o jogo
  // Novos itens podem ser adicionados conforme o ITEM_CATALOG expandir
  {
    id: 'power_scanner',
    type: 'power_up',
    name: 'Scanner',
    description: 'Adiciona Scanner ao inventario',
    cost: 2,
    icon: Eye,
    itemType: 'scanner',
    isAvailable: (player) => player.inventory.items.length < MAX_INVENTORY_ITEMS,
  },
  {
    id: 'power_shield',
    type: 'power_up',
    name: 'Shield',
    description: 'Adiciona Shield ao inventario',
    cost: 2,
    icon: Shield,
    itemType: 'shield',
    isAvailable: (player) => player.inventory.items.length < MAX_INVENTORY_ITEMS,
  },
  {
    id: 'power_pocket_pill',
    type: 'power_up',
    name: 'Pocket Pill',
    description: 'Adiciona Pocket Pill ao inventario',
    cost: 2,
    icon: Syringe,
    itemType: 'pocket_pill',
    isAvailable: (player) => player.inventory.items.length < MAX_INVENTORY_ITEMS,
  },
  {
    id: 'power_discard',
    type: 'power_up',
    name: 'Discard',
    description: 'Adiciona Discard ao inventario',
    cost: 2,
    icon: Bomb,
    itemType: 'discard',
    isAvailable: (player) => player.inventory.items.length < MAX_INVENTORY_ITEMS,
  },
]

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  items: STORE_ITEMS,
  powerUpBaseCost: 2,
  shoppingTime: 30000,      // 30 segundos para comprar
  reduceMultiplier: 0.5,    // Reduz pela metade quando outro confirma
}
```

### Modulo: storeActions.ts (`src/stores/gameStore.ts` - novas actions)

> **ATUALIZADO:** Sistema de carrinho de compras implementado.
> Jogadores adicionam itens ao carrinho sem debitar coins imediatamente.
> Coins sao debitados apenas ao confirmar compras.

```typescript
// Actions da Pill Store

/**
 * Toggle: jogador quer/nao quer visitar a loja ao fim da rodada
 * Chamado quando jogador clica no icone de Pill Coins
 */
toggleWantsStore: (playerId: PlayerId) => {
  const player = get().players[playerId]
  
  // Validacao: precisa ter coins para ativar
  if (player.pillCoins === 0) {
    toastStore.show({
      message: 'Sem Pill Coins! Complete quests para obter.',
      type: 'warning',
    })
    return
  }
  
  // Toggle wantsStore
  set({
    players: {
      ...get().players,
      [playerId]: {
        ...player,
        wantsStore: !player.wantsStore,
      },
    },
  })
},

/**
 * Verifica se deve abrir loja ao fim da rodada
 * Chamado quando pool esvazia (apos verificar Game Over)
 */
checkAndStartShopping: () => {
  const { players } = get()
  
  // Verifica se alguem quer ir a loja E tem coins
  const p1Wants = players.player1.wantsStore && players.player1.pillCoins > 0
  const p2Wants = players.player2.wantsStore && players.player2.pillCoins > 0
  
  if (p1Wants || p2Wants) {
    // Inicia fase de shopping com carrinhos vazios
    set({
      phase: 'shopping',
      storeState: {
        confirmed: { player1: false, player2: false },
        timerStartedAt: Date.now(),
        timerDuration: DEFAULT_STORE_CONFIG.shoppingTime,
        pendingBoosts: { player1: [], player2: [] },
        cart: { player1: [], player2: [] },
      },
    })
  } else {
    // Ninguem quer, proxima rodada direto
    get().resetRound()
  }
},

/**
 * Adiciona item ao carrinho de compras (NAO debita coins)
 */
addToCart: (playerId: PlayerId, itemId: string) => {
  const state = get()
  const player = state.players[playerId]
  const storeState = state.storeState
  const item = STORE_ITEMS.find(i => i.id === itemId)
  
  if (!item || !storeState) return
  
  // Calcula total do carrinho + novo item
  const cartTotal = storeState.cart[playerId].reduce((sum, ci) => sum + ci.cost, 0)
  if (player.pillCoins < cartTotal + item.cost) return
  if (item.isAvailable && !item.isAvailable(player)) return
  
  // Adiciona ao carrinho
  set({
    storeState: {
      ...storeState,
      cart: {
        ...storeState.cart,
        [playerId]: [...storeState.cart[playerId], { storeItemId: itemId, cost: item.cost }],
      },
    },
  })
},

/**
 * Remove item do carrinho de compras
 */
removeFromCart: (playerId: PlayerId, itemId: string) => {
  const storeState = get().storeState
  if (!storeState) return
  
  const cart = storeState.cart[playerId]
  const index = cart.findIndex(ci => ci.storeItemId === itemId)
  if (index === -1) return
  
  const newCart = [...cart]
  newCart.splice(index, 1)
  
  set({
    storeState: {
      ...storeState,
      cart: { ...storeState.cart, [playerId]: newCart },
    },
  })
},

/**
 * Processa carrinho - debita coins e aplica itens
 * Chamado internamente ao confirmar compras
 */
processCart: (playerId: PlayerId) => {
  const state = get()
  const player = state.players[playerId]
  const storeState = state.storeState
  if (!storeState) return
  
  const cart = storeState.cart[playerId]
  let totalCost = 0
  let updatedPlayer = { ...player }
  let newStoreState = { ...storeState }
  
  for (const cartItem of cart) {
    const item = STORE_ITEMS.find(i => i.id === cartItem.storeItemId)
    if (!item) continue
    
    totalCost += item.cost
    
    if (item.type === 'power_up' && item.itemType) {
      // Adiciona item ao inventario
      updatedPlayer.inventory.items.push({ id: uuidv4(), type: item.itemType })
    } else if (item.type === 'boost' && item.boostType) {
      // Adiciona boost aos pendentes
      newStoreState.pendingBoosts[playerId].push(item.boostType)
    }
  }
  
  // Deduz coins e limpa carrinho
  updatedPlayer.pillCoins -= totalCost
  newStoreState.cart[playerId] = []
  
  set({
    players: { ...state.players, [playerId]: updatedPlayer },
    storeState: newStoreState,
  })
},

/**
 * @deprecated Use addToCart/removeFromCart
 * Mantido para compatibilidade - apenas adiciona ao carrinho
 */
purchaseStoreItem: (playerId: PlayerId, itemId: string) => {
  get().addToCart(playerId, itemId)
},
  
  set({ players: newPlayers, storeState: newStoreState })
},

/**
 * Jogador confirma compras
 */
confirmStorePurchases: (playerId: PlayerId) => {
  const state = get()
  if (!state.storeState) return
  
  const otherPlayer = playerId === 'player1' ? 'player2' : 'player1'
  const newConfirmed = { ...state.storeState.confirmed, [playerId]: true }
  
  // Reduz timer se outro ainda comprando
  let newTimerDuration = state.storeState.timerDuration
  const otherIsShopping = state.players[otherPlayer].wantsStore && 
                          state.players[otherPlayer].pillCoins > 0
  
  if (!newConfirmed[otherPlayer] && otherIsShopping) {
    const elapsed = Date.now() - (state.storeState.timerStartedAt ?? 0)
    const remaining = state.storeState.timerDuration - elapsed
    newTimerDuration = elapsed + (remaining * DEFAULT_STORE_CONFIG.reduceMultiplier)
    
    toastStore.show({
      message: 'Oponente finalizou! Tempo reduzido.',
      type: 'warning',
    })
  }
  
  set({
    storeState: {
      ...state.storeState,
      confirmed: newConfirmed,
      timerDuration: newTimerDuration,
    },
  })
  
  get().checkShoppingComplete()
},

/**
 * Verifica se shopping terminou
 */
checkShoppingComplete: () => {
  const { storeState, players } = get()
  if (!storeState) return
  
  // Quem precisa confirmar: quem queria ir E tem coins
  const p1NeedsConfirm = players.player1.wantsStore && players.player1.pillCoins > 0
  const p2NeedsConfirm = players.player2.wantsStore && players.player2.pillCoins > 0
  
  const p1Done = !p1NeedsConfirm || storeState.confirmed.player1
  const p2Done = !p2NeedsConfirm || storeState.confirmed.player2
  
  if (p1Done && p2Done) {
    get().applyPendingBoosts()
    get().resetRound()
  }
},

/**
 * Aplica boosts pendentes e inicia nova rodada
 */
applyPendingBoosts: () => {
  const { storeState, players } = get()
  if (!storeState) return
  
  const newPlayers = { ...players }
  
  for (const playerId of ['player1', 'player2'] as PlayerId[]) {
    const boosts = storeState.pendingBoosts[playerId]
    for (const boost of boosts) {
      switch (boost) {
        case 'life_up':
          newPlayers[playerId] = {
            ...newPlayers[playerId],
            lives: Math.min(newPlayers[playerId].lives + 1, MAX_LIVES),
          }
          break
        case 'full_resistance':
          newPlayers[playerId] = {
            ...newPlayers[playerId],
            resistance: newPlayers[playerId].maxResistance,
          }
          break
        case 'reveal_start':
          // Marcar para revelar 2 pills no inicio da rodada
          // (implementar flag no state)
          break
      }
    }
    
    // Reseta wantsStore para proxima rodada
    newPlayers[playerId] = {
      ...newPlayers[playerId],
      wantsStore: false,
    }
  }
  
  set({ players: newPlayers, storeState: null })
},
```

---

## Renderizacao Visual de Shapes

> **NOTA:** A implementacao atual usa imagens PNG para todas as 16 shapes.
> As constantes abaixo servem como fallback e referencia.
> Consulte `src/utils/constants.ts` para a implementacao completa.

### Constantes de Estilo (`src/utils/constants.ts`)

```typescript
import type { PillShape } from '@/types'

/**
 * SHAPE_IMAGES: Mapeamento de shapes para imagens PNG
 * Usado para renderizar shapes visualmente (principal metodo)
 * 
 * Todas as 16 shapes possuem imagens em src/assets/shapes/shape_*.png
 */
export const SHAPE_IMAGES: Record<PillShape, string> = {
  capsule: shapeCapsule,   // shape_1.png
  round: shapeRound,       // shape_6.png
  // ... todas as 16 shapes
}

/**
 * SHAPE_CLASSES: Classes CSS para cada shape (fallback)
 * Usadas quando imagem nao carrega
 */
export const SHAPE_CLASSES: Record<PillShape, string> = {
  round: 'rounded-full aspect-square',
  capsule: 'rounded-full aspect-[1.6]',
  oval: 'rounded-full aspect-[1.3]',
  triangle: 'aspect-square', // Usa clip-path
  // ... todas as 16 shapes
}

/**
 * SHAPE_LABELS: Labels de exibicao para UI e acessibilidade
 */
export const SHAPE_LABELS: Record<PillShape, string> = {
  round: 'Redonda',
  capsule: 'Capsula',
  flower: 'Flor',
  // ... todas as 16 shapes
}
```

### Componente Pill.tsx (Atualizacao)

```tsx
import { SHAPE_CLASSES, SHAPE_CLIP_PATHS } from '@/utils/constants'

// Dentro do componente Pill:
const shapeClass = SHAPE_CLASSES[pill.visuals.shape]
const clipPath = SHAPE_CLIP_PATHS[pill.visuals.shape]

// Base size classes (ajustadas para aspect ratios variados)
const baseSizeClasses = {
  sm: 'h-10 min-w-10',
  md: 'h-12 min-w-12',
  lg: 'h-16 min-w-16',
}

return (
  <motion.button
    style={clipPath ? { clipPath } : undefined}
    className={`
      ${baseSizeClasses[size]}
      ${shapeClass}
      flex items-center justify-center
      font-normal text-foreground
      transition-colors duration-200
      ${colorClass}
      // ... resto das classes
    `}
  >
    {/* conteudo */}
  </motion.button>
)
```

### Componente ShapeIcon.tsx (Novo)

```tsx
import type { PillShape } from '@/types'
import { SHAPE_CLASSES, SHAPE_CLIP_PATHS, SHAPE_LABELS } from '@/utils/constants'

interface ShapeIconProps {
  shape: PillShape
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Cor de fundo (hex ou classe) */
  color?: string
}

const sizeClasses = {
  sm: 'h-5 min-w-5',
  md: 'h-7 min-w-7',
  lg: 'h-9 min-w-9',
}

export function ShapeIcon({ shape, size = 'md', className = '', color }: ShapeIconProps) {
  const shapeClass = SHAPE_CLASSES[shape]
  const clipPath = SHAPE_CLIP_PATHS[shape]
  
  return (
    <div
      style={{
        clipPath: clipPath || undefined,
        backgroundColor: color?.startsWith('#') ? color : undefined,
      }}
      className={`
        ${sizeClasses[size]}
        ${shapeClass}
        ${color && !color.startsWith('#') ? color : 'bg-muted'}
        ${className}
      `}
      title={SHAPE_LABELS[shape]}
      aria-label={SHAPE_LABELS[shape]}
    />
  )
}
```

### Componente ShapeQuestDisplay.tsx (Novo)

```tsx
import type { ShapeQuest } from '@/types'
import { ShapeIcon } from './ShapeIcon'
import { motion, AnimatePresence } from 'framer-motion'

interface ShapeQuestDisplayProps {
  quest: ShapeQuest | null
  className?: string
}

export function ShapeQuestDisplay({ quest, className = '' }: ShapeQuestDisplayProps) {
  if (!quest) return null
  
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs text-muted-foreground">Objetivo:</span>
      <div className="flex items-center gap-1">
        <AnimatePresence mode="popLayout">
          {quest.sequence.map((shape, index) => {
            const isCompleted = index < quest.progress
            const isCurrent = index === quest.progress
            
            return (
              <motion.div
                key={`${quest.id}-${index}`}
                initial={{ scale: 0 }}
                animate={{ 
                  scale: 1,
                  opacity: isCompleted ? 0.5 : 1,
                }}
                className={`
                  relative
                  ${isCurrent ? 'ring-2 ring-primary ring-offset-1' : ''}
                `}
              >
                <ShapeIcon 
                  shape={shape} 
                  size="sm"
                  color={isCompleted ? '#22c55e' : '#6b7280'}
                />
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="text-white text-xs">ok</span>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        <span className="text-xs text-muted-foreground ml-2">
          {quest.reward.description}
        </span>
      </div>
    </div>
  )
}
```

---

## Integracao com GameStore

### Alteracoes no Estado Inicial

```typescript
const initialState: GameState = {
  // ... existentes ...
  
  // Contagem de shapes - usa getInitialShapeCounts() para todas as 16 shapes
  shapeCounts: getInitialShapeCounts(), // Record<PillShape, number> com zeros
  
  shapeQuests: {
    player1: null,
    player2: null,
  },
  
  storeState: null,
}
```

### Alteracoes em initGame/resetRound

```typescript
// Em initGame ou confirmItemSelection:
const pillPool = generatePillPool(1)
const typeCounts = countPillTypes(pillPool)
const shapeCounts = countPillShapes(pillPool)

// Gera quests para ambos jogadores BASEADOS no pool
const shapeQuests = {
  player1: generateShapeQuest(1, shapeCounts),
  player2: generateShapeQuest(1, shapeCounts),
}

set({ 
  pillPool, 
  typeCounts, 
  shapeCounts, 
  shapeQuests,
  // ...
})

// Em resetRound:
const newRound = state.round + 1
const newPillPool = generatePillPool(newRound)
const newTypeCounts = countPillTypes(newPillPool)
const newShapeCounts = countPillShapes(newPillPool)

// Gera novos quests para nova rodada BASEADOS no novo pool
const newShapeQuests = {
  player1: generateShapeQuest(newRound, newShapeCounts),
  player2: generateShapeQuest(newRound, newShapeCounts),
}

set({
  pillPool: newPillPool,
  typeCounts: countPillTypes(newPillPool),
  shapeCounts: countPillShapes(newPillPool),
  shapeQuests: newShapeQuests,
  round: newRound,
  // ...
})
```

### Alteracoes em consumePill

```typescript
consumePill: (pillId: string) => {
  set((state) => {
    const pill = state.pillPool.find(p => p.id === pillId)
    if (!pill) return state
    
    const currentPlayerId = state.currentTurn
    const currentQuest = state.shapeQuests[currentPlayerId]
    
    // Atualiza contagens
    const newTypeCounts = { ...state.typeCounts }
    newTypeCounts[pill.type]--
    
    const newShapeCounts = { ...state.shapeCounts }
    newShapeCounts[pill.visuals.shape]--
    
    // Verifica progresso do quest
    let newShapeQuests = { ...state.shapeQuests }
    let earnedPillCoin = false
    
    if (currentQuest && !currentQuest.completed) {
      const { updatedQuest, justCompleted } = checkQuestProgress(
        currentQuest,
        pill.visuals.shape
      )
      
      if (justCompleted) {
        earnedPillCoin = true
        // NAO gera novo quest - jogador aguarda proxima rodada
        // Quest fica marcado como completed
      }
      
      newShapeQuests[currentPlayerId] = updatedQuest
    }
    
    // Remove pilula do pool
    const newPillPool = state.pillPool.filter(p => p.id !== pillId)
    
    // Atualiza Pill Coins se completou quest
    const newPlayers = earnedPillCoin ? {
      ...state.players,
      [currentPlayerId]: {
        ...state.players[currentPlayerId],
        pillCoins: state.players[currentPlayerId].pillCoins + 1,
      },
    } : state.players
    
    return {
      ...state,
      pillPool: newPillPool,
      typeCounts: newTypeCounts,
      shapeCounts: newShapeCounts,
      shapeQuests: newShapeQuests,
      players: newPlayers,
    }
  })
},
```

---

## Novos Itens

> **NOTA DE SIMPLIFICACAO:** Os itens de shape reutilizam o sistema de selecao de pill existente
> (targetType: 'pill'). O jogador seleciona uma pill e o efeito e aplicado a TODAS pills com
> a mesma shape. Isso segue principios DRY/KISS/YAGNI e evita componentes desnecessarios.

### Shape Bomb e Shape Scanner (`src/utils/itemCatalog.ts`)

```typescript
export const ITEM_CATALOG: Record<ItemType, ItemDefinition> = {
  // ... existentes ...
  
  shape_bomb: {
    type: 'shape_bomb',
    name: 'Shape Bomb',
    description: 'Elimina todas pilulas de uma forma',
    icon: 'Bomb',
    category: 'chaos',
    targetType: 'pill',  // Reutiliza selecao de pill existente
    color: 'text-purple-400',
    availableIn: ['store'],  // Apenas na Pill Store
  },
  
  shape_scanner: {
    type: 'shape_scanner',
    name: 'Shape Scanner',
    description: 'Revela todas pilulas de uma forma',
    icon: 'ScanSearch',
    category: 'intel',
    targetType: 'pill',  // Reutiliza selecao de pill existente
    color: 'text-blue-400',
    availableIn: ['store'],  // Apenas na Pill Store
  },
}
```

### Logica dos Itens (`src/stores/gameStore.ts`)

```typescript
// Dentro de executeItem:
case 'shape_bomb': {
  // Jogador seleciona uma pill -> extraimos a shape
  const targetPill = state.pillPool.find(p => p.id === targetPillId)
  if (!targetPill) break
  
  const targetShape = targetPill.visuals.shape
  
  // Remove TODAS pilulas dessa shape
  const pillsToRemove = state.pillPool.filter(p => p.visuals.shape === targetShape)
  const newPillPool = state.pillPool.filter(p => p.visuals.shape !== targetShape)
  
  // Atualiza contagens
  const newTypeCounts = { ...state.typeCounts }
  const newShapeCounts = { ...state.shapeCounts }
  
  for (const pill of pillsToRemove) {
    newTypeCounts[pill.type]--
    newShapeCounts[pill.visuals.shape]--
  }
  
  // Verifica se pool esvaziou -> trigger fim de rodada
  if (newPillPool.length === 0) {
    // checkAndStartShopping() ou resetRound()
  }
  
  return {
    pillPool: newPillPool,
    typeCounts: newTypeCounts,
    shapeCounts: newShapeCounts,
  }
}

case 'shape_scanner': {
  // Jogador seleciona uma pill -> extraimos a shape
  const targetPill = state.pillPool.find(p => p.id === targetPillId)
  if (!targetPill) break
  
  const targetShape = targetPill.visuals.shape
  
  // Revela TODAS pilulas dessa shape
  const pillsToReveal = state.pillPool
    .filter(p => p.visuals.shape === targetShape)
    .map(p => p.id)
  
  const newRevealedPills = [...state.revealedPills, ...pillsToReveal]
  
  return {
    revealedPills: newRevealedPills,
  }
}
```

### Fluxo de Uso

```
[Jogador usa Shape Bomb/Scanner]
       |
       v
[ItemTargetSelector: "Clique em uma pilula..."]
       |
       v
[Jogador clica em uma pill]
       |
       v
[executeItem() extrai shape da pill]
       |
       v
[Aplica efeito em TODAS pills dessa shape]
```

---

## Fluxo de Dados Atualizado

```
+-------------------------------------------------------------------------+
|                     CICLO COM SHAPE QUESTS                               |
+-------------------------------------------------------------------------+
|                                                                         |
|  [Nova Rodada / Inicio do Jogo]                                         |
|       |                                                                 |
|       v                                                                 |
|  [generatePillPool(round)]                                              |
|       |                                                                 |
|       +-> Cada pilula recebe shape aleatoria                            |
|       |                                                                 |
|       v                                                                 |
|  [countPillShapes() + countPillTypes()]                                 |
|       |                                                                 |
|       v                                                                 |
|  [generateShapeQuest() para cada jogador]                               |
|       |                                                                 |
|       v                                                                 |
|  [gameStore: pillPool, shapeCounts, shapeQuests]                        |
|       |                                                                 |
|       v                                                                 |
|  [LOOP DE TURNOS]                                                       |
|       |                                                                 |
|       +-> Jogador ve: pilulas (shapes visiveis), quest atual            |
|       |                                                                 |
|       +-> Jogador escolhe pilula (considera shape para quest)           |
|       |                                                                 |
|       v                                                                 |
|  [consumePill()]                                                        |
|       |                                                                 |
|       +-> Aplica efeito da pilula (tipo)                                |
|       +-> Atualiza typeCounts, shapeCounts                              |
|       +-> checkQuestProgress(quest, pill.shape)                         |
|       |       |                                                         |
|       |       +-> Match: progresso++                                    |
|       |       +-> Mismatch: progresso = 0                               |
|       |       +-> Complete: +1 Pill Coin (NAO gera novo quest)          |
|       |                                                                 |
|       v                                                                 |
|  [UI atualiza: ShapeQuestDisplay mostra progresso]                      |
|       |                                                                 |
|       +-> Toast de feedback (progresso/completou/resetou)               |
|       +-> Se completou: UI mostra "Aguardando proxima rodada"           |
|       |                                                                 |
|       v                                                                 |
|  [Alterna turno]                                                        |
|       |                                                                 |
|  [Pool esvazia? -> checkAndStartShopping() ou resetRound()]             |
|                                                                         |
+-------------------------------------------------------------------------+
```

---

## Riscos e Mitigacoes

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Shapes nao distinguiveis em mobile | Alto | Testar em telas pequenas, ajustar aspect ratios |
| Quest muito dificil (sequencia longa) | Medio | Limitar a 2-3 shapes no MVP, ajustar se necessario |
| Reset de quest frustrante | Medio | Feedback visual claro, som de "errou" |
| Shape Bomb muito forte | Medio | Balancear: limitar a 1 no inventario, ou custo maior |
| IA ignora quests (vantagem humano) | Baixo | Aceitavel para MVP; futuro: IA considera shapes |
| Clip-path nao funciona em browsers antigos | Baixo | Fallback para rounded-full se nao suportar |

---

## Compatibilidade com Itens Existentes

| Item | Interacao com Shapes | Status |
|------|---------------------|--------|
| Scanner | Revela tipo, shape ja visivel | Compativel |
| Inverter | Inverte efeito, shape inalterada | Compativel |
| Double | Dobra efeito, shape inalterada | Compativel |
| Discard | Remove pilula, atualiza shapeCounts | Requer update |
| Shuffle | Embaralha, shapes acompanham pilulas | Compativel |
| Force Feed | Forca consumo, shape conta para quest do alvo | Compativel |

---

## Consideracoes de UX

### Feedback Visual de Quest

1. **Progresso:** Icone da shape fica verde/marcado
2. **Reset:** Shake animation + toast "Sequencia reiniciada"
3. **Completo:** Celebracao + toast com recompensa

### Posicionamento do ShapeQuestDisplay

Opcoes:
1. **Abaixo do inventario do jogador** - Contexto proximo
2. **No TurnIndicator** - Visivel para ambos
3. **Card separado** - Mais destaque

Recomendacao: **Abaixo do inventario** para MVP, mover se necessario.

### Clareza das Shapes

- A implementacao atual usa imagens PNG para todas as shapes
- Drop-shadow colorido indica o tipo da pilula
- Testar em fundo escuro e claro

---

## Testes Sugeridos

> **NOTA:** Os testes reais estao em `src/utils/__tests__/`.
> Os exemplos abaixo refletem o sistema de shapes ATIVAS/SAZONAIS atual.

```typescript
describe('questGenerator', () => {
  // Pool de teste com shapes ATIVAS (round, flower, fruit, pumpkin, skull, bear)
  const mockShapeCounts = createShapeCounts({
    round: 3,
    flower: 2,
    fruit: 2,
    skull: 1,
  })
  
  describe('generateShapeQuest', () => {
    it('gera sequencia apenas com shapes disponiveis no pool', () => {
      const quest = generateShapeQuest(1, mockShapeCounts)
      
      // Sequencia so pode ter shapes presentes no pool
      for (const shape of quest.sequence) {
        expect(['round', 'flower', 'fruit', 'skull']).toContain(shape)
      }
    })
  })
  
  describe('checkQuestProgress', () => {
    it('avanca progresso com shape correta', () => {
      const quest: ShapeQuest = {
        id: '1',
        sequence: ['round', 'flower'],
        progress: 0,
        completed: false,
      }
      
      const { updatedQuest } = checkQuestProgress(quest, 'round')
      expect(updatedQuest.progress).toBe(1)
    })
    
    it('completa quest ao terminar sequencia', () => {
      const quest: ShapeQuest = {
        id: '1',
        sequence: ['round'],
        progress: 0,
        completed: false,
      }
      
      const { updatedQuest, justCompleted } = checkQuestProgress(quest, 'round')
      expect(justCompleted).toBe(true)
      expect(updatedQuest.completed).toBe(true)
    })
  })
})

describe('shapeProgression', () => {
  describe('getShapeChances', () => {
    it('retorna apenas shapes ATIVAS na rodada 1', () => {
      const chances = getShapeChances(1)
      // Shapes ATIVAS na rodada 1: round, flower, fruit
      expect(chances.round).toBeGreaterThan(0)
      expect(chances.flower).toBeGreaterThan(0)
      expect(chances.fruit).toBeGreaterThan(0)
      // Shapes SAZONAIS: pct = 0
      expect(chances.capsule).toBe(0)
      expect(chances.triangle).toBe(0)
    })
    
    it('soma das probabilidades e 100', () => {
      for (let round = 1; round <= 10; round++) {
        const chances = getShapeChances(round)
        const sum = Object.values(chances).reduce((a, b) => a + b, 0)
        expect(sum).toBeCloseTo(100, 1)
      }
    })
    
    it('novas shapes ATIVAS aparecem em rodadas posteriores', () => {
      // pumpkin e skull desbloqueiam na rodada 3
      expect(getShapeChances(2).pumpkin).toBe(0)
      expect(getShapeChances(3).pumpkin).toBeGreaterThan(0)
      
      // bear desbloqueia na rodada 5
      expect(getShapeChances(4).bear).toBe(0)
      expect(getShapeChances(5).bear).toBeGreaterThan(0)
    })
  })
})
```

---

## Extensibilidade Futura

### Ativar Shape Sazonal

Para ativar uma shape sazonal (ex: evento de Halloween):

1. Editar `src/utils/shapeProgression.ts`
2. Alterar regra da shape de `{ startPct: 0, endPct: 0 }` para valores > 0
3. Exemplo: `pumpkin: { unlockRound: 1, startPct: 30, endPct: 15 }`

### Adicionar Nova Shape

1. Adicionar ao tipo `PillShape` em `pill.ts`
2. Adicionar imagem PNG em `src/assets/shapes/`
3. Adicionar entrada em `SHAPE_IMAGES` em `constants.ts`
4. Adicionar regra de progressao em `SHAPE_PROGRESSION.rules` em `shapeProgression.ts`
5. Adicionar CSS fallback em `SHAPE_CLASSES`
6. Adicionar label em `SHAPE_LABELS`

### Novos Itens da Pill Store

Para adicionar novos itens na loja:
1. Adicionar ao tipo `BoostType` em `store.ts` (se for boost)
2. Adicionar entrada em `STORE_ITEMS` em `storeConfig.ts`
3. Implementar logica em `applyPendingBoosts()` (se for boost)
4. Adicionar ao `ITEM_CATALOG` (se for power-up)

### IA Considerando Shapes

Futuro: IA pode usar informacao de shapes para:
- Priorizar pilulas que progridem seu quest
- Usar Shape Scanner para revelar shapes com mais pilulas
- Evitar Shape Bomb em shapes que progrediriam quest do oponente

