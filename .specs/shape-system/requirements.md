# Requirements: Sistema de Formas (Shape System)

## Visao Geral

O Shape System adiciona uma nova camada de gamificacao ao jogo, onde cada pilula possui uma **forma visual independente do seu tipo de efeito**. O sistema introduz tres mecanicas principais:

1. **Shapes Aleatorias:** Desacoplar shape do type para adicionar incerteza visual
2. **Shape Quests:** Objetivos de sequencia que concedem bonus ao completar
3. **Itens Baseados em Shape:** Novos itens que interagem com formas

> **Objetivo:** Criar profundidade estrategica atraves de informacao parcial - o jogador ve a forma mas nao sabe o efeito.

---

## Shapes Disponiveis

**ATUALIZADO:** Expandido para 16 shapes com imagens PNG.

| Shape | Arquivo | Desbloqueio | Descricao |
| :--- | :--- | :--- | :--- |
| `capsule` | shape_1.png | Rodada 1 | Capsula azul horizontal |
| `round` | shape_6.png | Rodada 1 | Pilula redonda azul |
| `triangle` | shape_8.png | Rodada 2 | Triangulo vermelho |
| `oval` | shape_11.png | Rodada 2 | Oval amarela |
| `cross` | shape_2.png | Rodada 3 | Cruz roxa |
| `heart` | shape_9.png | Rodada 3 | Coracao vermelho |
| `flower` | shape_4.png | Rodada 4 | Flor rosa |
| `star` | shape_13.png | Rodada 4 | Estrela verde |
| `pumpkin` | shape_12.png | Rodada 5 | Abobora laranja |
| `coin` | shape_14.png | Rodada 5 | Moeda dourada |
| `bear` | shape_5.png | Rodada 6 | Urso verde |
| `gem` | shape_15.png | Rodada 6 | Gema roxa |
| `skull` | shape_3.png | Rodada 7 | Caveira roxa |
| `domino` | shape_16.png | Rodada 7 | Domino laranja |
| `pineapple` | shape_7.png | Rodada 8 | Abacaxi rosa |
| `fruit` | shape_10.png | Rodada 8 | Fruta rosa |

**Total:** 16 shapes disponiveis com imagens PNG em `src/assets/shapes/`.

> **Nota:** O visual usa imagens PNG com fundo transparente. CSS classes servem como fallback.

---

## Requisitos Funcionais

### RF-001: Progressao de Shapes na Geracao

**EARS:** O sistema DEVE atribuir shapes de forma **progressiva** a cada pilula, onde a variedade de shapes aumenta conforme as rodadas avancam (similar ao sistema de progressao de pills).

**Comportamento Atual:**
```typescript
// ATUAL: Shape fixa por tipo (1:1)
shape: PILL_SHAPES[type]  // SAFE = 'round', DMG_LOW = 'capsule', etc.
```

**Comportamento Desejado:**
```typescript
// NOVO: Shape progressiva baseada na rodada
shape: rollShape(round)  // Usa distribuicao da rodada atual
```

#### 1.1 Configuracao de Progressao de Shapes

```typescript
interface ShapeRule {
  unlockRound: number  // Rodada de desbloqueio
  startPct: number     // % no desbloqueio
  endPct: number       // % na rodada maxima
}

const SHAPE_PROGRESSION: Record<PillShape, ShapeRule> = {
  round:    { unlockRound: 1, startPct: 50, endPct: 15 },  // Comum -> Raro
  capsule:  { unlockRound: 1, startPct: 50, endPct: 20 },  // Comum -> Menos comum
  oval:     { unlockRound: 2, startPct: 20, endPct: 20 },  // Intermediaria
  triangle: { unlockRound: 3, startPct: 15, endPct: 25 },  // Angular, mais distinta
  hexagon:  { unlockRound: 5, startPct: 10, endPct: 20 },  // Complexa, late game
}
```

#### 1.2 Tabela de Desbloqueio (16 Shapes)

| Rodada | Shapes Disponiveis | Total |
| :--- | :--- | :--- |
| 1 | capsule, round | 2 |
| 2 | + triangle, oval | 4 |
| 3 | + cross, heart | 6 |
| 4 | + flower, star | 8 |
| 5 | + pumpkin, coin | 10 |
| 6 | + bear, gem | 12 |
| 7 | + skull, domino | 14 |
| 8+ | + pineapple, fruit | 16 (todas) |

