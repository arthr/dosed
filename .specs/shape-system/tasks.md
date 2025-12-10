# Tasks: Sistema de Formas (Shape System)

## Legenda
- `[ ]` Pendente
- `[x]` Concluido
- `[~]` Em andamento

---

## Fase 1: Progressao de Shapes (Foundation)

### 1.1 Modulo de Progressao

- [x] TASK-SS-001: Criar arquivo `src/utils/shapeProgression.ts`
  - Estrutura similar a `pillProgression.ts`

- [x] TASK-SS-001B: Definir interface `ShapeRule` com unlockRound, startPct, endPct

- [x] TASK-SS-001C: Definir interface `ShapeProgressionConfig` com maxRound e rules

- [x] TASK-SS-001D: Implementar constante `SHAPE_PROGRESSION` com regras para 16 shapes:
  - Rodada 1: capsule, round (shapes basicas)
  - Rodada 2: + triangle, oval
  - Rodada 3: + cross, heart
  - Rodada 4: + flower, star
  - Rodada 5: + pumpkin, coin
  - Rodada 6: + bear, gem
  - Rodada 7: + skull, domino
  - Rodada 8+: + pineapple, fruit (todas 16 disponiveis)
  - **Nota:** Algumas shapes podem estar desabilitadas (pct: 0) para liberacao em fases futuras

- [x] TASK-SS-001E: Implementar funcao `getShapeChances(round, config?)`
  - Calcula probabilidades normalizadas por rodada
  - Usa interpolacao linear (lerp)

- [x] TASK-SS-001F: Implementar funcao `rollShape(round, config?)`
  - Sorteia shape baseada nas chances da rodada

- [x] TASK-SS-001G: Implementar funcao `distributeShapes(count, round, config?)`
  - Distribui shapes proporcionalmente (mesmo algoritmo de distributePillTypes)

### 1.2 Integracao com pillGenerator

- [x] TASK-SS-002: Criar funcao `countPillShapes(pills)` em shapeProgression.ts
  - Retorna `Record<PillShape, number>`

- [x] TASK-SS-003: Modificar `generatePillPool()` para usar `distributeShapes()`
  - Distribuir shapes proporcionalmente baseado na rodada
  - Atribuir shapes aleatoriamente as pilulas (embaralhar)

- [x] TASK-SS-003B: Criar funcao `createPillWithShape(type, shape, config)`
  - Cria pilula com shape especifica (nao aleatoria)

- [x] TASK-SS-004: Depreciar constante `PILL_SHAPES` em `src/utils/constants.ts`
  - Adicionar comentario @deprecated
  - Manter para retrocompatibilidade temporaria

### 1.2 Estado Global

- [x] TASK-SS-005: Adicionar `shapeCounts: Record<PillShape, number>` ao `GameState` em `src/types/game.ts`

- [x] TASK-SS-006: Adicionar `shapeCounts` ao `initialState` em `src/stores/gameStore.ts`
  - Inicializar com zeros para cada shape

- [x] TASK-SS-007: Atualizar `initGame()` para calcular `shapeCounts` com `countPillShapes()`

- [x] TASK-SS-008: Atualizar `confirmItemSelection()` para calcular `shapeCounts`

- [x] TASK-SS-009: Atualizar `resetRound()` para recalcular `shapeCounts`

- [x] TASK-SS-010: Atualizar `consumePill()` para decrementar `shapeCounts`

- [x] TASK-SS-011: Atualizar itens que removem pilulas (Discard) para decrementar `shapeCounts`

---

## Fase 2: Renderizacao Visual de Shapes

### 2.1 Constantes de Estilo

- [x] TASK-SS-012: Criar `SHAPE_CLASSES: Record<PillShape, string>` em `src/utils/constants.ts`
  - Classes CSS para todas 16 shapes (aspect ratios, border-radius)
  - Usado como fallback se imagem PNG nao carregar

