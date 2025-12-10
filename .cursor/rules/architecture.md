# Arquitetura do Jogo

## Componentes Principais

### Game Board (`src/components/game/`)
- `GameBoard.tsx` - Orquestra a tela de jogo
- `PillPool.tsx` - Grid de pilulas na mesa
- `Pill.tsx` - Pilula individual (clicavel, estados: revealed, inverted, doubled, target)
- `AnimatedPlayerArea.tsx` - Card do jogador com animacoes e inventario
- `TurnIndicator.tsx` - Indicador de turno atual
- `TypeCounter.tsx` - Contagem publica de tipos de pilulas
- `DifficultySelect.tsx` - Seletor de dificuldade da IA (tela setup)

### Sistema de Itens (`src/components/game/`)
- `ItemSelectionScreen.tsx` - Tela de selecao de itens (pre-jogo)
- `ItemCard.tsx` - Card visual do item (selecao)
- `InventoryBar.tsx` - Barra de inventario do jogador
- `InventorySlot.tsx` - Slot individual de item
- `ItemTargetSelector.tsx` - Overlay de selecao de alvo para itens

### Overlays (`src/components/overlays/`)
- `OverlayManager.tsx` - Gerencia qual overlay esta ativo
- `PillReveal.tsx` - Revela o tipo da pilula consumida
- `GameOverDialog.tsx` - Tela de fim de jogo
- `NewRoundOverlay.tsx` - Banner de nova rodada
- `ItemEffectOverlay.tsx` - Feedback visual de item usado

### Toasts (`src/components/toasts/`)
- `ToastManager.tsx` - Renderiza toasts ativos
- `Toast.tsx` - Toast individual (8bit style)

## Stores (Zustand)

### gameStore
Estado central do jogo:
- `players` - Dados dos jogadores (vidas, resistencia, inventario, efeitos)
- `pillPool` - Pilulas na mesa (com flags inverted, doubled)
- `currentTurn` - Quem esta jogando
- `phase` - setup | itemSelection | playing | roundEnding | shopping | ended
- `round` - Numero da rodada
- `difficulty` - Nivel de dificuldade da IA (easy | normal | hard | insane)
- `targetSelection` - Estado de selecao de alvo para itens
- `revealedPills` - IDs de pilulas reveladas pelo Scanner
- `itemSelectionConfirmed` - Status de confirmacao por jogador
- `typeCounts` - Contagem publica de tipos de pilulas (informacao visivel a todos)
- `shapeCounts` - Contagem publica de shapes (informacao visivel a todos)

Selectors:
- `useDifficulty()` - Retorna dificuldade atual

### overlayStore
Gerencia overlays bloqueantes:
- `current` - Tipo do overlay ativo (pillReveal, gameOver, newRound, itemEffect, null)
- `pillRevealData`, `gameOverData`, `newRoundData`, `itemEffectData`
- `openPillReveal()`, `openGameOver()`, `openNewRound()`, `openItemEffect()`, `close()`

### toastStore
Fila de notificacoes:
- `toasts` - Array de toasts ativos
- `show()`, `dismiss()`, `clear()`

## Hooks Principais

### useGameActions
Acoes do jogo: `startGame(config?)`, `resetGame()`

### usePillConsumption
Fluxo completo de consumo de pilula:
1. `startConsumption(pillId, forcedTarget?)` - Inicia consumo (opcional: Force Feed)
2. Abre PillReveal overlay
3. `confirmReveal()` - Aplica efeito no jogador
4. Mostra toast de feedback
5. Alterna turno (ou nao, se forcado)

### useItemSelection
Selecao de itens pre-jogo:
- `selectItem()`, `deselectItem()`, `confirmSelection()`
- Validacao de limite (5 itens)

### useItemUsage
Uso de itens durante partida:
- `startUsage(itemId)` - Inicia uso de item
- `cancelUsage()` - Cancela selecao de alvo
- `executeItem(itemId, targetId?)` - Executa efeito do item
- `isSelectingTarget`, `validTargets`, `selectedItemId`

