# Tasks: Refatoracao da AI Logic + Sistema de Dificuldade

## Sumario de Progresso

| Area | Total | Concluidas | Pendentes |
| :--- | :---: | :---: | :---: |
| Types | 5 | 5 | 0 |
| Config | 3 | 0 | 3 |
| AI Logic - Analise | 4 | 0 | 4 |
| AI Logic - Selecao | 4 | 0 | 4 |
| AI Logic - Itens | 4 | 0 | 4 |
| AI Logic - Pre-jogo/Loja | 4 | 0 | 4 |
| Store | 3 | 0 | 3 |
| Hooks | 4 | 0 | 4 |
| Components | 3 | 0 | 3 |
| Integration | 3 | 0 | 3 |
| **TOTAL** | **37** | **5** | **32** |

---

## Fase 1: Types e Configuracao

### Types

- [x] TASK-001: Criar type `DifficultyLevel` em `types/game.ts`
  ```typescript
  export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'insane'
  ```

- [x] TASK-002: Criar arquivo `types/ai.ts` com interfaces da IA
  - `AIConfig` - parametros de comportamento (incluindo `usesTypeCounts`, `usesDeduction`)
  - `AIDecisionContext` - contexto para decisoes (incluindo `typeCounts`, `shapeCounts`)
  - `ItemEvaluation` - resultado de avaliacao
  - `PoolRiskLevel` - enum de niveis de risco
  - `PoolRiskAnalysis` - analise completa de risco

- [x] TASK-003: Atualizar `GameConfig` em `types/game.ts`
  - Adicionar campo `difficulty: DifficultyLevel`
  - Adicionar `DIFFICULTY_LABELS` e `DIFFICULTY_DESCRIPTIONS`

- [x] TASK-004: Atualizar barrel export em `types/index.ts`
  - Exportar novos types de `ai.ts`
  - Exportar `DifficultyLevel` e constantes

- [x] TASK-004B: Documentar uso de `typeCounts` e `shapeCounts` em `ai.ts`
  - JSDoc explicando que sao informacoes publicas
  - Exemplos de uso para calculo de probabilidades

### Config

- [ ] TASK-005: Criar arquivo `utils/aiConfig.ts`
  - `AI_CONFIGS: Record<DifficultyLevel, AIConfig>`
  - Incluir novos campos: `usesTypeCounts`, `usesDeduction`
  - Valores conforme tabela de requisitos atualizada

- [ ] TASK-006: Implementar `getAIConfig(difficulty)` em `aiConfig.ts`
  - Retorna configuracao para nivel especificado

- [ ] TASK-007: Implementar `getAIThinkingDelay(difficulty)` em `aiConfig.ts`
  - Calcula delay aleatorio baseado nos limites do nivel

---

## Fase 2: Refatoracao da AI Logic - Analise de Risco

### Funcoes de Analise (NOVO - usa typeCounts)

- [ ] TASK-008: Implementar `calculateTypeOdds(ctx)` em `aiLogic.ts`
  - Usa `typeCounts` (publico) - tipos revelados = probabilidades reais
  - Retorna `Record<PillType, number>` com % de cada tipo no pool nao-revelado
  - Considera pilulas ja reveladas pelo Scanner

- [ ] TASK-009: Implementar `analyzePoolRisk(ctx)` em `aiLogic.ts`
  - Calcula nivel de risco (CRITICO, ALTO, MEDIO, BAIXO)
  - Usa `calculateTypeOdds()` internamente
  - Retorna `PoolRiskAnalysis` com odds, damageOdds, safeOdds, recomendacao

- [ ] TASK-010: Implementar `deduceNonRevealedTypes(ctx)` em `aiLogic.ts`
  - Logica de deducao: se todas FATAL reveladas, outras NAO sao FATAL
  - Retorna `Map<pillId, PillType[]>` com tipos possiveis por pilula
  - Usado apenas por nivel Insane (`config.usesDeduction`)

- [ ] TASK-011: Implementar `calculatePoolRisk(typeCounts, poolSize)` (helper)
  - Versao simplificada para uso rapido
  - Retorna apenas `PoolRiskLevel`

---

## Fase 3: Refatoracao da AI Logic - Selecao de Pilulas

### Selecao de Pilulas

- [ ] TASK-012: Refatorar `selectRandomPill()` em `aiLogic.ts`
  - Manter comportamento atual (usado por Easy)
  - Melhorar documentacao

- [ ] TASK-013: Implementar `selectSmartPill(ctx)` em `aiLogic.ts`
  - Considera pilulas reveladas + typeCounts + deducao
  - Prioriza: quest -> seguras reveladas -> deduzidas seguras -> risco baixo -> evitar perigosas
  - Usado por Hard/Insane

- [ ] TASK-014: Implementar `selectAIPill(ctx)` em `aiLogic.ts`
  - Funcao principal de selecao
  - Easy: aleatorio puro
  - Normal: aleatorio (typeCounts usado so para itens)
  - Hard/Insane: selectSmartPill