- [x] TASK-SS-013: Criar `SHAPE_CLIP_PATHS: Record<PillShape, string | null>` em `src/utils/constants.ts`
  - Clip-paths CSS para shapes complexas (triangle, cross, gem)
  - null para shapes que usam apenas border-radius

- [x] TASK-SS-013B: Criar `SHAPE_IMAGES: Record<PillShape, string>` em `src/utils/constants.ts`
  - Mapeamento de shapes para imagens PNG (16 shapes)
  - Arquivos em `src/assets/shapes/shape_*.png`

- [x] TASK-SS-014: Criar `SHAPE_LABELS: Record<PillShape, string>` em `src/utils/constants.ts`

### 2.2 Componente Pill

- [x] TASK-SS-015: Refatorar `Pill.tsx` para usar shape da pilula
  - Importar SHAPE_CLASSES e SHAPE_CLIP_PATHS
  - Aplicar classes e style.clipPath baseado em pill.visuals.shape
  - Ajustar sizeClasses para funcionar com aspect ratios variados

- [x] TASK-SS-016: Testar animacoes (hover, tap, pulse) com todas shapes ativas

- [x] TASK-SS-017: Verificar posicionamento de badges (inverted, doubled) em todas shapes

- [x] TASK-SS-018: Testar cores sobre todas shapes (pilula oculta e revelada)

### 2.3 Componente ShapeIcon

- [x] TASK-SS-019: Criar componente `ShapeIcon.tsx` em `src/components/game/`
  - Props: shape, size (sm/md/lg), className, color
  - Renderiza forma isolada (para uso em quest display e seletores)

---

## Fase 3: Tipos e Estrutura de Quests

### 3.1 Definicao de Tipos

- [x] TASK-SS-020: Criar arquivo `src/types/quest.ts`
  - ShapeQuest interface
  - QuestConfig interface

- [x] TASK-SS-021: Exportar novos tipos em `src/types/index.ts`

### 3.2 Alteracoes no GameState

- [x] TASK-SS-022: Adicionar `shapeQuests: Record<PlayerId, ShapeQuest | null>` ao `GameState`

- [x] TASK-SS-024: Atualizar `initialState` com `shapeQuests`

### 3.3 Pill Store - Novos Tipos

- [x] TASK-SS-024B: Criar arquivo `src/types/store.ts`
  - BoostType tipo
  - StoreItemType tipo
  - StoreItem interface
  - StoreState interface (apenas fase shopping)
  - StoreTimerConfig interface
  - StoreConfig interface

- [x] TASK-SS-024C: Exportar novos tipos de store em `src/types/index.ts`

- [x] TASK-SS-024D: Adicionar `pillCoins: number` e `wantsStore: boolean` ao `Player` em `src/types/player.ts`

- [x] TASK-SS-024E: Adicionar `storeState: StoreState | null` ao `GameState`

- [x] TASK-SS-024F: Adicionar phase `'shopping'` ao tipo `GamePhase`

---

## Fase 4: Sistema de Shape Quests

### 4.1 Gerador de Quests

- [x] TASK-SS-025: Criar arquivo `src/utils/questGenerator.ts`

- [x] TASK-SS-026: Implementar constante `DEFAULT_QUEST_CONFIG` com:
  - minLength: 2
  - maxLength: 3
  - increaseLengthAfterRound: 5

- [x] TASK-SS-027: Implementar funcao `generateSequenceFromPool(length, shapeCounts)` 
  - Gera sequencia APENAS com shapes disponiveis no pool
  - Respeita quantidade de cada shape (nao pede mais do que existe)

- [x] TASK-SS-029: Implementar funcao `generateShapeQuest(round, shapeCounts, config?)`
  - Recebe shapeCounts para gerar quest realizavel
  - Limita tamanho da sequencia ao total de pilulas no pool
  - NAO gera reward - ao completar, jogador recebe +1 Pill Coin

