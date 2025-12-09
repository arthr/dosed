# Tasks: Sistema de Formas (Shape System)

## Legenda
- `[ ]` Pendente
- `[x]` Concluido
- `[~]` Em andamento
- `[-]` Cancelado

---

## Fase 1: Progressao de Shapes (Foundation)

### 1.1 Modulo de Progressao

- [x] TASK-SS-001: Criar arquivo `src/utils/shapeProgression.ts`
  - Estrutura similar a `pillProgression.ts`

- [x] TASK-SS-001B: Definir interface `ShapeRule` com unlockRound, startPct, endPct

- [x] TASK-SS-001C: Definir interface `ShapeProgressionConfig` com maxRound e rules

- [x] TASK-SS-001D: Implementar constante `SHAPE_PROGRESSION` com regras:
  - round: { unlockRound: 1, startPct: 50, endPct: 15 }
  - capsule: { unlockRound: 1, startPct: 50, endPct: 20 }
  - oval: { unlockRound: 2, startPct: 20, endPct: 20 }
  - triangle: { unlockRound: 3, startPct: 15, endPct: 25 }
  - hexagon: { unlockRound: 5, startPct: 10, endPct: 20 }

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

- [ ] TASK-SS-012: Criar `SHAPE_CLASSES: Record<PillShape, string>` em `src/utils/constants.ts`
  - round: 'rounded-full aspect-square'
  - capsule: 'rounded-full aspect-[1.6]'
  - oval: 'rounded-full aspect-[1.3]'
  - triangle: '' (usa clip-path)
  - hexagon: '' (usa clip-path)

- [ ] TASK-SS-013: Criar `SHAPE_CLIP_PATHS: Record<PillShape, string | null>` em `src/utils/constants.ts`
  - triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)'
  - hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'

- [ ] TASK-SS-014: Criar `SHAPE_LABELS: Record<PillShape, string>` em `src/utils/constants.ts`

### 2.2 Componente Pill

- [ ] TASK-SS-015: Refatorar `Pill.tsx` para usar shape da pilula
  - Importar SHAPE_CLASSES e SHAPE_CLIP_PATHS
  - Aplicar classes e style.clipPath baseado em pill.visuals.shape
  - Ajustar sizeClasses para funcionar com aspect ratios variados

- [ ] TASK-SS-016: Testar animacoes (hover, tap, pulse) com todas 5 shapes

- [ ] TASK-SS-017: Verificar posicionamento de badges (inverted, doubled) em todas shapes

- [ ] TASK-SS-018: Testar cores sobre todas shapes (pilula oculta e revelada)

### 2.3 Componente ShapeIcon

- [ ] TASK-SS-019: Criar componente `ShapeIcon.tsx` em `src/components/game/`
  - Props: shape, size (sm/md/lg), className, color
  - Renderiza forma isolada (para uso em quest display e seletores)

---

## Fase 3: Tipos e Estrutura de Quests

### 3.1 Definicao de Tipos

- [ ] TASK-SS-020: Criar arquivo `src/types/quest.ts`
  - QuestRewardType
  - QuestReward interface
  - ShapeQuest interface
  - QuestConfig interface

- [ ] TASK-SS-021: Exportar novos tipos em `src/types/index.ts`

### 3.2 Alteracoes no GameState

- [ ] TASK-SS-022: Adicionar `shapeQuests: Record<PlayerId, ShapeQuest | null>` ao `GameState`

- [ ] TASK-SS-023: Adicionar `skipNextTurnSwitch: boolean` ao `GameState` (para reward extra_turn)

- [ ] TASK-SS-024: Atualizar `initialState` com `shapeQuests` e `skipNextTurnSwitch`

---

## Fase 4: Sistema de Shape Quests

### 4.1 Gerador de Quests

- [ ] TASK-SS-025: Criar arquivo `src/utils/questGenerator.ts`

- [ ] TASK-SS-026: Implementar constante `DEFAULT_QUEST_CONFIG` com:
  - minLength: 2
  - maxLength: 3
  - increaseLengthAfterRound: 5
  - rewards: pool com pesos

