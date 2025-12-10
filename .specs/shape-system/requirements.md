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

#### 1.1 Sistema de Shapes Ativas e Sazonais

O jogo possui 16 shapes no total, divididas em:
- **Shapes ATIVAS:** Aparecem normalmente no jogo
- **Shapes SAZONAIS:** Desabilitadas (pct: 0), ativadas em eventos especiais

```typescript
interface ShapeRule {
  unlockRound: number  // Rodada de desbloqueio
  startPct: number     // % no desbloqueio (0 = sazonal/desabilitada)
  endPct: number       // % na rodada maxima
}

// IMPLEMENTACAO ATUAL (consulte src/utils/shapeProgression.ts)
const SHAPE_PROGRESSION: Record<PillShape, ShapeRule> = {
  // Shapes ATIVAS
  round:    { unlockRound: 1, startPct: 45, endPct: 4 },
  flower:   { unlockRound: 1, startPct: 18, endPct: 8 },
  fruit:    { unlockRound: 1, startPct: 50, endPct: 4 },
  pumpkin:  { unlockRound: 3, startPct: 45, endPct: 7 },
  skull:    { unlockRound: 3, startPct: 15, endPct: 20 },
  bear:     { unlockRound: 5, startPct: 45, endPct: 9 },
  // Shapes SAZONAIS (desabilitadas)
  capsule:  { unlockRound: 1, startPct: 0, endPct: 0 },
  triangle: { unlockRound: 1, startPct: 0, endPct: 0 },
  // ... demais shapes sazonais
}
```

#### 1.2 Tabela de Desbloqueio (Shapes ATIVAS)

| Rodada | Shapes Ativas | Total |
| :--- | :--- | :--- |
| 1 | round, flower, fruit | 3 |
| 3 | + pumpkin, skull | 5 |
| 5 | + bear | 6 |

**Shapes Sazonais (desabilitadas):**
capsule, triangle, oval, cross, heart, star, coin, gem, domino, pineapple

> **Nota:** Shapes sazonais podem ser ativadas em eventos especiais (Halloween, Natal, etc)
> ajustando startPct/endPct em SHAPE_PROGRESSION.

#### 1.3 Exemplo de Distribuicao por Rodada (Shapes Ativas)

| Rodada | round | flower | fruit | pumpkin | skull | bear |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 40% | 16% | 44% | 0% | 0% | 0% |
| 3 | 30% | 12% | 33% | 17% | 8% | 0% |
| 5 | 25% | 10% | 28% | 15% | 12% | 10% |

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

**EARS:** O sistema DEVE atribuir objetivos de sequencia de shapes a cada jogador, concedendo **Pill Coins** ao completar.

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
}
```

> **Nota:** Ao completar quest, jogador recebe +1 Pill Coin (moeda acumulavel para usar na Pill Store).

#### 4.2 Pill Coins

| Propriedade | Valor |
| :--- | :--- |
| **Obtencao** | +1 ao completar Shape Quest |
| **Acumulo** | Jogador pode acumular multiplas coins |
| **Uso** | Gastar na Pill Store entre rodadas |
| **Visual** | Icone `dosed_pill.svg` com contador |

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
- [ ] Ao completar: +1 Pill Coin, quest marcado como completed (nao gera novo)
- [ ] Novo quest so e gerado na proxima rodada
- [ ] UI exibe objetivo atual e progresso (abaixo do inventario ou proximo)
- [ ] UI indica quando quest foi completado (aguardando proxima rodada)
- [ ] UI exibe Pill Coins do jogador no AnimatedPlayerArea

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
      player.pillCoins++ // +1 Pill Coin
      // NAO gera novo quest - jogador aguarda proxima rodada
    }
  } else {
    quest.progress = 0 // Reset
  }
}
```

---

### RF-005: Pill Store (Loja de Recompensas)

**EARS:** O sistema DEVE permitir que jogadores gastem Pill Coins em uma loja entre rodadas para adquirir Power-Ups e Boosts.

#### 5.1 Fluxo da Pill Store

