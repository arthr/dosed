# Arquitetura do Jogo

## Componentes Principais

### Game Board (`src/components/game/`)
- `GameBoard.tsx` - Orquestra a tela de jogo
- `PillPool.tsx` - Grid de pilulas na mesa
- `Pill.tsx` - Pilula individual (clicavel, estados: revealed, inverted, doubled, target)
- `AnimatedPlayerArea.tsx` - Card do jogador com animacoes e inventario
- `TurnIndicator.tsx` - Indicador de turno atual
- `TypeCounter.tsx` - Contagem publica de tipos de pilulas

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
- `phase` - setup | itemSelection | playing | roundEnding | ended
- `round` - Numero da rodada
- `targetSelection` - Estado de selecao de alvo para itens
- `revealedPills` - IDs de pilulas reveladas pelo Scanner
- `itemSelectionConfirmed` - Status de confirmacao por jogador

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
Acoes do jogo: `startGame()`, `resetGame()`

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
- Decide se usa item (35% chance, heuristicas)
- Seleciona pilula aleatoria
- Dispara consumo

### useAIItemSelection
Selecao automatica de itens pela IA:
- Seleciona 5 itens aleatorios
- Auto-confirma apos delay

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

## Utils

### itemCatalog.ts
- `ITEM_CATALOG` - Definicoes de todos os 9 itens
- `ITEMS_BY_CATEGORY` - Agrupamento por categoria
- `CATEGORY_TEXT_COLORS`, `CATEGORY_HEX_COLORS` - Cores por categoria

### itemLogic.ts
- Logica de aplicacao de efeitos de cada item

### aiLogic.ts
- `shouldAIUseItem()` - Decide se IA usa item
- `selectAIItem()` - Seleciona item para IA usar
- `selectAIItemTarget()` - Seleciona alvo para item

### gameLogic.ts
- `applyPillEffect(pill, player, options?)` - Aplica efeito com suporte a Shield
- `hasPlayerEffect(player, effectType)` - Verifica efeitos ativos
