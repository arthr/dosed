# Fluxo da Aplicacao - Dosed (Pill Roulette)

## Visao Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              APLICACAO                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  main.tsx → App.tsx → GameLayout → GameContent                          │
│                                      ↓                                   │
│                          ┌──────────┴──────────┐                        │
│                          ↓                     ↓                        │
│                     [phase=setup]         [phase=playing]               │
│                          ↓                     ↓                        │
│                     InfoPanel             GameBoard                     │
│                     + Button                   ↓                        │
│                                     ┌─────────┼─────────┐               │
│                                     ↓         ↓         ↓               │
│                              TurnIndicator  PillPool  AnimatedPlayerArea│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Arquivos

### Camadas da Aplicacao

```
src/
├── main.tsx                    # Ponto de entrada (React + StrictMode)
├── App.tsx                     # Componente raiz + roteamento por fase
├── index.css                   # Estilos globais (Tailwind)
│
├── types/                      # Definicoes TypeScript
│   ├── index.ts               # Barrel export
│   ├── pill.ts                # Pill, PillType, PillConfig
│   ├── player.ts              # Player, PlayerId, PlayerEffectResult
│   └── game.ts                # GameState, GamePhase, GameConfig
│
├── utils/                      # Funcoes puras (logica de negocio)
│   ├── constants.ts           # Configuracoes e valores default
│   ├── pillGenerator.ts       # Geracao de pool de pilulas
│   ├── gameLogic.ts           # Efeitos, colapso, criacao de player
│   └── aiLogic.ts             # Logica da IA (selecao aleatoria)
│
├── stores/                     # Estado global (Zustand)
│   └── gameStore.ts           # Estado + Actions + Selectors
│
├── hooks/                      # Hooks customizados
│   ├── index.ts               # Barrel export
│   ├── useGameActions.ts      # Wrapper para actions do store
│   ├── useGameState.ts        # Selectors otimizados
│   ├── usePillConsumption.ts  # Fluxo de consumo (reveal → feedback)
│   └── useAIPlayer.ts         # Jogada automatica da IA
│
├── components/
│   ├── ui/                    # Componentes shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── badge.tsx
│   │   ├── progress.tsx
│   │   ├── tooltip.tsx
│   │   └── alert.tsx
│   │
│   ├── layout/
│   │   └── GameLayout.tsx     # Layout principal (header, main, footer)
│   │
│   └── game/                  # Componentes do jogo
│       ├── GameBoard.tsx      # Orquestrador principal
│       ├── TurnIndicator.tsx  # Indicador de turno/rodada
│       ├── PillPool.tsx       # Mesa de pilulas
│       ├── Pill.tsx           # Pilula individual
│       ├── TypeCounter.tsx    # Contador de tipos
│       ├── AnimatedPlayerArea.tsx  # Area do jogador com animacoes
│       ├── LivesDisplay.tsx   # Exibicao de vidas
│       ├── HealthBar.tsx      # Barra de resistencia
│       ├── FloatingNumber.tsx # Numeros flutuantes (+/-dano)
│       ├── PillReveal.tsx     # Overlay de revelacao
│       ├── GameFeedback.tsx   # Toast de feedback
│       ├── NewRoundBanner.tsx # Banner de nova rodada
│       ├── GameOverDialog.tsx # Dialog de fim de jogo
│       └── InfoPanel.tsx      # Tutorial/informacoes
```

---

## Fluxo de Estado (GameStore)

### Estados do Jogo (GamePhase)

```
┌──────────┐    initGame()    ┌──────────┐    eliminacao    ┌──────────┐
│  setup   │ ───────────────→ │ playing  │ ───────────────→ │  ended   │
└──────────┘                  └──────────┘                  └──────────┘
     ↑                                                           │
     └───────────────────── resetGame() ─────────────────────────┘
```

### Fluxo de Turno

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TURNO DO JOGADOR                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Jogador seleciona pilula (click ou IA automatica)               │
│                          ↓                                           │
│  2. startConsumption(pillId)                                        │
│     - Busca pilula no pool                                          │
│     - Simula efeito (preview)                                       │
│     - Define phase = 'revealing'                                    │
│                          ↓                                           │
│  3. PillReveal exibe overlay com countdown                          │
│     - Usuario clica ou countdown termina                            │
│                          ↓                                           │
│  4. confirmReveal()                                                 │
│     - Chama consumePill(pillId) no store                            │
│     - Define phase = 'feedback'                                     │
│     - PillReveal inicia animacao de saida                           │
│                          ↓                                           │
│  5. onExitComplete (AnimatePresence)                                │
│     - GameFeedback exibe toast                                      │
│     - AnimatedPlayerArea exibe glow/shake                           │
│     - FloatingNumber exibe +/-valor                                 │
│                          ↓                                           │
│  6. handleFeedbackComplete()                                        │
│     - Limpa feedback                                                │
│     - Define phase = 'idle'                                         │
│                          ↓                                           │
│  7. Turno passa para proximo jogador                                │
│     - Se IA: useAIPlayer agenda jogada automatica (1-2s delay)      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Consumo de Pilula (Detalhado)