#### 1.3 Exemplo de Distribuicao por Rodada

| Rodada | capsule | round | triangle | oval | ... |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 50% | 50% | 0% | 0% | ... |
| 2 | 42% | 42% | 16% | 0% | 0% |
| 3 | 35% | 36% | 17% | 12% | 0% |
| 5 | 25% | 28% | 18% | 19% | 10% |
| 10 | 18% | 23% | 19% | 23% | 17% |
| 15 | 15% | 20% | 20% | 25% | 20% |

> **Nota:** Valores sao aproximados e normalizados para 100%.

**Criterios de Aceitacao:**
- [ ] Shapes sao atribuidas usando sistema de progressao (nao aleatorio uniforme)
- [ ] Shapes desbloqueiam gradualmente conforme rodadas avancam
- [ ] Distribuicao usa interpolacao linear (lerp) como pills
- [ ] `getShapeChances(round)` retorna probabilidades normalizadas
- [ ] `rollShape(round)` sorteia shape baseado na rodada
- [ ] `distributeShapes(count, round)` distribui shapes proporcionalmente
- [ ] Shape e armazenada no `Pill.visuals.shape` (estrutura ja existe)
- [ ] Shape e SEMPRE visivel, mesmo quando pilula esta oculta

**Impacto na UX:**
- Rodadas iniciais: poucas shapes, mais previsivel
- Rodadas tardias: mais variedade, mais caos
- Progressao visual acompanha progressao de tipos
- Shape Quests se adaptam as shapes disponiveis

---

### RF-002: Renderizacao Visual de Shapes

**EARS:** O componente `Pill.tsx` DEVE renderizar a forma visual correspondente ao atributo `shape` da pilula.

**Comportamento Atual:**
```tsx
// ATUAL: Todas pilulas sao circulos
<motion.button className="rounded-full ...">
```

**Comportamento Desejado:**
```tsx
// NOVO: Shape determina formato visual via CSS
<motion.button className={getShapeClasses(pill.visuals.shape)}>
```

**Mapeamento de Shapes para CSS:**

| Shape | Implementacao CSS | Aspecto |
| :--- | :--- | :--- |
| `round` | `rounded-full aspect-square` | Circulo perfeito |
| `capsule` | `rounded-full aspect-[1.6]` | Retangulo arredondado (horizontal) |
| `oval` | `rounded-full aspect-[1.3]` | Elipse suave |
| `triangle` | `clip-path: polygon(50% 0%, 0% 100%, 100% 100%)` | Triangulo |
| `hexagon` | `clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)` | Hexagono |

**Criterios de Aceitacao:**
- [ ] Cada shape tem representacao visual distinta e reconhecivel
- [ ] Shapes funcionam em todos os tamanhos (sm, md, lg)
- [ ] Animacoes existentes (hover, tap, pulse) funcionam com todas shapes
- [ ] Cores aplicam corretamente sobre todas shapes
- [ ] Badges (inverted, doubled) posicionam corretamente em todas shapes

---

### RF-003: Contagem Publica de Shapes

**EARS:** O sistema DEVE calcular e disponibilizar a contagem de shapes no pool atual.

**Estrutura:**
```typescript
shapeCounts: Record<PillShape, number>
// Exemplo: { capsule: 2, round: 3, triangle: 1, oval: 2, hexagon: 1 }
```

**Criterios de Aceitacao:**
- [ ] `shapeCounts` calculado na geracao do pool
- [ ] `shapeCounts` atualizado ao consumir/remover pilulas
- [ ] Funcao `countPillShapes(pills)` disponivel em pillGenerator
- [ ] UI de contagem de shapes disponivel (similar a TypeCounter)

**Nota:** A exibicao na UI e opcional inicialmente. O estado deve estar disponivel para Shape Quests e itens.

---

### RF-004: Sistema de Objetivos (Shape Quests)

**EARS:** O sistema DEVE atribuir objetivos de sequencia de shapes a cada jogador, concedendo bonus aleatorios ao completar.

#### 4.1 Estrutura do Objetivo

```typescript
interface ShapeQuest {
  /** ID unico do objetivo */
  id: string
  /** Sequencia de shapes a consumir */
  sequence: PillShape[]
  /** Progresso atual (indice da proxima shape esperada) */
  progress: number
  /** Se o objetivo foi completado */
  completed: boolean
  /** Recompensa ao completar */
  reward: QuestReward
}

interface QuestReward {
  type: 'heal' | 'resistance_max' | 'reveal_random' | 'extra_turn'
  value?: number
  description: string
}
```