- [x] TASK-SS-030: Implementar funcao `checkQuestProgress(quest, consumedShape)` 
  - Retorna { updatedQuest, justCompleted }
  - Ao completar: marca completed = true (NAO gera novo quest)
  - Se justCompleted = true, caller deve dar +1 Pill Coin

### 4.2 Integracao com GameStore

- [x] TASK-SS-031: Atualizar `initGame()` para gerar quests iniciais
  - Passar shapeCounts para generateShapeQuest()
  - Gerar quest para ambos jogadores
  - Inicializar pillCoins = 0 para ambos

- [x] TASK-SS-032: Atualizar `confirmItemSelection()` para gerar quests iniciais
  - Passar shapeCounts para generateShapeQuest()

- [x] TASK-SS-033: Atualizar `resetRound()` para gerar novos quests
  - Calcular novo shapeCounts do novo pool
  - Passar para generateShapeQuest() de ambos jogadores
  - Novo quest APENAS em nova rodada (nao ao completar)

- [x] TASK-SS-034: Atualizar `consumePill()` para:
  - Chamar `checkQuestProgress()` com shape da pilula consumida
  - Atualizar `shapeQuests[playerId]` com quest atualizado
  - Se completou: +1 Pill Coin ao jogador
  - Marcar como completed, NAO gerar novo quest

### 4.3 UI de Quest

- [x] TASK-SS-037: Criar componente `ShapeQuestDisplay.tsx` em `src/components/game/`
  - Mostra sequencia de shapes
  - Indica progresso atual
  - Mostra "+1 Pill Coin" como recompensa
  - Mostra estado "Completado - aguardando proxima rodada" quando quest.completed = true

- [x] TASK-SS-038: Integrar `ShapeQuestDisplay` no `AnimatedPlayerArea.tsx`
  - Posicionar abaixo do inventario ou em local adequado
  - Mostrar apenas quest do jogador correspondente

- [x] TASK-SS-039: Adicionar feedback visual de progresso
  - Shape completada: marca verde
  - Shape atual: highlight/ring

- [x] TASK-SS-040: Adicionar feedback de reset
  - Shake animation quando errar shape
  - Toast "Sequencia reiniciada"

- [x] TASK-SS-041: Adicionar feedback de completar
  - Animacao de celebracao
  - Toast "+1 Pill Coin!"
  - UI mostra "Aguardando proxima rodada" (nao gera novo quest)

### 4.4 UI de Pill Coins

- [x] TASK-SS-041B: Criar exibicao de Pill Coins no `AnimatedPlayerArea.tsx`
  - Icone `dosed_pill.svg` com contador discreto
  - Clicavel APENAS se `pillCoins > 0`
  - Click funciona como toggle para `wantsStore`
  - Estados visuais:
    - `pillCoins === 0`: icone opaco/cinza, cursor not-allowed
    - `pillCoins > 0`, `wantsStore === false`: icone normal, cursor pointer
    - `pillCoins > 0`, `wantsStore === true`: icone com highlight/glow
  - Tooltip contextual

- [x] TASK-SS-041C: Implementar `toggleWantsStore(playerId)` no gameStore
  - Valida `pillCoins > 0` antes de ativar
  - Se `pillCoins === 0`: mostra toast de aviso
  - Toggle `player.wantsStore`

---

## Fase 4B: Pill Store (Loja de Recompensas)

### 4B.1 Configuracao da Loja

- [x] TASK-SS-080: Criar arquivo `src/utils/storeConfig.ts`
  - DEFAULT_STORE_CONFIG com shoppingTime, reduceMultiplier
  - STORE_ITEMS array com todos itens da loja

- [x] TASK-SS-081: Definir itens do tipo Boost em STORE_ITEMS:
  - life_up (1-Up): +1 vida, custo 3, condicao vida < MAX
  - full_resistance (Reboot): resistencia MAX, custo 2, condicao resistencia < MAX
  - reveal_start (Scanner-2X): 2 pills reveladas na proxima rodada, custo 2