### Diagrama de Sequencia

```
┌────────┐  ┌───────────┐  ┌─────────────────┐  ┌───────────┐  ┌────────────┐
│  User  │  │ GameBoard │  │usePillConsumption│  │ gameStore │  │ PillReveal │
└────┬───┘  └─────┬─────┘  └────────┬────────┘  └─────┬─────┘  └──────┬─────┘
     │            │                 │                 │               │
     │ click pill │                 │                 │               │
     │───────────→│                 │                 │               │
     │            │                 │                 │               │
     │            │ handlePillSelect│                 │               │
     │            │────────────────→│                 │               │
     │            │                 │                 │               │
     │            │                 │ startConsumption│               │
     │            │                 │────────────────→│ getPillById   │
     │            │                 │                 │←──────────────│
     │            │                 │                 │               │
     │            │                 │ applyPillEffect │               │
     │            │                 │ (simula)        │               │
     │            │                 │                 │               │
     │            │                 │ phase='revealing'               │
     │            │                 │─────────────────────────────────→│
     │            │                 │                 │               │ render
     │            │                 │                 │               │
     │            │                 │                 │               │
     │ countdown/click              │                 │               │
     │────────────────────────────────────────────────────────────────→│
     │            │                 │                 │               │
     │            │ handleRevealConfirm              │               │
     │            │────────────────→│                 │               │
     │            │                 │                 │               │
     │            │                 │ confirmReveal   │               │
     │            │                 │────────────────→│ consumePill   │
     │            │                 │                 │               │
     │            │                 │ phase='feedback'│               │
     │            │                 │─────────────────────────────────→│
     │            │                 │                 │               │ exit anim
     │            │                 │                 │               │
     │            │ onExitComplete  │                 │               │
     │            │←────────────────────────────────────────────────────│
     │            │                 │                 │               │
     │            │ showFeedback    │                 │               │
     │            │ (GameFeedback)  │                 │               │
     │            │                 │                 │               │
```

---

## Fluxo da IA

```
┌─────────────────────────────────────────────────────────────────────┐
│                         useAIPlayer Hook                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  useEffect detecta:                                                  │
│    - currentPlayer.isAI === true                                    │
│    - phase === 'idle'                                               │
│    - pillPool.length > 0                                            │
│    - !hasScheduledRef.current                                       │
│                          ↓                                           │
│  Se todas condicoes TRUE:                                           │
│    1. hasScheduledRef.current = true                                │
│    2. delay = getAIThinkingDelay() // 1000-2000ms                   │
│    3. setTimeout(() => {                                            │
│         pillId = selectRandomPill(pillPool)                         │
│         startConsumption(pillId)                                    │
│         hasScheduledRef.current = false                             │
│       }, delay)                                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Efeitos das Pilulas

### Tipos de Pilula e Efeitos

```
┌───────────┬─────────────────────────────────────────────────────────┐
│   Tipo    │                      Efeito                             │
├───────────┼─────────────────────────────────────────────────────────┤
│   SAFE    │ Nenhum efeito                                           │
├───────────┼─────────────────────────────────────────────────────────┤
│  DMG_LOW  │ Dano 1-2 na resistencia                                 │
├───────────┼─────────────────────────────────────────────────────────┤
│ DMG_HIGH  │ Dano 3-4 na resistencia                                 │
├───────────┼─────────────────────────────────────────────────────────┤
│   FATAL   │ Morte instantanea (eliminado)                           │
├───────────┼─────────────────────────────────────────────────────────┤
│   HEAL    │ Cura 1-3 de resistencia (cap no maximo)                 │
└───────────┴─────────────────────────────────────────────────────────┘
```

### Logica de Colapso

```
┌─────────────────────────────────────────────────────────────────────┐
│                     applyPillEffect(pill, player)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Calcula dano/cura baseado no tipo                               │
│  2. Aplica na resistencia                                           │
│                          ↓                                           │
│  3. Se resistencia <= 0:                                            │
│     - COLAPSO!                                                      │
│     - vidas -= 1                                                    │
│     - resistencia = maxResistance                                   │
│                          ↓                                           │
│  4. Se vidas <= 0:                                                  │
│     - ELIMINADO!                                                    │
│     - Jogo termina                                                  │
│                                                                      │
│  Retorna: { player, damageDealt, healReceived, collapsed, eliminated }│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Animacoes (Framer Motion)

### Componentes Animados

