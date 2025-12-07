# Arquitetura do Jogo

## Componentes Principais

### Game Board (`src/components/game/`)
- `GameBoard.tsx` - Orquestra a tela de jogo
- `PillPool.tsx` - Grid de pilulas na mesa
- `Pill.tsx` - Pilula individual (clicavel)
- `AnimatedPlayerArea.tsx` - Card do jogador com animacoes
- `TurnIndicator.tsx` - Indicador de turno atual
- `TypeCounter.tsx` - Contagem publica de tipos de pilulas

### Overlays (`src/components/overlays/`)
- `OverlayManager.tsx` - Gerencia qual overlay esta ativo
- `PillReveal.tsx` - Revela o tipo da pilula consumida
- `GameOverDialog.tsx` - Tela de fim de jogo
- `NewRoundOverlay.tsx` - Banner de nova rodada

### Toasts (`src/components/toasts/`)
- `ToastManager.tsx` - Renderiza toasts ativos
- `Toast.tsx` - Toast individual (8bit style)

## Stores (Zustand)

### gameStore
Estado central do jogo:
- `players` - Dados dos jogadores (vidas, resistencia)
- `pillPool` - Pilulas na mesa
- `currentPlayerId` - Quem esta jogando
- `phase` - setup | playing | roundEnding | ended
- `round` - Numero da rodada
- `stats` - Estatisticas da partida

### overlayStore
Gerencia overlays bloqueantes:
- `current` - Tipo do overlay ativo (ou null)
- `data` - Dados especificos do overlay
- `openPillReveal()`, `openGameOver()`, `openNewRound()`, `close()`

### toastStore
Fila de notificacoes:
- `toasts` - Array de toasts ativos
- `show()`, `dismiss()`, `clear()`

## Hooks Principais

### useGameActions
Acoes do jogo: `startGame()`, `consumePill()`, `resetGame()`

### usePillConsumption
Fluxo completo de consumo de pilula:
1. Seleciona pilula
2. Abre PillReveal overlay
3. Aplica efeito no jogador
4. Mostra toast de feedback
5. Alterna turno

### useAIPlayer
Logica da IA:
- Detecta quando e turno da IA
- Simula delay de "pensamento"
- Seleciona pilula aleatoria
- Dispara consumo

## Fluxo de Dados

```
[Usuario clica pilula]
       |
       v
[usePillConsumption.startConsumption(pillId)]
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
[toastStore.show(feedback)]
       |
       v
[Alterna turno ou inicia nova rodada]
```