- [x] TASK-SS-082: Definir itens do tipo Power-Up em STORE_ITEMS:
  - power_scanner, power_shield, power_pocket_pill, power_discard
  - Custo base 2, condicao inventario nao cheio

### 4B.2 Estado e Actions da Store

- [x] TASK-SS-083: Implementar `checkAndStartShopping()` no gameStore
  - Verifica se alguem tem `wantsStore === true` E `pillCoins > 0`
  - Se sim: inicia phase = 'shopping'
  - Se nao: resetRound() direto

- [x] TASK-SS-084: Implementar `purchaseStoreItem(playerId, itemId)` no gameStore
  - Valida coins e disponibilidade
  - Deduz pillCoins
  - Se power_up: adiciona ao inventario
  - Se boost: adiciona a pendingBoosts

- [x] TASK-SS-085: Implementar `confirmStorePurchases(playerId)` no gameStore
  - Marca confirmed[playerId] = true
  - Se outro comprando e nao confirmou: reduz timer, avisa
  - Chama checkShoppingComplete()

- [x] TASK-SS-086: Implementar `checkShoppingComplete()` no gameStore
  - Verifica se todos que precisam confirmar ja confirmaram
  - Chama applyPendingBoosts() e resetRound()

- [x] TASK-SS-087: Implementar `applyPendingBoosts()` no gameStore
  - Aplica life_up, full_resistance
  - Marca flag para reveal_start na proxima rodada
  - Reseta `wantsStore = false` para ambos jogadores

- [x] TASK-SS-088: Adicionar flag `revealAtStart: number` ao GameState
  - Indica quantas pills revelar automaticamente ao iniciar rodada
  - Consumida em resetRound() apos revelar

### 4B.3 Hook de Timer

- [x] TASK-SS-089: Criar `src/hooks/useStoreTimer.ts`
  - Monitora storeState.timerStartedAt e timerDuration
  - Retorna remainingTime e formattedTime
  - Chama handleShoppingTimeout ao expirar (apenas shopping)

### 4B.4 UI da Pill Store

- [x] TASK-SS-090: Criar componente `PillStore.tsx`
  - Header com timer e Pill Coins do jogador
  - Aviso se oponente confirmou (tempo reduzido)
  - Grid de StoreItemCard
  - Botao [CONFIRMAR]

- [x] TASK-SS-091: Criar componente `StoreItemCard.tsx`
  - Icone, nome, descricao, custo
  - Estado: disponivel, indisponivel (cinza), nao pode comprar (coins insuficientes)
  - onClick para comprar

- [x] TASK-SS-092: Criar componente `WaitingForOpponent.tsx`
  - Exibido para quem NAO sinalizou `wantsStore` na fase shopping
  - "Aguardando oponente fazer compras..."
  - Timer visual

- [x] TASK-SS-093: Integrar overlays no `Game.tsx` ou `GameBoard.tsx`
  - Renderizar PillStore ou WaitingForOpponent em phase 'shopping'
  - PillStore para quem tem `wantsStore === true`
  - WaitingForOpponent para quem tem `wantsStore === false`

### 4B.5 Fluxo de Fim de Rodada

- [x] TASK-SS-094: Modificar `endRound()` ou logica equivalente
  - Ao pool esvaziar: verificar se Game Over
  - Se nao Game Over: chamar `checkAndStartShopping()`
  - checkAndStartShopping verifica wantsStore e decide:
    - Alguem quer ir E tem coins -> phase = 'shopping'
    - Ninguem quer -> resetRound() direto

---

## Fase 5: Itens de Shape

> **NOTA DE SIMPLIFICACAO:** Os itens de shape (Shape Bomb, Shape Scanner) reutilizam
> o sistema de selecao de pill existente (targetType: 'pill'). O jogador seleciona
> uma pill e o efeito e aplicado a TODAS pills com a mesma shape. Isso segue DRY/KISS/YAGNI.