```
┌─────────────────────────────────────────────────────────────────────┐
│                       HIERARQUIA DE ANIMACOES                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  GameBoard                                                          │
│  ├── TurnIndicator                                                  │
│  │   ├── [Rodada] AnimatePresence mode="wait"                       │
│  │   ├── [Turno]  AnimatePresence mode="wait" (scale+fade)          │
│  │   └── [IA msg] motion.p (opacity pulse)                          │
│  │                                                                   │
│  ├── AnimatedPlayerArea (x2)                                        │
│  │   ├── motion.div (shake/glow via variants)                       │
│  │   ├── FloatingNumber (opacity+y via AnimatePresence)             │
│  │   ├── LivesDisplay                                               │
│  │   │   └── Hearts (AnimatePresence + exit animation)              │
│  │   └── HealthBar                                                  │
│  │       └── motion.div (useSpring para largura)                    │
│  │                                                                   │
│  ├── PillPool                                                       │
│  │   └── Pill (motion.button - hover, tap, scale)                   │
│  │                                                                   │
│  ├── PillReveal (AnimatePresence mode="wait")                       │
│  │   └── Overlay com countdown + animacao de entrada/saida          │
│  │                                                                   │
│  ├── GameFeedback (toast com AnimatePresence)                       │
│  │                                                                   │
│  └── NewRoundBanner (AnimatePresence)                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Ciclo de Vida do Jogo

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CICLO COMPLETO                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [SETUP]                                                            │
│     │                                                               │
│     │ Usuario clica "Iniciar Partida"                               │
│     │ initGame() → cria players, gera pillPool                      │
│     ↓                                                               │
│  [PLAYING - Rodada 1]                                               │
│     │                                                               │
│     │ ┌─────────────────────────────────────┐                       │
│     │ │         LOOP DE TURNOS              │                       │
│     │ │                                     │                       │
│     │ │  Player 1 (humano) → seleciona pill │                       │
│     │ │  → reveal → feedback → turno passa  │                       │
│     │ │                                     │                       │
│     │ │  Player 2 (IA) → auto-seleciona     │                       │
│     │ │  → reveal → feedback → turno passa  │                       │
│     │ │                                     │                       │
│     │ │  Repete ate pool esvaziar           │                       │
│     │ └─────────────────────────────────────┘                       │
│     │                                                               │
│     │ Pool vazio? → resetRound() → Nova rodada                      │
│     │                                                               │
│     │ Jogador eliminado?                                            │
│     ↓                                                               │
│  [ENDED]                                                            │
│     │                                                               │
│     │ GameOverDialog exibe vencedor + stats                         │
│     │ Usuario clica "Jogar Novamente"                               │
│     │ resetGame() → volta para SETUP                                │
│     ↓                                                               │
│  [SETUP] ...                                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Mapa de Dependencias

### Imports Criticos

```
App.tsx
├── hooks/index.ts (useGameActions, useGamePhase, usePlayers, ...)
├── components/game/GameBoard.tsx
├── components/game/GameOverDialog.tsx
└── components/game/InfoPanel.tsx

GameBoard.tsx
├── stores/gameStore.ts (useGameStore)
├── hooks/usePillConsumption.ts
├── hooks/useAIPlayer.ts
├── components/game/AnimatedPlayerArea.tsx
├── components/game/PillPool.tsx
├── components/game/TurnIndicator.tsx
├── components/game/PillReveal.tsx
├── components/game/GameFeedback.tsx
└── components/game/NewRoundBanner.tsx

gameStore.ts
├── types/index.ts
├── utils/constants.ts
├── utils/gameLogic.ts
└── utils/pillGenerator.ts
```

---

## Resumo de Responsabilidades

| Arquivo | Responsabilidade |
|---------|-----------------|
| `gameStore.ts` | Estado global, actions, selectors |
| `usePillConsumption.ts` | Fluxo reveal → feedback → idle |
| `useAIPlayer.ts` | Jogada automatica com delay |
| `GameBoard.tsx` | Orquestracao de componentes e handlers |
| `AnimatedPlayerArea.tsx` | Card do jogador + animacoes |
| `PillReveal.tsx` | Overlay de revelacao com countdown |
| `GameFeedback.tsx` | Toast de feedback visual |
| `TurnIndicator.tsx` | Indicador de turno/rodada |

---

## Pontos de Extensao

Para adicionar novas funcionalidades:

1. **Novos tipos de pilula**: `utils/constants.ts` + `utils/gameLogic.ts`
2. **Itens/Power-ups**: Novo tipo em `types/`, logica em `utils/`, action no store
3. **Multiplayer**: Substituir store local por WebSocket/Firebase
4. **Persistencia**: Adicionar middleware no Zustand (persist)
5. **Sons**: Hook `useSoundEffects` + arquivos de audio