- [ ] TASK-015: Implementar funcoes auxiliares de pilulas
  - `getRevealedPillsInfo()` - mapeia pilulas reveladas com tipos
  - `findSafePill()` - encontra pilula SAFE revelada
  - `findHealPill()` - encontra pilula HEAL revelada
  - `findUnknownPill()` - encontra pilula nao revelada
  - `findQuestPill()` - encontra pilula do quest

---

## Fase 4: Refatoracao da AI Logic - Uso de Itens

### Uso de Itens (Atualizado com Analise de Risco)

- [ ] TASK-016: Refatorar `shouldAIUseItem()` para usar AIConfig + risco
  - Recebe contexto completo
  - Usa `config.itemUseChance`
  - Bonus de chance se risco CRITICO/ALTO e tem item defensivo

- [ ] TASK-017: Implementar `evaluateItem(item, ctx)` em `aiLogic.ts`
  - Usa `analyzePoolRisk()` para decisoes contextuais
  - Shield: bonus MAXIMO em risco critico
  - Force Feed: bonus se FATAL odds > 20%
  - Handcuffs: bonus em risco critico (forca oponente)
  - Discard: bonus se FATAL presente
  - Retorna `ItemEvaluation`

- [ ] TASK-018: Refatorar `selectAIItem()` para usar contexto completo
  - Recebe `AIDecisionContext`
  - Chama `evaluateItem()` para cada item
  - Ordena por score, retorna melhor

- [ ] TASK-019: Implementar `selectAIItemTarget()` atualizado
  - Recebe contexto completo
  - Logica mais inteligente: prioriza pilulas deduzidas perigosas para Force Feed
  - Usa deducao para Inverter/Double em nivel Insane

---

## Fase 5: Selecao Pre-Jogo e Loja

### Selecao de Itens Iniciais

- [ ] TASK-020: Implementar `selectAIInitialItems(difficulty, available)`
  - Easy: aleatorio
  - Normal: variedade (1 por categoria se possivel)
  - Hard: ofensivos (Force Feed, Handcuffs, etc)
  - Insane: otimizado (2 Intel, 2 Sustain, 1 Control)

- [ ] TASK-021: Implementar funcoes auxiliares de selecao
  - `selectVariedItems()` - 1 por categoria
  - `selectOffensiveItems()` - prioriza controle/chaos
  - `selectOptimalItems()` - composicao balanceada

### Comportamento na Loja

- [ ] TASK-022: Implementar `shouldAIWantStore(difficulty, coins)`
  - Usa `storeInterestThreshold` do config
  - Easy nunca quer, outros conforme threshold

- [ ] TASK-023: Implementar `selectAIStoreItems(ctx, coins, items)`
  - Logica de priorizacao de compras
  - Considera estado atual (vidas, inventario)
  - Usa analise de risco para priorizar itens defensivos

---

## Fase 6: Alteracoes no Store

- [ ] TASK-024: Adicionar campo `difficulty` ao estado inicial do gameStore
  - Valor padrao: 'normal'

- [ ] TASK-025: Atualizar action `initGame()` no gameStore
  - Aceitar parametro `difficulty?: DifficultyLevel`
  - Salvar no estado

- [ ] TASK-026: Criar selector `useDifficulty()` no gameStore
  - Exportar hook para acessar dificuldade atual

---

## Fase 7: Alteracoes nos Hooks

- [ ] TASK-027: Refatorar `useAIPlayer.ts`
  - Construir `AIDecisionContext` com dados do store (incluindo typeCounts, shapeCounts)
  - Usar novo `selectAIPill(ctx)`
  - Usar novo `shouldAIUseItem(ctx)`
  - Usar delay variavel por dificuldade

- [ ] TASK-028: Refatorar `useAIItemSelection.ts`
  - Usar `selectAIInitialItems(difficulty, available)`
  - Obter dificuldade do store

- [ ] TASK-029: Criar `useAIStore.ts` (NOVO)
  - Hook para comportamento da IA na loja
  - `shouldAIWantStore()` chamado durante rodada
  - `selectAIStoreItems()` chamado na fase shopping

- [ ] TASK-030: Integrar `useAIStore` no fluxo de shopping
  - Conectar com gameStore
  - Auto-toggle `wantsStore` para IA
  - Auto-compra na fase shopping

---

## Fase 8: Componentes de UI

- [ ] TASK-031: Criar componente `DifficultySelect.tsx`
  - Select com 4 opcoes
  - Tooltips com descricoes
  - Estilo 8bit consistente

- [ ] TASK-032: Atualizar `App.tsx` - Tela Setup
  - Adicionar estado local para dificuldade selecionada
  - Renderizar `DifficultySelect` acima do botao
  - Passar dificuldade para `startGame()`