### 5.1 Definicao de Itens

- [x] TASK-SS-042: Adicionar `SHAPE_BOMB` e `SHAPE_SCANNER` ao tipo `ItemType` em `src/types/item.ts`

- [x] TASK-SS-044: Adicionar definicoes de `SHAPE_BOMB` e `SHAPE_SCANNER` em `src/utils/itemCatalog.ts`
  - SHAPE_BOMB: categoria chaos, targetType: pill (extrai shape da pill selecionada)
  - SHAPE_SCANNER: categoria intel, targetType: pill (extrai shape da pill selecionada)

### 5.2 Logica dos Itens

- [ ] TASK-SS-048: Implementar logica de `SHAPE_BOMB` em `gameStore.executeItem()`
  - Jogador seleciona uma pill (sistema existente)
  - Extrai shape da pill selecionada
  - Remove TODAS pilulas dessa shape do pool
  - Atualiza typeCounts e shapeCounts
  - Verifica se pool esvaziou (trigger fim de rodada)

- [ ] TASK-SS-049: Implementar logica de `SHAPE_SCANNER` em `gameStore.executeItem()`
  - Jogador seleciona uma pill (sistema existente)
  - Extrai shape da pill selecionada
  - Encontra TODAS pilulas dessa shape
  - Adiciona IDs em revealedPills

- [ ] TASK-SS-051: Adicionar feedback visual/toast ao usar itens de shape
  - Atualizar `TARGET_INSTRUCTIONS` em `ItemTargetSelector.tsx`

### 5.3 IA e Itens de Shape

- [ ] TASK-SS-052: Atualizar `selectAIItemTarget()` em `aiLogic.ts` para itens de shape
  - Shape Bomb: selecionar pill da shape com mais pilulas no pool
  - Shape Scanner: selecionar pill da shape com mais pilulas nao reveladas

---

## Fase 6: Testes

### 6.1 Testes Unitarios - Progressao de Shapes

- [x] TASK-SS-053: Criar arquivo `src/utils/__tests__/shapeProgression.test.ts`

- [x] TASK-SS-054: Testar `getShapeChances()` retorna apenas shapes desbloqueadas
  - Rodada 1: apenas round e capsule (soma 100%)
  - Rodada 3: round, capsule, oval, triangle (soma 100%)
  - Rodada 8+: todas 16 shapes (conforme ativadas em SHAPE_PROGRESSION)

- [x] TASK-SS-054B: Testar `getShapeChances()` soma sempre 100%

- [x] TASK-SS-054C: Testar `rollShape()` nunca retorna shape nao desbloqueada

- [x] TASK-SS-055: Testar `countPillShapes()` contagem correta

- [x] TASK-SS-056: Testar `distributeShapes()` distribui proporcionalmente

- [x] TASK-SS-056B: Testar `generatePillPool()` usa shapes da rodada correta

### 6.2 Testes Unitarios - Quests

- [x] TASK-SS-057: Criar arquivo `src/utils/__tests__/questGenerator.test.ts`

- [x] TASK-SS-058: Testar `generateShapeQuest()` tamanho por rodada

- [x] TASK-SS-059: Testar `generateShapeQuest()` reward valido

- [x] TASK-SS-060: Testar `checkQuestProgress()` avanca com shape correta

- [x] TASK-SS-061: Testar `checkQuestProgress()` reseta com shape errada

- [x] TASK-SS-062: Testar `checkQuestProgress()` completa quest (marca completed, NAO gera novo)

- [x] TASK-SS-062B: Testar `generateShapeQuest()` usa apenas shapes disponiveis no pool

- [x] TASK-SS-062C: Testar `generateShapeQuest()` limita sequencia ao tamanho do pool

### 6.3 Testes de Integracao

- [ ] TASK-SS-063: Verificar geracao de pilulas com shapes aleatorias

- [ ] TASK-SS-064: Verificar shapeCounts atualizado corretamente