### useAIPlayer
Logica da IA durante jogo:
- Detecta turno da IA
- Constroi `AIDecisionContext` com dados do store
- Decide se usa item baseado na dificuldade e analise de risco
- Seleciona pilula usando logica apropriada (random para Easy, smart para Hard/Insane)
- Delay variavel por dificuldade
- Dispara consumo

### useAIItemSelection
Selecao automatica de itens pela IA:
- Usa `selectAIInitialItems(difficulty, available)` para selecao baseada na dificuldade
- Easy: aleatorio | Normal: variedade | Hard: ofensivos | Insane: otimizado
- Auto-confirma apos delay

### useAIStore
Comportamento da IA na loja:
- Auto-toggle `wantsStore` baseado em coins e `storeInterestThreshold`
- Auto-compra durante fase shopping usando `selectAIStoreItems()`

### useStoreTimer
Timer da Pill Store:
- Monitora `storeState.timerStartedAt` e `timerDuration`
- Retorna `remainingTime` e `formattedTime`
- Chama `handleShoppingTimeout` ao expirar

## Sistema de Dificuldade

### Niveis
- `easy` (Paciente) - IA previsivel, ideal para aprender
- `normal` (Cobaia) - Experiencia balanceada (padrao)
- `hard` (Sobrevivente) - IA agressiva e estrategica
- `insane` (Hofmann) - IA calculista, sem piedade

### Configuracao (`utils/aiConfig.ts`)
- `AI_CONFIGS` - Parametros por nivel de dificuldade
- `getAIConfig(difficulty)` - Retorna configuracao
- `getAIThinkingDelay(difficulty)` - Delay variavel de "pensamento"

### Comportamento por Nivel

| Caracteristica | Easy | Normal | Hard | Insane |
|:---|:---:|:---:|:---:|:---:|
| Usa typeCounts | - | Itens | Sim | Sim |
| Usa reveladas | - | - | Sim | Sim |
| Usa deducao | - | - | - | Sim |
| Prioriza quest | - | - | - | Sim |
| Estrategia loja | - | - | Sim | Sim |
| Chance usar item | 15% | 35% | 55% | 80% |

## Fluxo de Dados

### Fluxo de Consumo de Pilula
```
[Usuario clica pilula]
       |
       v
[usePillConsumption.startConsumption(pillId)]
       |
       v
[Verifica Shield do jogador]
       |
       v
[overlayStore.openPillReveal(pill)]
       |
       v
[PillReveal exibe animacao]
       |
       v
[onComplete -> gameStore.consumePill()]
       |
       v
[Decrementa efeitos do jogador]
       |
       v
[Verifica Handcuffs do proximo jogador]
       |
       v
[toastStore.show(feedback)]
       |
       v
[Alterna turno ou pula se algemado]
```

### Fluxo de Uso de Item
```
[Jogador clica item no inventario]
       |
       v
[useItemUsage.startUsage(itemId)]
       |
       v
[Item requer alvo?]
    |         |
   NAO       SIM
    |         |
    v         v
[Executa]  [ItemTargetSelector]
    |         |
    |         v
    |    [Jogador clica alvo]
    |         |
    v         v
[gameStore.executeItem(itemId, targetId)]
       |
       v
[Aplica efeito especifico do item]
       |
       v
[Remove item do inventario]
       |
       v
[Toast de feedback]
```

### Fluxo de Decisao da IA (Turno)
```
[Detecta turno da IA]
       |
       v
[buildAIContext() - monta AIDecisionContext]
       |
       v
[getAIThinkingDelay(difficulty)]
       |
       v
[shouldAIUseItem(ctx)?]
    |         |
   NAO       SIM
    |         |
    |         v
    |    [selectAIItem(ctx)]
    |         |
    |         v
    |    [selectAIItemTarget(itemType, ctx)]
    |         |
    |         v
    |    [executeItem()]
    |         |
    v         v
[selectAIPill(ctx)]
       |
       v
[startConsumption(pillId)]
```

## Types

### types/game.ts
- `DifficultyLevel` - 'easy' | 'normal' | 'hard' | 'insane'
- `DIFFICULTY_LABELS` - Labels de exibicao
- `DIFFICULTY_DESCRIPTIONS` - Descricoes para tooltip
- `GameConfig` - Inclui campo `difficulty`
- `GameState` - Inclui campo `difficulty`

