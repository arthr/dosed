# Design: Sistema de Formas (Shape System)

> **ATUALIZADO:** Este documento foi originalmente escrito para 5 shapes. A implementacao
> atual suporta **16 shapes** com imagens PNG. Exemplos de codigo neste documento podem
> estar desatualizados - consulte os arquivos fonte para a implementacao atual:
> - `src/utils/shapeProgression.ts` - Configuracao de progressao
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
 * NOTAS DE DESIGN (ATUALIZADO):
 * - Rodada 1: capsule, round (formas basicas)
 * - Rodada 2: + triangle, oval
 * - Rodada 3: + cross, heart
 * - Rodada 4: + flower, star
 * - Rodada 5: + pumpkin, coin
 * - Rodada 6: + bear, gem
 * - Rodada 7: + skull, domino
 * - Rodada 8+: + pineapple, fruit (todas 16 disponiveis)
 * 
 * NOTA: Algumas shapes podem estar desabilitadas (pct: 0) para liberacao em fases futuras.
 * Consulte src/utils/shapeProgression.ts para configuracao atual.
 */
// Exemplo simplificado - implementacao real em src/utils/shapeProgression.ts
export const SHAPE_PROGRESSION: ShapeProgressionConfig = {
  maxRound: 15,
  rules: {
    // 16 shapes - ver implementacao completa em shapeProgression.ts
    capsule:   { unlockRound: 1, startPct: X, endPct: Y },
    round:     { unlockRound: 1, startPct: X, endPct: Y },
    // ... demais 14 shapes
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

  const rawWeights: Record<PillShape, number> = {
    round: 0,
    capsule: 0,
    oval: 0,
    triangle: 0,
    hexagon: 0,
  }

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

  const distribution: Record<PillShape, number> = {
    round: 0,
    capsule: 0,
    oval: 0,
    triangle: 0,
    hexagon: 0,
  }

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
  const counts: Record<PillShape, number> = {
    round: 0,
    capsule: 0,
    oval: 0,
    triangle: 0,
    hexagon: 0,
  }
  
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
    // Inicia fase de shopping
    set({
      phase: 'shopping',
      storeState: {
        confirmed: { player1: false, player2: false },
        timerStartedAt: Date.now(),
        timerDuration: DEFAULT_STORE_CONFIG.shoppingTime,
        pendingBoosts: { player1: [], player2: [] },
      },
    })
  } else {
    // Ninguem quer, proxima rodada direto
    get().resetRound()
  }
},

/**
 * Compra item da loja
 */