- [ ] TASK-SS-065: Verificar quest progress ao consumir pilulas

- [ ] TASK-SS-066: Verificar aplicacao de recompensas

- [ ] TASK-SS-067: Verificar Shape Bomb remove pilulas corretamente

- [ ] TASK-SS-068: Verificar Shape Scanner revela pilulas corretamente

### 6.4 Validacao Manual

- [ ] TASK-SS-069: Jogar partida completa testando:
  - Shapes visiveis em pilulas ocultas
  - Quest progress visual
  - Reset de quest ao errar
  - Recompensas aplicadas corretamente
  - Shape Bomb e Shape Scanner funcionais

- [ ] TASK-SS-070: Testar em diferentes tamanhos de tela (mobile, desktop)

- [ ] TASK-SS-071: Verificar IA funciona normalmente (ignora shapes)

---

## Fase 7: Polish e Ajustes

### 7.1 UI/UX

- [ ] TASK-SS-072: Ajustar visual de shapes para melhor distincao
  - Bordas, sombras se necessario
  - Cores de contraste

- [ ] TASK-SS-073: Criar ShapeCounter.tsx (opcional)
  - Similar a TypeCounter
  - Toggle para mostrar/ocultar

- [ ] TASK-SS-074: Ajustar posicionamento de ShapeQuestDisplay se necessario

### 7.2 Balanceamento

- [ ] TASK-SS-075: Testar balanceamento da Pill Store
  - Ajustar custos de itens se necessario
  - Verificar frequencia de obtencao de Pill Coins

- [ ] TASK-SS-076: Testar balanceamento de itens de shape
  - Shape Bomb muito forte? Limitar quantidade no inventario
  - Shape Scanner muito fraco? Aumentar utilidade

### 7.3 Documentacao

- [ ] TASK-SS-077: Atualizar `docs/GAME-IDEA.md` com mecanicas de shape

- [ ] TASK-SS-078: Atualizar `product.md` com status da feature

---

## Resumo de Arquivos

### Novos Arquivos
| Arquivo | Descricao |
|---------|-----------|
| `src/utils/shapeProgression.ts` | Progressao de shapes (similar a pillProgression) |
| `src/types/quest.ts` | Tipos de ShapeQuest |
| `src/types/store.ts` | Tipos de Pill Store (StoreState, StoreItem, etc) |
| `src/utils/questGenerator.ts` | Geracao e logica de quests |
| `src/utils/storeConfig.ts` | Configuracao da Pill Store |
| `src/hooks/useStoreTimer.ts` | Hook para timer da loja |
| `src/components/game/ShapeIcon.tsx` | Icone de shape isolado |
| `src/components/game/ShapeQuestDisplay.tsx` | UI do objetivo atual |
| `src/components/game/ShapeCounter.tsx` | Contagem de shapes (opcional) |
| `src/components/game/PillStore.tsx` | UI da loja de compras |
| `src/components/game/StoreItemCard.tsx` | Card de item na loja |
| `src/components/game/WaitingForOpponent.tsx` | Tela de espera |
| `src/utils/__tests__/shapeProgression.test.ts` | Testes de progressao de shapes |
| `src/utils/__tests__/questGenerator.test.ts` | Testes de quests |

### Arquivos Modificados
| Arquivo | Mudancas |
|---------|----------|
| `src/types/pill.ts` | (ja tem PillShape, sem mudancas) |
| `src/types/game.ts` | shapeCounts, shapeQuests, storeState, novas phases |
| `src/types/player.ts` | pillCoins, wantsStore |
| `src/types/item.ts` | shape_bomb, shape_scanner |
| `src/types/index.ts` | Exportar novos tipos |
| `src/utils/constants.ts` | SHAPE_CLASSES, SHAPE_CLIP_PATHS, SHAPE_LABELS |
| `src/utils/pillGenerator.ts` | generatePillPool() usa shapeProgression, createPillWithShape() |
| `src/utils/itemCatalog.ts` | Novos itens (shape_bomb, shape_scanner com targetType: pill) |
| `src/utils/aiLogic.ts` | selectAIItemTarget para shape items (seleciona pill da shape desejada) |
| `src/stores/gameStore.ts` | Estado, quests, pillCoins, store actions, logica shape items |
| `src/components/game/Pill.tsx` | Renderizacao de shapes |
| `src/components/game/AnimatedPlayerArea.tsx` | ShapeQuestDisplay, Pill Coins |
| `src/components/game/Game.tsx` | Renderizar overlays da loja |
| `src/components/game/ItemTargetSelector.tsx` | Instrucoes para shape items |