- [ ] TASK-SS-027: Implementar funcao `generateSequenceFromPool(length, shapeCounts)` 
  - Gera sequencia APENAS com shapes disponiveis no pool
  - Respeita quantidade de cada shape (nao pede mais do que existe)

- [ ] TASK-SS-028: Implementar funcao `selectReward(config)` - selecao por peso

- [ ] TASK-SS-029: Implementar funcao `generateShapeQuest(round, shapeCounts, config?)`
  - Recebe shapeCounts para gerar quest realizavel
  - Limita tamanho da sequencia ao total de pilulas no pool

- [ ] TASK-SS-030: Implementar funcao `checkQuestProgress(quest, consumedShape)` 
  - Retorna { updatedQuest, justCompleted }
  - Ao completar: marca completed = true (NAO gera novo quest)

### 4.2 Integracao com GameStore

- [ ] TASK-SS-031: Atualizar `initGame()` para gerar quests iniciais
  - Passar shapeCounts para generateShapeQuest()
  - Gerar quest para ambos jogadores

- [ ] TASK-SS-032: Atualizar `confirmItemSelection()` para gerar quests iniciais
  - Passar shapeCounts para generateShapeQuest()

- [ ] TASK-SS-033: Atualizar `resetRound()` para gerar novos quests
  - Calcular novo shapeCounts do novo pool
  - Passar para generateShapeQuest() de ambos jogadores
  - Novo quest APENAS em nova rodada (nao ao completar)

- [ ] TASK-SS-034: Atualizar `consumePill()` para:
  - Chamar `checkQuestProgress()` com shape da pilula consumida
  - Atualizar `shapeQuests[playerId]` com quest atualizado
  - Se completou: marcar como completed, NAO gerar novo quest
  - Retornar/armazenar recompensa para aplicacao

- [ ] TASK-SS-035: Implementar aplicacao de recompensas no `consumePill()` ou action separada
  - heal: aumentar resistencia
  - resistance_max: setar resistencia = maxResistance
  - reveal_random: revelar pilula aleatoria (adicionar em revealedPills)
  - extra_turn: setar skipNextTurnSwitch = true

- [ ] TASK-SS-036: Atualizar logica de alternancia de turno para verificar `skipNextTurnSwitch`

### 4.3 UI de Quest

- [ ] TASK-SS-037: Criar componente `ShapeQuestDisplay.tsx` em `src/components/game/`
  - Mostra sequencia de shapes
  - Indica progresso atual
  - Mostra recompensa
  - Mostra estado "Completado - aguardando proxima rodada" quando quest.completed = true

- [ ] TASK-SS-038: Integrar `ShapeQuestDisplay` no `AnimatedPlayerArea.tsx`
  - Posicionar abaixo do inventario ou em local adequado
  - Mostrar apenas quest do jogador correspondente

- [ ] TASK-SS-039: Adicionar feedback visual de progresso
  - Shape completada: marca verde
  - Shape atual: highlight/ring

- [ ] TASK-SS-040: Adicionar feedback de reset
  - Shake animation quando errar shape
  - Toast "Sequencia reiniciada"

- [ ] TASK-SS-041: Adicionar feedback de completar
  - Animacao de celebracao
  - Toast com recompensa recebida
  - UI mostra "Aguardando proxima rodada" (nao gera novo quest)

---

## Fase 5: Itens de Shape

### 5.1 Definicao de Itens

- [ ] TASK-SS-042: Adicionar `SHAPE_BOMB` e `SHAPE_SCANNER` ao tipo `ItemType` em `src/types/item.ts`

- [ ] TASK-SS-043: Adicionar `'shape'` ao `targetType` em `ItemDefinition` se necessario

- [ ] TASK-SS-044: Adicionar definicoes de `SHAPE_BOMB` e `SHAPE_SCANNER` em `src/utils/itemCatalog.ts`
  - SHAPE_BOMB: categoria chaos, targetType: shape
  - SHAPE_SCANNER: categoria intel, targetType: shape