### types/ai.ts
- `AIConfig` - Parametros de comportamento da IA
- `AIDecisionContext` - Contexto para decisoes (inclui typeCounts, shapeCounts)
- `PoolRiskLevel` - 'critical' | 'high' | 'medium' | 'low'
- `PoolRiskAnalysis` - Analise de risco do pool
- `ItemEvaluation` - Resultado de avaliacao de item

## Utils

### aiConfig.ts (NOVO)
- `AI_CONFIGS` - Configuracoes por nivel de dificuldade
- `getAIConfig(difficulty)` - Retorna config para nivel
- `getAIThinkingDelay(difficulty)` - Delay aleatorio por nivel

### aiLogic.ts (REFATORADO)
Analise de Risco:
- `calculateTypeOdds(ctx)` - Probabilidade de cada tipo no pool
- `analyzePoolRisk(ctx)` - Analise completa de risco
- `deduceNonRevealedTypes(ctx)` - Deducao logica (Insane)
- `calculatePoolRisk(typeCounts, poolSize)` - Helper rapido

Selecao de Pilulas:
- `selectAIPill(ctx)` - Selecao principal baseada na dificuldade
- `selectRandomPill(pillPool)` - Selecao aleatoria (Easy/fallback)
- `selectSmartPill(ctx)` - Selecao inteligente (Hard/Insane)

Uso de Itens:
- `shouldAIUseItem(ctx)` - Decide se usa item (com bonus por risco)
- `selectAIItem(ctx)` - Seleciona melhor item
- `evaluateItem(item, ctx)` - Pontua item no contexto
- `selectAIItemTarget(itemType, ctx, opponentId)` - Seleciona alvo

Pre-jogo:
- `selectAIInitialItems(difficulty, available)` - Selecao de itens iniciais

Loja:
- `shouldAIWantStore(difficulty, coins)` - Interesse na loja
- `selectAIStoreItems(ctx, coins, items)` - Selecao de compras

### itemCatalog.ts
- `ITEM_CATALOG` - Definicoes de todos os 9 itens
- `ITEMS_BY_CATEGORY` - Agrupamento por categoria
- `CATEGORY_TEXT_COLORS`, `CATEGORY_HEX_COLORS` - Cores por categoria

### itemLogic.ts
- Logica de aplicacao de efeitos de cada item

### gameLogic.ts
- `applyPillEffect(pill, player, options?)` - Aplica efeito com suporte a Shield
- `hasPlayerEffect(player, effectType)` - Verifica efeitos ativos

### pillProgression.ts
- `PROGRESSION` - Configuracao de desbloqueio e distribuicao de tipos por rodada
- `POOL_SCALING` - Configuracao de quantidade de pilulas por rodada (step function)
- `getPillChances(round, config?)` - Calcula probabilidades normalizadas por rodada
- `rollPillType(round, config?)` - Sorteia tipo de pilula baseado na rodada (uso: pilulas bonus)
- `getPillCount(round, config?)` - Calcula quantidade de pilulas por rodada
- `distributePillTypes(count, round, config?)` - Distribui pilulas proporcionalmente (usado pelo pool principal)

### shapeProgression.ts
- `SHAPE_PROGRESSION` - Configuracao de shapes ATIVAS/SAZONAIS por rodada
- `getShapeChances(round, config?)` - Calcula probabilidades de shapes
- `rollShape(round, config?)` - Sorteia shape baseada na rodada
- `distributeShapes(count, round, config?)` - Distribui shapes proporcionalmente
- `countPillShapes(pills)` - Conta quantidade de cada shape no pool

### questGenerator.ts
- `DEFAULT_QUEST_CONFIG` - Configuracao padrao de quests (minLength, maxLength)
- `generateShapeQuest(round, shapeCounts, config?)` - Gera quest realizavel baseado no pool
- `checkQuestProgress(quest, consumedShape)` - Verifica progresso e retorna se completou

### storeConfig.ts
- `STORE_ITEMS` - Array de itens disponiveis na Pill Store
- `DEFAULT_STORE_CONFIG` - Configuracao da loja (shoppingTime, reduceMultiplier)