---

## Ordem de Execucao Recomendada

```
Fase 1 (Shapes Aleatorias) - Foundation
     |
     v
Fase 2 (Renderizacao Visual) - UI de shapes
     |
     v
Fase 3 (Tipos de Quest) - Estrutura
     |
     v
Fase 4 (Sistema de Quests) - Core da feature
     |
     v
Fase 4B (Pill Store) - Loja de recompensas
     |
     v
Fase 5 (Itens de Shape) - Expansao
     |
     v
Fase 6 (Testes) - Validacao
     |
     v
Fase 7 (Polish) - Refinamento
```

**Dependencias:**
- Fase 2 depende de Fase 1 (shapes devem existir para renderizar)
- Fase 4 depende de Fase 3 (tipos devem existir)
- Fase 4B depende de Fase 4 (Pill Coins vem de quests)
- Fase 5 depende de Fase 2 e 4B (ShapeSelector usa ShapeIcon, itens na loja)
- Fase 6 e 7 podem ser paralelas apos Fase 5

---

## Estimativas

| Fase | Complexidade | Tempo Estimado |
|------|--------------|----------------|
| Fase 1 | Baixa | 1h |
| Fase 2 | Media | 2h |
| Fase 3 | Baixa | 30min |
| Fase 4 | Alta | 2h 30min |
| Fase 4B | Alta | 3h 30min |
| Fase 5 | Media | 2h |
| Fase 6 | Media | 1h 30min |
| Fase 7 | Baixa | 1h |
| **Total** | - | **~14h** |

---

## Notas de Implementacao

### Ordem e Progressao das Shapes (16 Shapes)

A ordem de desbloqueio das shapes e:
```typescript
// Rodada 1: formas basicas
capsule, round

// Rodada 2: + formas intermediarias
triangle, oval

// Rodada 3: + formas simbolicas
cross, heart

// Rodada 4: + formas tematicas
flower, star

// Rodada 5: + formas festivas
pumpkin, coin

// Rodada 6: + formas criativas
bear, gem

// Rodada 7: + formas avancadas
skull, domino

// Rodada 8+: + formas finais
pineapple, fruit
```

Tabela de desbloqueio rapida:
| Rodada | Novas Shapes | Total |
|--------|--------------|-------|
| 1 | capsule, round | 2 |
| 2 | triangle, oval | 4 |
| 3 | cross, heart | 6 |
| 4 | flower, star | 8 |
| 5 | pumpkin, coin | 10 |
| 6 | bear, gem | 12 |
| 7 | skull, domino | 14 |
| 8+ | pineapple, fruit | 16 |

> **Nota:** Algumas shapes podem estar desabilitadas (startPct: 0, endPct: 0) em `SHAPE_PROGRESSION`
> para serem liberadas em fases futuras do jogo. A tabela acima representa o plano final.

Manter consistencia em todos os arquivos.

### Renderizacao via Imagens PNG

A implementacao atual usa imagens PNG em vez de CSS puro:
- Arquivos em `src/assets/shapes/shape_*.png`
- `SHAPE_IMAGES` mapeia cada PillShape para seu arquivo PNG
- `SHAPE_CLASSES` e `SHAPE_CLIP_PATHS` servem como fallback
- Componente `Pill.tsx` renderiza imagem com drop-shadow colorido baseado no tipo