### 5.2 Componente ShapeSelector

- [ ] TASK-SS-045: Criar componente `ShapeSelector.tsx` em `src/components/game/`
  - Lista shapes disponiveis no pool (count > 0)
  - Mostra contagem de cada shape
  - Callback onSelect e onCancel

### 5.3 Logica dos Itens

- [ ] TASK-SS-046: Atualizar `TargetSelectionState` em `src/types/game.ts` para suportar targetShape

- [ ] TASK-SS-047: Atualizar `useItemUsage.ts` para detectar targetType: 'shape' e abrir ShapeSelector

- [ ] TASK-SS-048: Implementar logica de `SHAPE_BOMB` em `gameStore.executeItem()`
  - Remove todas pilulas da shape selecionada
  - Atualiza typeCounts e shapeCounts
  - Verifica se pool esvaziou

- [ ] TASK-SS-049: Implementar logica de `SHAPE_SCANNER` em `gameStore.executeItem()`
  - Encontra pilulas da shape selecionada
  - Adiciona IDs em revealedPills

- [ ] TASK-SS-050: Integrar `ShapeSelector` no `ItemTargetSelector.tsx` ou como overlay separado

- [ ] TASK-SS-051: Adicionar feedback visual/toast ao usar itens de shape

### 5.4 IA e Itens de Shape

- [ ] TASK-SS-052: Atualizar `selectAIItemTarget()` em `aiLogic.ts` para suportar targetType: shape
  - Shape Bomb: selecionar shape com mais pilulas
  - Shape Scanner: selecionar shape com mais pilulas nao reveladas

---

## Fase 6: Testes

### 6.1 Testes Unitarios - Progressao de Shapes

- [ ] TASK-SS-053: Criar arquivo `src/utils/__tests__/shapeProgression.test.ts`

- [ ] TASK-SS-054: Testar `getShapeChances()` retorna apenas shapes desbloqueadas
  - Rodada 1: apenas round e capsule (soma 100%)
  - Rodada 3: round, capsule, oval, triangle (soma 100%)
  - Rodada 5+: todas 5 shapes

- [ ] TASK-SS-054B: Testar `getShapeChances()` soma sempre 100%

- [ ] TASK-SS-054C: Testar `rollShape()` nunca retorna shape nao desbloqueada

- [ ] TASK-SS-055: Testar `countPillShapes()` contagem correta

- [ ] TASK-SS-056: Testar `distributeShapes()` distribui proporcionalmente

- [ ] TASK-SS-056B: Testar `generatePillPool()` usa shapes da rodada correta

### 6.2 Testes Unitarios - Quests

- [ ] TASK-SS-057: Criar arquivo `src/utils/__tests__/questGenerator.test.ts`

- [ ] TASK-SS-058: Testar `generateShapeQuest()` tamanho por rodada

- [ ] TASK-SS-059: Testar `generateShapeQuest()` reward valido

- [ ] TASK-SS-060: Testar `checkQuestProgress()` avanca com shape correta

- [ ] TASK-SS-061: Testar `checkQuestProgress()` reseta com shape errada

- [ ] TASK-SS-062: Testar `checkQuestProgress()` completa quest (marca completed, NAO gera novo)

- [ ] TASK-SS-062B: Testar `generateShapeQuest()` usa apenas shapes disponiveis no pool

- [ ] TASK-SS-062C: Testar `generateShapeQuest()` limita sequencia ao tamanho do pool

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

- [ ] TASK-SS-075: Testar balanceamento de recompensas de quest
  - Ajustar pesos se necessario
  - Ajustar valores (heal amount, etc)

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
| `src/types/quest.ts` | Tipos de ShapeQuest e QuestReward |
| `src/utils/questGenerator.ts` | Geracao e logica de quests |
| `src/components/game/ShapeIcon.tsx` | Icone de shape isolado |
| `src/components/game/ShapeQuestDisplay.tsx` | UI do objetivo atual |
| `src/components/game/ShapeSelector.tsx` | Selecao de shape para itens |
| `src/components/game/ShapeCounter.tsx` | Contagem de shapes (opcional) |
| `src/utils/__tests__/shapeProgression.test.ts` | Testes de progressao de shapes |
| `src/utils/__tests__/questGenerator.test.ts` | Testes de quests |