```
[Durante rodada: toggle wantsStore] -> [Pool esvazia] -> [Shopping?] -> [Nova Rodada]
```

**Fluxo Simplificado:**
1. Durante a rodada, jogador pode clicar no icone de Pill Coins para sinalizar que quer visitar a loja
2. Ao pool esvaziar, se pelo menos 1 jogador sinalizou (e tem coins), inicia fase shopping
3. Se ninguem sinalizou, proxima rodada inicia direto

#### 5.2 Toggle "Quero Visitar Loja"

**Regras:**
- Icone de Pill Coins e clicavel APENAS se `pillCoins > 0`
- Click funciona como toggle (ativa/desativa `wantsStore`)
- Jogador pode mudar de ideia a qualquer momento durante a rodada
- Estado `wantsStore` e resetado para `false` ao iniciar nova rodada

**Comportamento do Click:**

| Condicao | Acao |
| :--- | :--- |
| `pillCoins === 0` | Toast: "Sem Pill Coins! Complete quests para obter." |
| `pillCoins > 0` e `wantsStore === false` | Ativa toggle, feedback visual (highlight) |
| `pillCoins > 0` e `wantsStore === true` | Desativa toggle |

**Estados Visuais do Icone:**

| Estado | Visual |
| :--- | :--- |
| `pillCoins === 0` | Icone opaco/cinza, cursor not-allowed |
| `pillCoins > 0`, `wantsStore === false` | Icone normal, cursor pointer |
| `pillCoins > 0`, `wantsStore === true` | Icone com highlight/glow/badge |

#### 5.3 Fase Shopping (Compras)

**Condicao de Entrada:**
- Pool esvaziou E nao e Game Over
- Pelo menos 1 jogador tem `wantsStore === true` E `pillCoins > 0`

**Regras:**
- Timer: 30 segundos (configuravel)
- Jogador que sinalizou: ve a Pill Store
- Jogador que nao sinalizou: ve "Aguardando oponente..."
- Se um confirmar: avisa outro + timer reduz 50%
- Se timer expirar: confirma automatico (compras feitas ate entao)
- Ambos confirmam: aplica boosts + inicia nova rodada

#### 5.3.1 Sistema de Carrinho de Compras

> **ATUALIZADO:** Implementado sistema de carrinho para evitar compras acidentais.

**Fluxo de Compras:**
1. Jogador clica em itens para adicionar ao carrinho (NAO debita coins)
2. Carrinho exibe resumo com total a ser gasto
3. Jogador pode remover itens do carrinho a qualquer momento
4. Ao clicar "Confirmar Compras", carrinho e processado:
   - Coins sao debitados
   - Itens sao adicionados ao inventario ou pendingBoosts
5. Jogador pode confirmar sem itens no carrinho (sem compras)

**UI do Carrinho:**
- Header mostra coins disponiveis (total - carrinho)
- Badge nos itens mostra quantidade no carrinho (Nx)
- Resumo do carrinho com lista de itens e total
- Botao "Confirmar Compras (-X)" ou "Confirmar (Sem Compras)"

**Validacoes:**
- Nao permite adicionar se coins disponiveis (apos carrinho) < custo
- Nao permite adicionar se item indisponivel (inventario cheio, etc)
- Considera itens do carrinho ao validar disponibilidade

#### 5.4 Itens da Loja

**Tipos de Itens:**

| Tipo | Descricao |
| :--- | :--- |
| `power_up` | Adiciona item ao inventario |
| `boost` | Efeito de ativacao imediata |

**Boosts Disponiveis:**

| ID | Nome | Descricao | Custo | Condicao |
| :--- | :--- | :--- | :--- | :--- |
| `life_up` | 1-Up | +1 vida | 3 | Vida < MAX |
| `full_resistance` | Reboot | Resistencia = MAX | 2 | Resistencia < MAX |
| `reveal_start` | Scanner-2X | Proxima rodada inicia com 2 pills reveladas | 2 | - |

**Power-Ups Disponiveis:**