#### 4.2 Pool de Recompensas

| Tipo | Descricao | Peso |
| :--- | :--- | :--- |
| `heal` | +2 Resistencia | 35% |
| `resistance_max` | Resistencia vai para MAX | 25% |
| `reveal_random` | Revela 1 pilula aleatoria do pool | 25% |
| `extra_turn` | Jogador joga novamente (nao passa turno) | 15% |

> **Nota:** Pool simplificado para MVP. Recompensas como `life` (+1 vida) e `item_refill` podem ser adicionadas futuramente via sistema de progressao.

#### 4.3 Geracao de Objetivos

**Regras:**
- Sequencias tem **2 a 3 shapes** (simplicidade para MVP)
- Tamanho aumenta com a rodada:
  - Rodadas 1-4: 2 shapes
  - Rodadas 5+: 2-3 shapes (aleatorio)
- **Sequencia DEVE ser realizavel:** apenas shapes presentes no pool atual podem ser incluidas
- Shapes na sequencia podem repetir, respeitando quantidade disponivel no pool
- Novo objetivo gerado **apenas no inicio de cada rodada** (nao ao completar)
- Ao completar quest na rodada atual, jogador aguarda proxima rodada para novo objetivo

**Geracao Baseada no Pool:**
```typescript
// Exemplo: pool tem { round: 3, capsule: 2, triangle: 1 }
// Quest valida: [round, capsule] ou [round, round, capsule]
// Quest INVALIDA: [hexagon, ...] (nao existe no pool)
```

**Criterios de Aceitacao:**
- [ ] Objetivo atribuido a cada jogador no inicio de cada rodada
- [ ] Sequencia gerada APENAS com shapes disponiveis no pool atual
- [ ] Sequencia respeita quantidade de cada shape no pool (nao pede 3 triangles se so tem 1)
- [ ] Progresso rastreado a cada pilula consumida
- [ ] Consumir shape CORRETA: avanca progresso
- [ ] Consumir shape ERRADA: reseta progresso para 0
- [ ] Ao completar: bonus aplicado, quest marcado como completed (nao gera novo)
- [ ] Novo quest so e gerado na proxima rodada
- [ ] UI exibe objetivo atual e progresso (abaixo do inventario ou proximo)
- [ ] UI indica quando quest foi completado (aguardando proxima rodada)

#### 4.4 Logica de Progresso

```typescript
// Pseudo-codigo
function onPillConsumed(player: Player, pill: Pill) {
  const quest = player.shapeQuest
  if (!quest || quest.completed) return // Ignora se ja completou nesta rodada
  
  const expectedShape = quest.sequence[quest.progress]
  
  if (pill.visuals.shape === expectedShape) {
    quest.progress++
    if (quest.progress >= quest.sequence.length) {
      quest.completed = true
      applyQuestReward(player, quest.reward)
      // NAO gera novo quest - jogador aguarda proxima rodada
    }
  } else {
    quest.progress = 0 // Reset
  }
}

// Geracao de quest baseada no pool
function generateShapeQuest(round: number, shapeCounts: Record<PillShape, number>) {
  const availableShapes = Object.entries(shapeCounts)
    .filter(([_, count]) => count > 0)
    .map(([shape, _]) => shape as PillShape)
  
  // Sequencia usa apenas shapes disponiveis
  const sequence = generateSequenceFromAvailable(availableShapes, shapeCounts, length)
  // ...
}
```

---

### RF-005: Itens Baseados em Shape

**EARS:** O sistema DEVE suportar novos itens que interagem com shapes.

#### 5.1 Shape Bomb

| Propriedade | Valor |
| :--- | :--- |
| **Nome** | Shape Bomb |
| **Categoria** | Chaos |
| **Efeito** | Remove todas pilulas de uma shape especifica do pool |
| **Alvo** | Selecao de shape (UI mostra opcoes disponiveis no pool) |
| **Descricao** | "Elimina todas pilulas de uma forma" |

**Fluxo:**
1. Jogador usa item
2. UI mostra shapes existentes no pool como opcoes
3. Jogador seleciona shape
4. Todas pilulas daquela shape sao removidas

**Criterios de Aceitacao:**
- [ ] Item definido no catalogo com categoria Chaos
- [ ] UI de selecao de shape implementada (ShapeSelector)
- [ ] Multiplas pilulas podem ser removidas de uma vez
- [ ] Contagens (typeCounts e shapeCounts) atualizadas
- [ ] Se pool esvaziar, nova rodada inicia