purchaseStoreItem: (playerId: PlayerId, itemId: string) => {
  const state = get()
  const player = state.players[playerId]
  const item = STORE_ITEMS.find(i => i.id === itemId)
  
  if (!item || player.pillCoins < item.cost) return
  if (item.isAvailable && !item.isAvailable(player)) return
  
  // Deduz coins
  const newPlayers = {
    ...state.players,
    [playerId]: {
      ...player,
      pillCoins: player.pillCoins - item.cost,
      // Se power_up, adiciona ao inventario
      items: item.type === 'power_up' && item.itemType
        ? [...player.items, { type: item.itemType, usesRemaining: 1 }]
        : player.items,
    },
  }
  
  // Se boost, adiciona a pendingBoosts
  let newStoreState = state.storeState
  if (item.type === 'boost' && item.boostType && newStoreState) {
    newStoreState = {
      ...newStoreState,
      pendingBoosts: {
        ...newStoreState.pendingBoosts,
        [playerId]: [...newStoreState.pendingBoosts[playerId], item.boostType],
      },
    }
  }
  
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

### Constantes de Estilo (`src/utils/constants.ts`)

```typescript
import type { PillShape } from '@/types'

/**
 * Classes CSS para cada shape
 * Usadas pelo componente Pill.tsx
 */
export const SHAPE_CLASSES: Record<PillShape, string> = {
  round: 'rounded-full aspect-square',
  capsule: 'rounded-full aspect-[1.6]',
  oval: 'rounded-full aspect-[1.3]',
  triangle: '', // Usa clip-path inline
  hexagon: '',  // Usa clip-path inline
}

/**
 * Clip-paths para shapes nao-circulares
 */
export const SHAPE_CLIP_PATHS: Record<PillShape, string | null> = {
  round: null,
  capsule: null,
  oval: null,
  triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
  hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
}

/**
 * Labels de exibicao para cada shape
 */
export const SHAPE_LABELS: Record<PillShape, string> = {
  round: 'Circulo',
  capsule: 'Capsula',
  oval: 'Oval',
  triangle: 'Triangulo',
  hexagon: 'Hexagono',
}

// DEPRECIAR ou REMOVER:
// export const PILL_SHAPES: Record<PillType, string> = { ... }
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
  
  shapeCounts: {
    capsule: 0,
    round: 0,
    triangle: 0,
    oval: 0,
    hexagon: 0,
  },
  
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
  },
  
  shape_scanner: {
    type: 'shape_scanner',
    name: 'Shape Scanner',
    description: 'Revela todas pilulas de uma forma',
    icon: 'ScanSearch',
    category: 'intel',
    targetType: 'pill',  // Reutiliza selecao de pill existente
    color: 'text-blue-400',
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

- Triangle e Hexagon usam clip-path (pode ter bordas duras)
- Considerar adicionar borda/sombra para melhor visibilidade
- Testar em fundo escuro e claro

---

## Testes Sugeridos

```typescript
describe('questGenerator', () => {
  // Pool de teste com shapes variadas
  const mockShapeCounts = {
    round: 3,
    capsule: 2,
    triangle: 1,
    oval: 2,
    hexagon: 1,
  }
  
  describe('generateShapeQuest', () => {
    it('gera sequencia com tamanho correto por rodada', () => {
      const quest1 = generateShapeQuest(1, mockShapeCounts)
      expect(quest1.sequence.length).toBe(2)
      
      // Rodada 5+: pode ser 2 ou 3
      const quests = Array.from({ length: 20 }, () => 
        generateShapeQuest(5, mockShapeCounts)
      )
      const lengths = quests.map(q => q.sequence.length)
      expect(lengths).toContain(2)
      expect(lengths).toContain(3)
    })
    
    it('gera sequencia apenas com shapes disponiveis no pool', () => {
      const limitedPool = { round: 2, capsule: 1, triangle: 0, oval: 0, hexagon: 0 }
      const quest = generateShapeQuest(1, limitedPool)
      
      // Sequencia so pode ter round ou capsule
      for (const shape of quest.sequence) {
        expect(['round', 'capsule']).toContain(shape)
      }
    })
    
    it('limita tamanho da sequencia ao pool disponivel', () => {
      const tinyPool = { round: 1, capsule: 1, triangle: 0, oval: 0, hexagon: 0 }
      const quest = generateShapeQuest(5, tinyPool) // Rodada 5 pediria 2-3
      
      // Mas pool so tem 2 pilulas
      expect(quest.sequence.length).toBeLessThanOrEqual(2)
    })
    
  })
  
  describe('checkQuestProgress', () => {
    it('avanca progresso com shape correta', () => {
      const quest: ShapeQuest = {
        id: '1',
        sequence: ['round', 'triangle'],
        progress: 0,
        completed: false,
      }
      
      const { updatedQuest } = checkQuestProgress(quest, 'round')
      expect(updatedQuest.progress).toBe(1)
    })
    
    it('reseta progresso com shape errada', () => {
      const quest: ShapeQuest = {
        id: '1',
        sequence: ['round', 'triangle'],
        progress: 1,
        completed: false,
      }
      
      const { updatedQuest } = checkQuestProgress(quest, 'capsule')
      expect(updatedQuest.progress).toBe(0)
    })
    
    it('completa quest ao terminar sequencia (justCompleted = true para dar Pill Coin)', () => {
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
    it('retorna apenas shapes desbloqueadas na rodada 1', () => {
      const chances = getShapeChances(1)
      expect(chances.round).toBeGreaterThan(0)
      expect(chances.capsule).toBeGreaterThan(0)
      expect(chances.oval).toBe(0)      // Desbloqueia rodada 2
      expect(chances.triangle).toBe(0)  // Desbloqueia rodada 3
      expect(chances.hexagon).toBe(0)   // Desbloqueia rodada 5
    })
    
    it('soma das probabilidades e 100', () => {
      for (let round = 1; round <= 10; round++) {
        const chances = getShapeChances(round)
        const sum = Object.values(chances).reduce((a, b) => a + b, 0)
        expect(sum).toBeCloseTo(100, 1)
      }
    })
    
    it('todas shapes disponiveis na rodada 5+', () => {
      const chances = getShapeChances(5)
      expect(chances.round).toBeGreaterThan(0)
      expect(chances.capsule).toBeGreaterThan(0)
      expect(chances.oval).toBeGreaterThan(0)
      expect(chances.triangle).toBeGreaterThan(0)
      expect(chances.hexagon).toBeGreaterThan(0)
    })
  })
  
  describe('distributeShapes', () => {
    it('distribui apenas shapes desbloqueadas na rodada 1', () => {
      const distribution = distributeShapes(6, 1)
      expect(distribution.round).toBeGreaterThan(0)
      expect(distribution.capsule).toBeGreaterThan(0)
      expect(distribution.oval).toBe(0)
      expect(distribution.triangle).toBe(0)
      expect(distribution.hexagon).toBe(0)
      
      const total = Object.values(distribution).reduce((a, b) => a + b, 0)
      expect(total).toBe(6)
    })
  })
})
```

---

## Extensibilidade Futura

### Adicionar Nova Shape

1. Adicionar ao tipo `PillShape` em `pill.ts`
2. Adicionar regra de progressao em `SHAPE_PROGRESSION.rules` em `shapeProgression.ts`
3. Adicionar CSS em `SHAPE_CLASSES` e `SHAPE_CLIP_PATHS`
4. Adicionar label em `SHAPE_LABELS`
5. Adicionar count inicial em `initialState.shapeCounts`

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