### Arquivos Modificados
| Arquivo | Mudancas |
|---------|----------|
| `src/types/pill.ts` | (ja tem PillShape, sem mudancas) |
| `src/types/game.ts` | shapeCounts, shapeQuests, skipNextTurnSwitch |
| `src/types/item.ts` | SHAPE_BOMB, SHAPE_SCANNER |
| `src/types/index.ts` | Exportar novos tipos |
| `src/utils/constants.ts` | SHAPE_CLASSES, SHAPE_CLIP_PATHS, SHAPE_LABELS |
| `src/utils/pillGenerator.ts` | generatePillPool() usa shapeProgression, createPillWithShape() |
| `src/utils/itemCatalog.ts` | Novos itens |
| `src/utils/itemLogic.ts` | Logica dos novos itens (se necessario) |
| `src/utils/aiLogic.ts` | selectAIItemTarget para shape items |
| `src/stores/gameStore.ts` | Estado, geracao de quests, progresso, recompensas |
| `src/components/game/Pill.tsx` | Renderizacao de shapes |
| `src/components/game/AnimatedPlayerArea.tsx` | Integrar ShapeQuestDisplay |
| `src/hooks/useItemUsage.ts` | Suporte a targetType: shape |

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
- Fase 5 depende de Fase 2 e 4 (ShapeSelector usa ShapeIcon, itens usam shapeCounts)
- Fase 6 e 7 podem ser paralelas apos Fase 5

---

## Estimativas

| Fase | Complexidade | Tempo Estimado |
|------|--------------|----------------|
| Fase 1 | Baixa | 1h |
| Fase 2 | Media | 2h |
| Fase 3 | Baixa | 30min |
| Fase 4 | Alta | 3h |
| Fase 5 | Media | 2h |
| Fase 6 | Media | 1h 30min |
| Fase 7 | Baixa | 1h |
| **Total** | - | **~11h** |

---

## Notas de Implementacao

### Ordem e Progressao das Shapes

A ordem de desbloqueio das shapes e:
```typescript
// Rodada 1: formas basicas
round, capsule

// Rodada 2: forma intermediaria
oval

// Rodada 3: forma angular
triangle

// Rodada 5: forma complexa
hexagon
```

Tabela de desbloqueio rapida:
| Rodada | Novas Shapes |
|--------|--------------|
| 1 | round, capsule |
| 2 | oval |
| 3 | triangle |
| 5 | hexagon |

Manter consistencia em todos os arquivos.

### Fallback para Clip-path

Se browser nao suportar clip-path, shapes complexas (triangle, hexagon) farao fallback para circulo. Isso e aceitavel para MVP.

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

- Ao completar quest: aplica recompensa, marca `completed = true`
- NAO gera novo quest imediatamente
- Jogador aguarda proxima rodada para receber novo quest
- UI deve indicar "Completado - aguardando proxima rodada"
- `resetRound()` e o UNICO lugar que gera novos quests

### Shape Bomb e Pool Vazio

Se Shape Bomb remover todas as pilulas restantes, nova rodada deve iniciar. Reutilizar logica existente de Discard.

### Extra Turn Reward

A recompensa `extra_turn`:
- Seta `skipNextTurnSwitch = true`
- Na logica de fim de turno: se flag true, nao alterna turno e reseta flag
- Funciona para humano e IA

### IA Ignora Quests

Para MVP, a IA:
- NAO considera shapes ao escolher pilulas
- NAO tenta completar seus quests
- PODE usar Shape Bomb/Scanner com heuristicas simples (shape com mais pilulas)

Futuro: IA avancada pode considerar quests.

