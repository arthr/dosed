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
|   +-- quest.ts               # NOVO: ShapeQuest, QuestReward
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
|   +-- ShapeSelector.tsx      # NOVO: selecao de shape para itens
|   +-- ShapeCounter.tsx       # NOVO (opcional): contagem de shapes
```

---

## Modelagem de Dados

### Novos Tipos: Quest (`src/types/quest.ts`)

```typescript
import type { PillShape } from './pill'

/**
 * Tipos de recompensa disponiveis para Shape Quests
 */
export type QuestRewardType = 
  | 'heal'           // +N resistencia
  | 'resistance_max' // Resistencia vai para MAX
  | 'reveal_random'  // Revela 1 pilula aleatoria
  | 'extra_turn'     // Jogador joga novamente

/**
 * Recompensa de um objetivo
 */
export interface QuestReward {
  type: QuestRewardType
  /** Valor associado (ex: quantidade de cura) */
  value?: number
  /** Descricao para exibicao */
  description: string
}

/**
 * Objetivo de sequencia de shapes
 */
export interface ShapeQuest {
  /** ID unico */
  id: string
  /** Sequencia de shapes a consumir */
  sequence: PillShape[]
  /** Indice da proxima shape esperada (0 = inicio) */
  progress: number
  /** Se o objetivo foi completado */
  completed: boolean
  /** Recompensa ao completar */
  reward: QuestReward
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
  /** Pool de recompensas com pesos */
  rewards: Array<{
    type: QuestRewardType
    weight: number
    value?: number
    description: string
  }>
}
```

### Alteracoes em GameState (`src/types/game.ts`)

```typescript
import type { PillShape } from './pill'
import type { ShapeQuest } from './quest'
import type { PlayerId } from './player'

export interface GameState {
  // ... campos existentes ...
  
  /** Contagem de shapes no pool atual */
  shapeCounts: Record<PillShape, number>
  
  /** Objetivo de shape de cada jogador */
  shapeQuests: Record<PlayerId, ShapeQuest | null>
  