#### 5.2 Shape Scanner

| Propriedade | Valor |
| :--- | :--- |
| **Nome** | Shape Scanner |
| **Categoria** | Intel |
| **Efeito** | Revela o tipo de todas pilulas de uma shape especifica |
| **Alvo** | Selecao de shape |
| **Descricao** | "Revela todas pilulas de uma forma" |

**Criterios de Aceitacao:**
- [ ] Item definido no catalogo com categoria Intel
- [ ] Multiplas pilulas podem ser reveladas de uma vez
- [ ] Pilulas reveladas adicionadas ao `revealedPills`
- [ ] UI indica quais pilulas foram reveladas (visual de scanned)

#### 5.3 Shape Shift (Futuro/Opcional)

| Propriedade | Valor |
| :--- | :--- |
| **Nome** | Shape Shift |
| **Categoria** | Chaos |
| **Efeito** | Muda a shape de todas as pilulas da poll para o shape selecionado |
| **Alvo** | Pilula |
| **Descricao** | "Transforma todas as pilulas" |

> **Status:** Baixa prioridade para MVP. Pode confundir progresso de Shape Quests.

---

## Requisitos Nao-Funcionais

### RNF-001: Performance
- Geracao de shapes aleatorias: O(n) onde n = quantidade de pilulas
- Verificacao de progresso de quest: O(1) por consumo
- Atualizacao de shapeCounts: O(1) por operacao

### RNF-002: UX
- Shapes devem ser facilmente distinguiveis em tamanho pequeno
- Objetivo atual sempre visivel durante o turno do jogador
- Feedback visual ao progredir/completar objetivo (toast + animacao)
- Feedback visual ao errar shape (toast de reset)

### RNF-003: Retrocompatibilidade
- Sistema de Shape Quests pode ser desativado via flag
- Itens de shape sao opcionais no catalogo
- Jogo funciona normalmente se features de shape estiverem desabilitadas

### RNF-004: Testabilidade
- Funcoes de geracao de quest devem ser puras (deterministic com seed)
- Config de recompensas customizavel para testes
- `rollShape()` e `distributeShapes()` aceitam config para testes

---

## Modelo de Dados

### Alteracoes em GameState

```typescript
interface GameState {
  // ... campos existentes ...
  
  /** Contagem de shapes no pool atual */
  shapeCounts: Record<PillShape, number>
  
  /** Objetivo de shape de cada jogador */
  shapeQuests: Record<PlayerId, ShapeQuest | null>
}
```

### Alteracoes em Player (minimas)

```typescript
// Nao requer alteracao no Player
// shapeQuest e armazenado no GameState.shapeQuests[playerId]
// Isso evita duplicacao e facilita acesso global
```

### Novos Tipos

```typescript
// src/types/quest.ts (novo arquivo)
export type QuestRewardType = 'heal' | 'resistance_max' | 'reveal_random' | 'extra_turn'

export interface QuestReward {
  type: QuestRewardType
  value?: number
  description: string
}

export interface ShapeQuest {
  id: string
  sequence: PillShape[]
  progress: number
  completed: boolean
  reward: QuestReward
}
```

---

## Fases de Implementacao

### Fase 1: Progressao de Shapes (MVP Core)
- [ ] Criar `shapeProgression.ts` com regras de progressao
- [ ] Implementar `getShapeChances()`, `rollShape()`, `distributeShapes()`
- [ ] Refatorar `generatePillPool()` para usar distribuicao de shapes
- [ ] Atualizar `Pill.tsx` para renderizar shapes visualmente
- [ ] Adicionar `shapeCounts` ao GameState
- [ ] Implementar `countPillShapes()` em shapeProgression

### Fase 2: UI de Shapes
- [ ] Criar componente `ShapeIcon.tsx` para exibir forma isolada
- [ ] Criar componente `ShapeCounter.tsx` (similar a TypeCounter)
- [ ] Atualizar TypeCounter para incluir toggle shapes (opcional)

### Fase 3: Sistema de Shape Quests
- [ ] Criar tipos em `src/types/quest.ts`
- [ ] Criar `src/utils/questGenerator.ts` com logica de geracao
- [ ] Adicionar `shapeQuests` ao GameState
- [ ] Implementar logica de progresso no consumePill
- [ ] Criar `ShapeQuestDisplay.tsx` para UI do objetivo