- [ ] TASK-033: Atualizar `useGameActions.ts`
  - `startGame()` aceita parametro de dificuldade
  - Propaga para `initGame()`

---

## Fase 9: Integracao e Testes

- [ ] TASK-034: Testar fluxo completo Easy
  - IA seleciona aleatorio
  - Ignora typeCounts
  - Usa poucos itens
  - Delay mais longo

- [ ] TASK-035: Testar fluxo completo Normal
  - IA seleciona aleatorio
  - Usa typeCounts para decisao de itens defensivos
  - Delay normal

- [ ] TASK-036: Testar fluxo completo Hard/Insane
  - IA usa typeCounts + reveladas para selecao
  - IA faz deducao (Insane only)
  - Usa itens estrategicamente baseado em risco
  - Delay mais curto

- [ ] TASK-037: Atualizar documentacao
  - Atualizar `architecture.md` com novos arquivos
  - Atualizar `product.md` com feature de dificuldade
  - Documentar heuristicas de typeCounts em `aiLogic.ts`

---

## Dependencias entre Tasks

```
                        FASE 1: TYPES & CONFIG
TASK-001 ─┬─> TASK-003 ─┬─> TASK-005 ─> TASK-006 ─> TASK-007
TASK-002 ─┴─> TASK-004 ─┘
          │
          ▼
                    FASE 2: ANALISE DE RISCO (typeCounts)
          └──────────> TASK-008 ─┬─> TASK-009 ─┬─> TASK-010
                                 │             │
                                 └─> TASK-011 ─┘
                                       │
                                       ▼
                    FASE 3: SELECAO DE PILULAS
                       TASK-012 ─┬─> TASK-013 ─> TASK-014
                       TASK-015 ─┘
                                       │
                                       ▼
                    FASE 4: USO DE ITENS
                       TASK-016 ─> TASK-017 ─> TASK-018 ─> TASK-019
                                       │
                                       ▼
                    FASE 5: PRE-JOGO E LOJA
                       TASK-020 ─> TASK-021
                       TASK-022 ─> TASK-023
                                       │
                                       ▼
                    FASE 6: STORE
                       TASK-024 ─> TASK-025 ─> TASK-026
                                       │
                                       ▼
                    FASE 7: HOOKS
                       TASK-027 ─┬─> TASK-029 ─> TASK-030
                       TASK-028 ─┘
                                       │
                                       ▼
                    FASE 8: UI
                       TASK-031 ─> TASK-032 ─> TASK-033
                                       │
                                       ▼
                    FASE 9: TESTES
                       TASK-034 ─┬─> TASK-036 ─> TASK-037
                       TASK-035 ─┘
```

---

## Notas de Implementacao

### Ordem Recomendada

1. **Dia 1:** Types e Config (TASK-001 a TASK-007)
2. **Dia 2:** AI Logic - Analise de Risco (TASK-008 a TASK-011) - **NOVO: typeCounts**
3. **Dia 3:** AI Logic - Selecao de Pilulas (TASK-012 a TASK-015)
4. **Dia 4:** AI Logic - Uso de Itens (TASK-016 a TASK-019)
5. **Dia 5:** AI Logic - Pre-jogo e Loja (TASK-020 a TASK-023)
6. **Dia 6:** Store e Hooks (TASK-024 a TASK-030)
7. **Dia 7:** UI e Integracao (TASK-031 a TASK-037)

### Checkpoints de Validacao

- [ ] Apos Fase 1: Types compilam sem erro
- [ ] Apos Fase 2: `calculateTypeOdds()` e `analyzePoolRisk()` funcionam
- [ ] Apos Fase 4: `evaluateItem()` usa analise de risco corretamente
- [ ] Apos Fase 6: Store aceita e armazena dificuldade
- [ ] Apos Fase 7: IA joga usando nova logica com typeCounts
- [ ] Apos Fase 8: UI permite selecionar dificuldade
- [ ] Apos Fase 9: Jogo completo funcional em todos niveis

### Retrocompatibilidade

- Comportamento atual da IA DEVE ser identico ao nivel Normal
- Se nenhuma dificuldade for passada, usar 'normal' como padrao
- Nenhuma quebra de funcionalidade existente
- `typeCounts` ja esta disponivel no estado, nenhuma mudanca no modelo

---

## Estimativa de Complexidade (Atualizada)

| Fase | Complexidade | Estimativa |
| :--- | :--- | :--- |
| Types e Config | Baixa | 1-2h |
| AI Logic - Analise de Risco | Media | 2-3h |
| AI Logic - Selecao de Pilulas | Media | 2-3h |
| AI Logic - Uso de Itens | Alta | 3-4h |
| AI Logic - Pre-jogo/Loja | Media | 2-3h |
| Store e Hooks | Media | 2-3h |
| UI | Baixa | 1-2h |
| Integracao/Testes | Media | 2-3h |
| **TOTAL** | **Media-Alta** | **15-23h** |