  /** Flag para pular alternancia de turno (extra_turn reward) */
  skipNextTurnSwitch: boolean
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
import type { PillShape, ShapeQuest, QuestReward, QuestConfig } from '@/types'

import { getShapeChances } from './shapeProgression'

/**
 * Configuracao padrao de quests
 */
export const DEFAULT_QUEST_CONFIG: QuestConfig = {
  minLength: 2,
  maxLength: 3,
  increaseLengthAfterRound: 5,
  rewards: [
    { type: 'heal', weight: 35, value: 2, description: '+2 Resistencia' },
    { type: 'resistance_max', weight: 25, description: 'Resistencia MAX' },
    { type: 'reveal_random', weight: 25, description: 'Revela 1 pilula' },
    { type: 'extra_turn', weight: 15, description: 'Turno extra' },
  ],
}

/**
 * Gera uma sequencia aleatoria de shapes BASEADA no pool disponivel
 * Garante que a sequencia seja realizavel
 * 
 * NOTA: shapeCounts ja reflete a progressao da rodada (shapes nao desbloqueadas tem count 0)
 */
function generateSequenceFromPool(
  length: number, 
  shapeCounts: Record<PillShape, number>
): PillShape[] {
  // Cria pool expandido baseado nas contagens
  // Ex: { round: 2, capsule: 1, oval: 0 } -> ['round', 'round', 'capsule']
  // Shapes nao desbloqueadas ou sem pilulas no pool nao aparecem
  const availablePool: PillShape[] = []
  for (const [shape, count] of Object.entries(shapeCounts)) {
    for (let i = 0; i < count; i++) {
      availablePool.push(shape as PillShape)
    }
  }
  
  // Se pool menor que length desejado, ajusta
  const actualLength = Math.min(length, availablePool.length)
  
  // Seleciona shapes aleatorias do pool (sem reposicao para garantir realizavel)
  const sequence: PillShape[] = []
  const poolCopy = [...availablePool]
  
  for (let i = 0; i < actualLength; i++) {
    const randomIndex = Math.floor(Math.random() * poolCopy.length)
    sequence.push(poolCopy[randomIndex])
    poolCopy.splice(randomIndex, 1) // Remove para nao repetir alem do disponivel
  }
  
  return sequence
}

/**
 * Seleciona recompensa baseado em pesos
 */
function selectReward(config: QuestConfig): QuestReward {
  const totalWeight = config.rewards.reduce((sum, r) => sum + r.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const reward of config.rewards) {
    random -= reward.weight
    if (random <= 0) {
      return {
        type: reward.type,
        value: reward.value,
        description: reward.description,
      }
    }
  }
  
  // Fallback
  return config.rewards[0]
}

/**
 * Gera um novo Shape Quest BASEADO nas shapes disponiveis no pool
 * Garante que a quest seja realizavel
 * 
 * @param round - Numero da rodada (afeta tamanho da sequencia)
 * @param shapeCounts - Contagem de shapes no pool atual
 * @param config - Configuracao de quest
 */
export function generateShapeQuest(
  round: number,
  shapeCounts: Record<PillShape, number>,
  config: QuestConfig = DEFAULT_QUEST_CONFIG
): ShapeQuest {
  // Calcula total de pilulas disponiveis
  const totalPills = Object.values(shapeCounts).reduce((sum, count) => sum + count, 0)
  
  // Determina tamanho da sequencia (limitado pelo pool)
  let length = config.minLength
  if (round >= config.increaseLengthAfterRound) {
    // 50% chance de sequencia maior apos rodada X
    length = Math.random() < 0.5 ? config.minLength : config.maxLength
  }
  
  // Limita ao tamanho do pool
  length = Math.min(length, totalPills)
  
  return {
    id: uuidv4(),
    sequence: generateSequenceFromPool(length, shapeCounts),
    progress: 0,
    completed: false,
    reward: selectReward(config),
  }
}

/**
 * Verifica progresso do quest ao consumir pilula
 * Retorna o quest atualizado e se completou
 * 
 * NOTA: Ao completar, NAO gera novo quest. Jogador aguarda proxima rodada.
 */
export function checkQuestProgress(
  quest: ShapeQuest,
  consumedShape: PillShape
): { updatedQuest: ShapeQuest; justCompleted: boolean } {
  // Se quest ja completado, ignora (jogador aguarda proxima rodada)
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
        completed: justCompleted, // Marca como completado, NAO gera novo
      },
      justCompleted,
    }
  } else {
    // Shape errada: reset progresso
    return {
      updatedQuest: {
        ...quest,
        progress: 0,
      },
      justCompleted: false,
    }
  }
}
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
  
  skipNextTurnSwitch: false,
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
    let questReward: QuestReward | null = null
    
    if (currentQuest && !currentQuest.completed) {
      const { updatedQuest, justCompleted } = checkQuestProgress(
        currentQuest,
        pill.visuals.shape
      )
      
      if (justCompleted) {
        questReward = updatedQuest.reward
        // NAO gera novo quest - jogador aguarda proxima rodada
        // Quest fica marcado como completed
      }
      
      newShapeQuests[currentPlayerId] = updatedQuest
    }
    
    // Remove pilula do pool
    const newPillPool = state.pillPool.filter(p => p.id !== pillId)
    
    return {
      ...state,
      pillPool: newPillPool,
      typeCounts: newTypeCounts,
      shapeCounts: newShapeCounts,
      shapeQuests: newShapeQuests,
      // questReward sera processado separadamente para aplicar bonus
    }
  })
},
```

---

## Novos Itens

### Shape Bomb (`src/utils/itemCatalog.ts`)

```typescript
export const ITEM_CATALOG: Record<ItemType, ItemDefinition> = {
  // ... existentes ...
  
  SHAPE_BOMB: {
    type: 'SHAPE_BOMB',
    name: 'Shape Bomb',
    description: 'Elimina todas pilulas de uma forma',
    icon: Bomb, // lucide-react
    category: 'chaos',
    targetType: 'shape', // Novo target type
    usableOnOpponent: false,
  },
  
  SHAPE_SCANNER: {
    type: 'SHAPE_SCANNER',
    name: 'Shape Scanner',
    description: 'Revela todas pilulas de uma forma',
    icon: ScanSearch, // lucide-react
    category: 'intel',
    targetType: 'shape',
    usableOnOpponent: false,
  },
}
```

### Logica dos Itens (`src/stores/gameStore.ts`)

```typescript
// Dentro de executeItem:
case 'SHAPE_BOMB': {
  if (!targetShape) break
  
  // Remove todas pilulas da shape selecionada
  const pillsToRemove = state.pillPool.filter(p => p.visuals.shape === targetShape)
  const newPillPool = state.pillPool.filter(p => p.visuals.shape !== targetShape)
  
  // Atualiza contagens
  const newTypeCounts = { ...state.typeCounts }
  const newShapeCounts = { ...state.shapeCounts }
  
  for (const pill of pillsToRemove) {
    newTypeCounts[pill.type]--
    newShapeCounts[pill.visuals.shape]--
  }
  
  // Verifica se pool esvaziou
  if (newPillPool.length === 0) {
    // Trigger nova rodada
  }
  
  return {
    pillPool: newPillPool,
    typeCounts: newTypeCounts,
    shapeCounts: newShapeCounts,
    // ...
  }
}