### Fase 4: Itens de Shape
- [ ] Adicionar `SHAPE_BOMB` e `SHAPE_SCANNER` ao ItemType
- [ ] Implementar itens em `itemCatalog.ts`
- [ ] Criar `ShapeSelector.tsx` para selecao de shape
- [ ] Implementar logica de efeitos em `itemLogic.ts`
- [ ] Integrar com `gameStore.executeItem()`

---

## Dependencias

### Arquivos a Criar
- `src/utils/shapeProgression.ts` - Progressao de shapes (similar a pillProgression)
- `src/types/quest.ts` - Tipos de ShapeQuest e QuestReward
- `src/utils/questGenerator.ts` - Geracao e logica de quests
- `src/components/game/ShapeIcon.tsx` - Icone de shape isolado
- `src/components/game/ShapeQuestDisplay.tsx` - UI do objetivo
- `src/components/game/ShapeSelector.tsx` - Selecao de shape para itens
- `src/components/game/ShapeCounter.tsx` - Contagem de shapes (opcional)

### Arquivos a Modificar
- `src/types/pill.ts` - Manter PillShape (ja existe)
- `src/types/game.ts` - Adicionar shapeCounts, shapeQuests
- `src/types/item.ts` - Adicionar novos ItemTypes
- `src/utils/pillGenerator.ts` - Usar shapeProgression para distribuir shapes
- `src/utils/constants.ts` - Remover PILL_SHAPES fixo (ou depreciar)
- `src/utils/itemCatalog.ts` - Novos itens
- `src/stores/gameStore.ts` - shapeCounts, shapeQuests, rewards, logica de progresso
- `src/components/game/Pill.tsx` - Renderizacao de shapes
- `src/hooks/usePillConsumption.ts` - Trigger progresso de quest

---

## Metricas de Sucesso

- [ ] Shapes sao distribuidas seguindo progressao por rodada
- [ ] Rodada 1 tem apenas round e capsule
- [ ] Todas 16 shapes desbloqueadas na rodada 8+ (conforme ativadas em SHAPE_PROGRESSION)
- [ ] Todas shapes ativas sao visualmente distintas e reconheciveis
- [ ] Sistema de Shape Quests funciona sem bugs de progresso
- [ ] Quests usam apenas shapes disponiveis na rodada
- [ ] Novos itens integrados ao catalogo e funcionais
- [ ] IA funciona normalmente (nao precisa considerar shapes)
- [ ] Testes unitarios para shapeProgression e questGenerator

---

## Decisoes de Design

### Por que progressao de shapes (e nao aleatorio uniforme)?

O sistema de shapes progressivo segue a mesma filosofia do sistema de pills:
- **Caos controlado:** Comeca simples, aumenta complexidade gradualmente
- **Curva de aprendizado:** Jogador aprende a distinguir 2 shapes antes de ver 5
- **Consistencia:** Mesmo padrao de progressao para tipos e shapes
- **Balanceamento:** Evita situacoes onde todas shapes sao iguais em rodadas iniciais

**Comparativo:**
| Aspecto | Aleatorio Uniforme | Progressivo |
| :--- | :--- | :--- |
| Rodada 1 | 16 shapes possiveis | 2 shapes (capsule, round) |
| Previsibilidade | Baixa desde inicio | Aumenta gradualmente |
| Curva de aprendizado | Abrupta | Suave |
| Quests iniciais | Podem pedir qualquer shape | Apenas shapes disponiveis |

### Por que sequencia exata para quests?

Embora punitivo, o reset ao errar:
- Cria tensao e risco/recompensa
- Incentiva estrategia (memorizar posicoes, usar Scanner)
- Evita completar quests muito facilmente

**Alternativa considerada:** Permitir "coletar" shapes fora de ordem. Descartada por ser muito facil e perder proposito estrategico.

### Por que nao Shape Shift no MVP?

O item Shape Shift pode causar confusao:
- Muda shape de pilula que jogador pode estar rastreando para quest
- Interacao complexa com Shape Scanner (revelou tipo, mudou forma)
- Pode ser adicionado depois com regras claras

### IA e Shapes

A IA NAO precisa considerar shapes para MVP:
- Continua selecionando pilulas aleatoriamente
- Shape Quests sao ignorados pela IA (simplifica)
- Futuro: IA avancada pode usar informacao de shapes reveladas