### Quest Progress e Force Feed

Quando Force Feed e usado:
- A pilula e consumida pelo OPONENTE
- O progresso do quest deve ser do OPONENTE, nao de quem usou o item
- Verificar que `consumePill()` usa o playerId correto

### Geracao de Quest Baseada no Pool

A quest DEVE ser realizavel:
- `generateShapeQuest()` recebe `shapeCounts` como parametro obrigatorio
- Sequencia usa APENAS shapes presentes no pool (count > 0)
- Tamanho da sequencia limitado ao total de pilulas no pool
- Exemplo: pool { round: 2, capsule: 1 } -> max sequencia = 3

### Nova Quest Apenas em Nova Rodada

- Ao completar quest: +1 Pill Coin, marca `completed = true`
- NAO gera novo quest imediatamente
- Jogador aguarda proxima rodada para receber novo quest
- UI deve indicar "Completado - aguardando proxima rodada"
- `resetRound()` e o UNICO lugar que gera novos quests

### Itens de Shape (Shape Bomb, Shape Scanner)

**Simplificacao aplicada:** Os itens de shape reutilizam o sistema de selecao de pill existente:
- Jogador usa o item -> seleciona uma PILL (nao uma shape diretamente)
- O sistema extrai a shape da pill selecionada
- Aplica o efeito em TODAS pills dessa shape

Isso evita criar componentes desnecessarios (ShapeSelector) e segue DRY/KISS/YAGNI.

**Shape Bomb:**
- Remove TODAS pills da shape da pill selecionada
- Atualiza typeCounts e shapeCounts
- Se pool esvaziar: trigger fim de rodada (checkAndStartShopping)

**Shape Scanner:**
- Revela TODAS pills da shape da pill selecionada
- Adiciona IDs em revealedPills

### Shape Bomb e Pool Vazio

Se Shape Bomb remover todas as pilulas restantes, iniciar fluxo de fim de rodada (Pill Store). Reutilizar logica existente de Discard.

### Pill Store - Toggle Durante Rodada

**Regras do Toggle `wantsStore`:**
- Icone de Pill Coins clicavel APENAS se `pillCoins > 0`
- Click com `pillCoins === 0`: mostra toast de aviso
- Click funciona como toggle: ativa/desativa `wantsStore`
- Jogador pode mudar de ideia a qualquer momento durante a rodada
- `wantsStore` e resetado para `false` ao iniciar nova rodada

**Fim da Rodada:**
- Se alguem tem `wantsStore === true` E `pillCoins > 0`: phase = 'shopping'
- Se ninguem quer: resetRound() direto

**Fase Shopping (30s):**
- Apenas quem tem `wantsStore === true` ve a loja
- Quem tem `wantsStore === false` ve tela de espera
- Se um confirmar: avisa outro + timer reduz 50%
- Se timer expirar: confirma automatico
- Ambos confirmados -> aplica boosts + resetRound()

### Pill Store - Boosts

Boosts sao efeitos aplicados ao iniciar proxima rodada:
- `life_up`: +1 vida (max 3)
- `full_resistance`: resistencia = maxResistance
- `reveal_start`: revela N pills automaticamente no inicio

### IA e Pill Store

Para MVP, a IA:
- Pode setar `wantsStore = true` se tem coins e precisa de itens/boosts
- Compras simples: prioriza life_up se vida baixa, full_resistance se resistencia baixa
- NAO otimiza estrategicamente

### IA Ignora Quests

Para MVP, a IA:
- NAO considera shapes ao escolher pilulas
- NAO tenta completar seus quests
- PODE usar Shape Bomb/Scanner com heuristicas simples:
  - Seleciona uma PILL da shape com mais pilulas no pool
  - Para Shape Scanner: prioriza shape com mais pills nao reveladas

Futuro: IA avancada pode considerar quests e otimizar compras na loja.