case 'SHAPE_SCANNER': {
  if (!targetShape) break
  
  // Encontra todas pilulas da shape e revela
  const pillsToReveal = state.pillPool
    .filter(p => p.visuals.shape === targetShape)
    .map(p => p.id)
  
  const newRevealedPills = new Set([...state.revealedPills, ...pillsToReveal])
  
  return {
    revealedPills: newRevealedPills,
    // ...
  }
}
```

### Componente ShapeSelector.tsx (Novo)

```tsx
import type { PillShape } from '@/types'
import { ShapeIcon } from './ShapeIcon'
import { motion } from 'framer-motion'
import { SHAPE_LABELS } from '@/utils/constants'

interface ShapeSelectorProps {
  /** Shapes disponiveis para selecao (apenas as que existem no pool) */
  availableShapes: PillShape[]
  /** Contagem de cada shape */
  shapeCounts: Record<PillShape, number>
  onSelect: (shape: PillShape) => void
  onCancel: () => void
}

export function ShapeSelector({
  availableShapes,
  shapeCounts,
  onSelect,
  onCancel,
}: ShapeSelectorProps) {
  // Filtra apenas shapes com count > 0
  const selectableShapes = availableShapes.filter(s => shapeCounts[s] > 0)
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-card p-6 rounded-lg shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4">Selecione uma Forma</h3>
        
        <div className="flex gap-4">
          {selectableShapes.map(shape => (
            <button
              key={shape}
              onClick={() => onSelect(shape)}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <ShapeIcon shape={shape} size="lg" color="#6b7280" />
              <span className="text-sm">{SHAPE_LABELS[shape]}</span>
              <span className="text-xs text-muted-foreground">
                ({shapeCounts[shape]})
              </span>
            </button>
          ))}
        </div>
        
        <button
          onClick={onCancel}
          className="mt-4 w-full py-2 text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
      </motion.div>
    </motion.div>
  )
}
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
|       |       +-> Complete: aplica recompensa (NAO gera novo quest)     |
|       |                                                                 |
|       v                                                                 |
|  [UI atualiza: ShapeQuestDisplay mostra progresso]                      |
|       |                                                                 |
|       +-> Toast de feedback (progresso/completou/resetou)               |
|       +-> Se completou: UI mostra "Aguardando proxima rodada"           |
|       |                                                                 |
|       v                                                                 |
|  [Alterna turno] (ou turno extra se reward = extra_turn)                |
|       |                                                                 |
|  [Pool esvazia? -> resetRound() -> NOVOS QUESTS gerados]                |
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
    
    it('gera reward valido', () => {
      const quest = generateShapeQuest(1, mockShapeCounts)
      expect(['heal', 'resistance_max', 'reveal_random', 'extra_turn'])
        .toContain(quest.reward.type)
    })
  })
  
  describe('checkQuestProgress', () => {
    it('avanca progresso com shape correta', () => {
      const quest: ShapeQuest = {
        id: '1',
        sequence: ['round', 'triangle'],
        progress: 0,
        completed: false,
        reward: { type: 'heal', value: 2, description: '+2' },
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
        reward: { type: 'heal', value: 2, description: '+2' },
      }
      
      const { updatedQuest } = checkQuestProgress(quest, 'capsule')
      expect(updatedQuest.progress).toBe(0)
    })
    
    it('completa quest ao terminar sequencia', () => {
      const quest: ShapeQuest = {
        id: '1',
        sequence: ['round'],
        progress: 0,
        completed: false,
        reward: { type: 'heal', value: 2, description: '+2' },
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

### Recompensas Adicionais

Para adicionar novas recompensas (ex: `life`, `item_refill`):
1. Adicionar ao tipo `QuestRewardType`
2. Adicionar entrada em `DEFAULT_QUEST_CONFIG.rewards`
3. Implementar aplicacao no `consumePill` ou separadamente

### IA Considerando Shapes

Futuro: IA pode usar informacao de shapes para:
- Priorizar pilulas que progridem seu quest
- Usar Shape Scanner para revelar shapes com mais pilulas
- Evitar Shape Bomb em shapes que progrediriam quest do oponente