Power-Ups sao itens existentes do `ITEM_CATALOG` que o jogador pode "reabastecer" na loja.
Itens disponiveis inicialmente:

| ID | Nome | ItemType | Custo |
| :--- | :--- | :--- | :--- |
| `power_scanner` | Scanner | `scanner` | 2 |
| `power_shield` | Shield | `shield` | 2 |
| `power_pocket_pill` | Pocket Pill | `pocket_pill` | 2 |
| `power_discard` | Discard | `discard` | 2 |

- Custo base: 2 Pill Coins
- Condicao: Inventario nao cheio (`inventory.items.length < MAX_INVENTORY_ITEMS`)

> **Nota:** Novos power-ups podem ser adicionados conforme o `ITEM_CATALOG` expandir ou
> conforme balanceamento do jogo indicar necessidade.

#### 5.5 Configuracao da Loja

```typescript
interface StoreConfig {
  items: StoreItem[]
  powerUpBaseCost: number
  shoppingTime: number  // 30000ms
  reduceMultiplier: number  // 0.5
}
```

**Criterios de Aceitacao:**
- [x] Icone de Pill Coins clicavel apenas se `pillCoins > 0`
- [x] Toast de aviso ao clicar sem coins
- [x] Toggle `wantsStore` funciona durante toda a rodada
- [x] Feedback visual quando `wantsStore === true` (highlight no icone)
- [x] `wantsStore` resetado ao iniciar nova rodada
- [x] Pill Store nao exibida se Game Over
- [x] Pill Store abre se pelo menos 1 jogador sinalizou com coins
- [x] Loja exibida apenas para quem sinalizou
- [x] Tela "Aguardando" para quem nao sinalizou
- [x] Timer de 30s na fase shopping
- [x] Timer reduz 50% quando um jogador confirma
- [x] Compras deduzem Pill Coins (via sistema de carrinho)
- [x] Power-Ups adicionados ao inventario
- [x] Boosts aplicados ao iniciar proxima rodada
- [x] Itens indisponiveis (inventario cheio, vida MAX) desabilitados
- [x] Sistema de carrinho: adicionar/remover itens sem debitar coins
- [x] Carrinho: resumo com total antes de confirmar
- [x] Carrinho: coins debitados apenas ao confirmar

---

### RF-006: Itens Baseados em Shape

**EARS:** O sistema DEVE suportar novos itens que interagem com shapes.

#### 6.1 Shape Bomb

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

#### 6.2 Shape Scanner

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

#### 6.3 Shape Shift (Futuro/Opcional)

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
export interface ShapeQuest {
  id: string
  sequence: PillShape[]
  progress: number
  completed: boolean
}
// Nota: Ao completar quest, jogador recebe +1 Pill Coin

// src/types/store.ts (novo arquivo)
export type BoostType = 'life_up' | 'full_resistance' | 'reveal_start'
export type StoreItemType = 'power_up' | 'boost'

export interface StoreItem {
  id: string
  type: StoreItemType
  name: string
  cost: number
  // ...
}

export interface StoreState {
  confirmed: Record<PlayerId, boolean>
  timerStartedAt: number | null
  timerDuration: number
  pendingBoosts: Record<PlayerId, BoostType[]>
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
- `src/types/quest.ts` - Tipos de ShapeQuest e QuestConfig
- `src/types/store.ts` - Tipos da Pill Store (StoreState, StoreItem, etc)
- `src/utils/questGenerator.ts` - Geracao e logica de quests
- `src/utils/storeConfig.ts` - Configuracao da Pill Store
- `src/hooks/useStoreTimer.ts` - Hook para timer da loja
- `src/components/game/ShapeIcon.tsx` - Icone de shape isolado
- `src/components/game/ShapeQuestDisplay.tsx` - UI do objetivo
- `src/components/game/ShapeSelector.tsx` - Selecao de shape para itens
- `src/components/game/PillStore.tsx` - UI da loja
- `src/components/game/StoreItemCard.tsx` - Card de item na loja
- `src/components/game/WaitingForOpponent.tsx` - Tela de espera

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
