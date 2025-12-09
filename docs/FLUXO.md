# Fluxo da Aplicacao - Dosed (Pill Roulette)

## Visao Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              APLICACAO                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  main.tsx → App.tsx → GameLayout → GameContent                          │
│                                      ↓                                  │
│                    ┌─────────────────┼─────────────────┐                │
│                    ↓                 ↓                 ↓                │
│             [phase=setup]   [phase=itemSelection]  [phase=playing]      │
│                    ↓                 ↓                 ↓                │
│               InfoPanel      ItemSelectionScreen   GameBoard            │
│               + Button                                 ↓                │
│                                             ┌──────────┼──────────┐     │
│                                             ↓          ↓          ↓     │
│                                      TurnIndicator  PillPool  AnimatedPlayerArea
│                                                                + InventoryBar
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
│   ├── player.ts              # Player, PlayerId, PlayerEffect, PlayerInventory (+ pillCoins)
│   ├── game.ts                # GameState, GamePhase, GameConfig, TargetSelectionState
│   ├── item.ts                # ItemType, ItemCategory, ItemDefinition, InventoryItem
│   ├── quest.ts               # ShapeQuest, QuestConfig
│   └── store.ts               # StoreState, StoreItem, StoreConfig (Pill Store)
│
├── utils/                      # Funcoes puras (logica de negocio)
│   ├── constants.ts           # Configuracoes e valores default
│   ├── pillGenerator.ts       # Geracao de pool de pilulas
│   ├── gameLogic.ts           # Efeitos, colapso, criacao de player
│   ├── aiLogic.ts             # Logica da IA (selecao, itens, heuristicas)
│   ├── itemCatalog.ts         # Catalogo de itens (9 itens, cores, icones)
│   ├── itemLogic.ts           # Logica de efeitos de cada item
│   ├── shapeProgression.ts    # Progressao de shapes por rodada
│   ├── questGenerator.ts      # Geracao de Shape Quests
│   └── storeConfig.ts         # Configuracao da Pill Store (itens, timers)
│
├── stores/                     # Estado global (Zustand)
│   ├── gameStore.ts           # Estado + Actions + Selectors
│   ├── overlayStore.ts        # Gerencia overlays (PillReveal, ItemEffect, etc)
│   └── toastStore.ts          # Fila de notificacoes
│
├── hooks/                      # Hooks customizados
│   ├── index.ts               # Barrel export
│   ├── useGameActions.ts      # Wrapper para actions do store
│   ├── useGameState.ts        # Selectors otimizados
│   ├── usePillConsumption.ts  # Fluxo de consumo (reveal → feedback)
│   ├── useAIPlayer.ts         # Jogada automatica da IA + uso de itens
│   ├── useItemSelection.ts    # Selecao de itens pre-jogo
│   ├── useItemUsage.ts        # Uso de itens durante partida
│   ├── useAIItemSelection.ts  # Selecao automatica de itens pela IA
│   ├── useOverlay.ts          # Acesso ao overlayStore
│   ├── useToast.ts            # Acesso ao toastStore
│   └── useStoreTimer.ts       # Timer da Pill Store (countdown)
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
│   ├── game/                  # Componentes do jogo
│   │   ├── GameBoard.tsx      # Orquestrador principal
│   │   ├── TurnIndicator.tsx  # Indicador de turno/rodada
│   │   ├── PillPool.tsx       # Mesa de pilulas
│   │   ├── Pill.tsx           # Pilula individual (revealed, inverted, doubled, target)
│   │   ├── TypeCounter.tsx    # Contador de tipos
│   │   ├── AnimatedPlayerArea.tsx  # Area do jogador + inventario + efeitos
│   │   ├── LivesDisplay.tsx   # Exibicao de vidas
│   │   ├── ResistanceDisplay.tsx   # Exibicao de resistencia
│   │   ├── FloatingNumber.tsx # Numeros flutuantes (+/-dano)
│   │   ├── InfoPanel.tsx      # Tutorial/informacoes
│   │   │
│   │   │  # Sistema de Itens
│   │   ├── ItemSelectionScreen.tsx  # Tela de selecao pre-jogo
│   │   ├── ItemCard.tsx             # Card visual do item
│   │   ├── InventoryBar.tsx         # Barra de inventario (5 slots)
│   │   ├── InventorySlot.tsx        # Slot individual de item
│   │   ├── ItemTargetSelector.tsx   # Overlay de selecao de alvo
│   │   │
│   │   │  # Sistema de Shapes
│   │   ├── ShapeIcon.tsx            # Icone de shape isolado
│   │   ├── ShapeQuestDisplay.tsx    # UI do objetivo atual
│   │   ├── ShapeSelector.tsx        # Selecao de shape para itens
│   │   │
│   │   │  # Pill Store
│   │   ├── PillStore.tsx            # UI principal da loja
│   │   ├── StoreItemCard.tsx        # Card de item na loja
│   │   └── WaitingForOpponent.tsx   # Tela de espera
│   │
│   ├── overlays/              # Overlays bloqueantes
│   │   ├── OverlayManager.tsx     # Gerencia qual overlay esta ativo
│   │   ├── PillReveal.tsx         # Revela pilula consumida
│   │   ├── GameOverDialog.tsx     # Tela de fim de jogo
│   │   ├── NewRoundOverlay.tsx    # Banner de nova rodada
│   │   └── ItemEffectOverlay.tsx  # Feedback visual de item usado
│   │
│   └── toasts/                # Notificacoes
│       ├── ToastManager.tsx       # Renderiza toasts ativos
│       ├── Toast.tsx              # Toast individual (8bit style)
│       └── PlayerToasts.tsx       # Toasts contextuais por jogador
```

---

## Fluxo de Estado (GameStore)

### Estados do Jogo (GamePhase)

```
┌──────────┐   initGame()   ┌───────────────┐  confirmacao  ┌──────────┐  eliminacao  ┌──────────┐
│  setup   │ ─────────────→ │ itemSelection │ ────────────→ │ playing  │ ───────────→ │  ended   │
└──────────┘                └───────────────┘               └──────────┘              └──────────┘
     ↑                                                            │                        │
     │                                                            │ pool vazio             │
     │                                                            ↓                        │
     │                                               [Alguem sinalizou loja?]              │
     │                                                   │              │                  │
     │                                                  NAO            SIM                 │
     │                                                   │              ↓                  │
     │                                                   │      ┌───────────┐              │
     │                                                   │      │ shopping  │ (timer 30s)  │
     │                                                   │      └───────────┘              │
     │                                                   │              │                  │
     │                                                   ↓              ↓                  │
     │                                                ┌─────────────────┐                  │
     │                                                │ resetRound()    │                  │
     │                                                │ (aplica boosts) │                  │
     │                                                └─────────────────┘                  │
     │                                                         │                           │
     │                                                         ↓                           │
     │                                                [playing - nova rodada]              │
     │                                                                                     │
     └──────────────────────────── resetGame() ────────────────────────────────────────────┘
```

> **Nota:** Toggle `wantsStore` e feito durante a rodada clicando no icone de Pill Coins (se `pillCoins > 0`).
> A fase `shopping` so ocorre se pelo menos 1 jogador sinalizou. Pill Store nao aparece em Game Over.

### Fluxo de Selecao de Itens

```
┌─────────────────────────────────────────────────────────────────────┐
│                   FASE: ITEM SELECTION                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Usuario ve catalogo de 9 itens (4 categorias)                   │
│     - Intel: Scanner, Inverter, Double                              │
│     - Sustain: Pocket Pill, Shield                                  │
│     - Control: Handcuffs, Force Feed                                │
│     - Chaos: Shuffle, Discard                                       │
│                          ↓                                          │
│  2. Seleciona ate 5 itens (click para toggle)                       │
│     - Contador mostra X/5                                           │
│                          ↓                                          │
│  3. Clica "Confirmar Selecao"                                       │
│     - confirmItemSelection('player1')                               │
│                          ↓                                          │
│  4. IA seleciona automaticamente (useAIItemSelection)               │
│     - 5 itens aleatorios                                            │
│     - Auto-confirma apos delay                                      │
│                          ↓                                          │
│  5. Ambos confirmados → phase = 'playing'                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Fluxo de Turno (com Itens)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TURNO DO JOGADOR                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  0. Verifica se jogador esta algemado (Handcuffs)                   │
│     - Se sim: pula turno, remove efeito, passa para proximo         │
│                          ↓                                          │
│  1. [OPCIONAL] Jogador usa item do inventario                       │
│     - Clica no item → startItemUsage(itemId)                        │
│     - Se requer alvo → ItemTargetSelector                           │
│     - Executa efeito → remove do inventario                         │
│     - NAO consome turno (pode ainda escolher pilula)                │
│                          ↓                                          │
│  2. Jogador seleciona pilula (click ou IA automatica)               │
│                          ↓                                          │
│  3. startConsumption(pillId, forcedTarget?)                         │
│     - Verifica Shield do jogador (bloqueia dano se ativo)           │
│     - Busca pilula no pool                                          │
│     - Considera flags: inverted, doubled                            │
│     - Simula efeito (preview)                                       │
│                          ↓                                          │
│  4. PillReveal exibe overlay com countdown                          │
│     - Usuario clica ou countdown termina                            │
│                          ↓                                          │
│  5. confirmReveal()                                                 │
│     - Chama consumePill(pillId) no store                            │
│     - Decrementa efeitos do jogador (Shield, etc)                   │
│                          ↓                                          │
│  6. Toast + AnimatedPlayerArea feedback                             │
│     - FloatingNumber exibe +/-valor                                 │
│                          ↓                                          │
│  7. Turno passa para proximo jogador                                │
│     - Verifica Handcuffs do proximo                                 │
│     - Se IA: useAIPlayer agenda jogada automatica                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Uso de Item

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FLUXO DE USO DE ITEM                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Jogador clica item no inventario]                                 │
│               │                                                     │
│               ▼                                                     │
│  [useItemUsage.startUsage(itemId)]                                  │
│               │                                                     │
│               ▼                                                     │
│  ┌─────────────────────────────────┐                                │
│  │ Item requer alvo?               │                                │
│  └─────────┬───────────┬───────────┘                                │
│         NAO           SIM                                           │
│            │           │                                            │
│            ▼           ▼                                            │
│   [Executa efeito]  [ItemTargetSelector]                            │
│            │           │                                            │
│            │           ▼                                            │
│            │    [Jogador clica alvo]                                │
│            │           │                                            │
│            │           ▼                                            │
│            │    [executeItem(itemId, targetId)]                     │
│            │           │                                            │
│            ▼           ▼                                            │
│  [gameStore.executeItem()]                                          │
│               │                                                     │
│               ▼                                                     │
│  [Aplica efeito especifico]                                         │
│  - Scanner: revela pilula (adiciona em revealedPills)               │
│  - Inverter: marca pilula como inverted                             │
│  - Double: marca pilula como doubled                                │
│  - Pocket Pill: +2 resistencia                                      │
│  - Shield: adiciona efeito 'shield' (1 rodada)                      │
│  - Handcuffs: adiciona efeito 'handcuffed' no oponente              │
│  - Force Feed: delega para startConsumption(pillId, opponentId)     │
│  - Shuffle: embaralha pillPool                                      │
│  - Discard: remove pilula (verifica se pool esvaziou)               │
│               │                                                     │
│               ▼                                                     │
│  [Remove item do inventario]                                        │
│               │                                                     │
│               ▼                                                     │
│  [ItemEffectOverlay + Toast]                                        │
│               │                                                     │
│               ▼                                                     │
│  [Continua turno - jogador ainda pode escolher pilula]              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fluxo da IA (com Itens)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         useAIPlayer Hook                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  useEffect detecta:                                                 │
│    - gamePhase === 'playing'                                        │
│    - currentPlayer.isAI === true                                    │
│    - phase === 'idle'                                               │
│    - pillPool.length > 0                                            │
│    - !hasScheduledRef.current                                       │
│                          ↓                                          │
│  Se todas condicoes TRUE:                                           │
│    1. hasScheduledRef.current = true                                │
│    2. delay = getAIThinkingDelay() // 1000-2000ms                   │
│    3. setTimeout(() => {                                            │
│                          ↓                                          │
│         // DECISAO DE USO DE ITEM                                   │
│         if (!hasUsedItemRef && shouldAIUseItem(currentPlayer)) {    │
│           - 35% chance base de usar item                            │
│           - Prioriza: Shield (baixa vida), Scanner (muitas pills)   │
│           - selectedItem = selectAIItem(currentPlayer, pillPool)    │
│           - targetId = selectAIItemTarget(itemType, pillPool, opp)  │
│           - executeItem(selectedItem.id, targetId)                  │
│           - hasUsedItemRef = true                                   │
│           - Agenda consumo de pilula apos delay                     │
│         }                                                           │
│                          ↓                                          │
│         // CONSUMO DE PILULA                                        │
│         // Usa getState() para evitar stale closure                 │
│         currentPillPool = useGameStore.getState().pillPool          │
│         pillId = selectRandomPill(currentPillPool)                  │
│         startConsumption(pillId)                                    │
│       }, delay)                                                     │
│                                                                     │
│  // Reset flags quando turno muda ou pilula e consumida             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Consumo de Pilula (Detalhado)

### Diagrama de Sequencia

```
┌────────┐  ┌───────────┐  ┌──────────────────┐  ┌───────────┐  ┌────────────┐
│  User  │  │ GameBoard │  │usePillConsumption│  │ gameStore │  │ PillReveal │
└────┬───┘  └─────┬─────┘  └────────┬─────────┘  └────┬──────┘  └─────┬──────┘
     │            │                 │                 │               │
     │ click pill │                 │                 │               │
     │───────────→│                 │                 │               │
     │            │                 │                 │               │
     │            │ handlePillSelect│                 │               │
     │            │────────────────→│                 │               │
     │            │                 │                 │               │
     │            │                 │ startConsumption│               │
     │            │                 │ (pillId, forcedTarget?)         │
     │            │                 │────────────────→│ getPillById   │
     │            │                 │                 │←──────────────│
     │            │                 │                 │               │
     │            │                 │ verifica Shield │               │
     │            │                 │ considera inverted/doubled      │
     │            │                 │                 │               │
     │            │                 │ applyPillEffect │               │
     │            │                 │ (simula)        │               │
     │            │                 │                 │               │
     │            │                 │ phase='revealing'               │
     │            │                 │────────────────────────────────→│
     │            │                 │                 │               │ render
     │            │                 │                 │               │
     │ countdown/click              │                 │               │
     │───────────────────────────────────────────────────────────────→│
     │            │                 │                 │               │
     │            │                 │ confirmReveal   │               │
     │            │                 │────────────────→│ consumePill   │
     │            │                 │                 │ + decrement   │
     │            │                 │                 │   effects     │
     │            │                 │ phase='feedback'│               │
     │            │                 │────────────────────────────────→│
     │            │                 │                 │               │ exit anim
     │            │                 │                 │               │
     │            │ onExitComplete  │                 │               │
     │            │←──────────────────────────────────────────────────│
     │            │                 │                 │               │
     │            │ showToast       │                 │               │
     │            │ (feedback)      │                 │               │
     │            │                 │                 │               │
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

### Modificadores de Pilula (Itens)

```
┌─────────────┬───────────────────────────────────────────────────────┐
│ Modificador │                      Efeito                           │
├─────────────┼───────────────────────────────────────────────────────┤
│  inverted   │ Dano vira cura, cura vira dano                        │
├─────────────┼───────────────────────────────────────────────────────┤
│  doubled    │ Valor do efeito e multiplicado por 2                  │
├─────────────┼───────────────────────────────────────────────────────┤
│  revealed   │ Tipo visivel para quem usou Scanner                   │
└─────────────┴───────────────────────────────────────────────────────┘
```

### Logica de Colapso

```
┌─────────────────────────────────────────────────────────────────────┐
│              applyPillEffect(pill, player, options?)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Verifica Shield do jogador                                      │
│     - Se ativo e dano: bloqueia, retorna { blocked: true }          │
│                          ↓                                          │
│  2. Calcula valor base do efeito                                    │
│                          ↓                                          │
│  3. Aplica modificadores da pilula:                                 │
│     - Se inverted: inverte sinal do efeito                          │
│     - Se doubled: multiplica por 2                                  │
│                          ↓                                          │
│  4. Aplica na resistencia                                           │
│                          ↓                                          │
│  5. Se resistencia <= 0:                                            │
│     - COLAPSO!                                                      │
│     - vidas -= 1                                                    │
│     - resistencia = maxResistance                                   │
│                          ↓                                          │
│  6. Se vidas <= 0:                                                  │
│     - ELIMINADO!                                                    │
│     - Jogo termina                                                  │
│                                                                     │
│Retorna: { player, damageDealt, healReceived, collapsed, eliminated }|
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Animacoes (Framer Motion)

### Componentes Animados

```
┌─────────────────────────────────────────────────────────────────────┐
│                       HIERARQUIA DE ANIMACOES                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GameBoard                                                          │
│  ├── TurnIndicator                                                  │
│  │   ├── [Rodada] AnimatePresence mode="wait"                       │
│  │   ├── [Turno]  AnimatePresence mode="wait" (scale+fade)          │
│  │   └── [IA msg] motion.p (opacity pulse)                          │
│  │                                                                  │
│  ├── AnimatedPlayerArea (x2)                                        │
│  │   ├── motion.div (shake/glow/shield via variants)                │
│  │   ├── FloatingNumber (opacity+y via AnimatePresence)             │
│  │   ├── Badge (Shield/Handcuffs indicator)                         │
│  │   ├── LivesDisplay                                               │
│  │   │   └── Hearts (AnimatePresence + exit animation)              │
│  │   ├── ResistanceDisplay                                          │
│  │   │   └── motion.div (useSpring para largura)                    │
│  │   └── InventoryBar                                               │
│  │       └── InventorySlot (x5) - AnimatePresence para saida        │
│  │                                                                  │
│  ├── PillPool                                                       │
│  │   └── Pill (motion.button - hover, tap, scale, target highlight) │
│  │                                                                  │
│  ├── ItemTargetSelector (overlay de selecao)                        │
│  │                                                                  │
│  └── OverlayManager                                                 │
│      ├── PillReveal (AnimatePresence mode="wait")                   │
│      ├── ItemEffectOverlay (scale + glow animation)                 │
│      ├── NewRoundOverlay (AnimatePresence)                          │
│      └── GameOverDialog (AnimatePresence)                           │
│                                                                     │
│  ToastManager                                                       │
│  └── PlayerToasts (contextuais por jogador)                         │
│      └── Toast (AnimatePresence + slide animation)                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Ciclo de Vida do Jogo

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CICLO COMPLETO                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [SETUP]                                                            │
│     │                                                               │
│     │ Usuario clica "Iniciar Partida"                               │
│     │ initGame() → cria players, gera pillPool                      │
│     ↓                                                               │
│  [ITEM SELECTION]                                                   │
│     │                                                               │
│     │ ItemSelectionScreen exibe catalogo                            │
│     │ Usuario seleciona 5 itens                                     │
│     │ IA seleciona 5 itens automaticamente                          │
│     │ Ambos confirmam → phase = 'playing'                           │
│     ↓                                                               │
│  [PLAYING - Rodada 1]                                               │
│     │                                                               │
│     │ ┌───────────────────────────────────────────┐                 │
│     │ │           LOOP DE TURNOS                  │                 │
│     │ │                                           │                 │
│     │ │  Verifica Handcuffs (pula se algemado)    │                 │
│     │ │                                           │                 │
│     │ │  Player 1 (humano):                       │                 │
│     │ │  - [Opcional] usa item do inventario      │                 │
│     │ │  - Seleciona pilula                       │                 │
│     │ │  - Reveal → feedback → turno passa        │                 │
│     │ │                                           │                 │
│     │ │  Player 2 (IA):                           │                 │
│     │ │  - [35% chance] usa item                  │                 │
│     │ │  - Auto-seleciona pilula                  │                 │
│     │ │  - Reveal → feedback → turno passa        │                 │
│     │ │                                           │                 │
│     │ │  Repete ate pool esvaziar                 │                 │
│     │ └───────────────────────────────────────────┘                 │
│     │                                                               │
│     │ Pool vazio? → Verifica wantsStore                             │
│     │                                                               │
│     │ ┌───────────────────────────────────────────┐                 │
│     │ │         PILL STORE (OPCIONAL)             │                 │
│     │ │                                           │                 │
│     │ │  Durante a rodada:                        │                 │
│     │ │  - Jogador clica icone Pill Coins         │                 │
│     │ │  - Se pillCoins > 0: toggle wantsStore    │                 │
│     │ │  - Se pillCoins = 0: toast de aviso       │                 │
│     │ │                                           │                 │
│     │ │  Ao pool esvaziar:                        │                 │
│     │ │  - Ninguem wantsStore? → resetRound()     │                 │
│     │ │                                           │                 │
│     │ │  [shopping] Timer 30s (se alguem)         │                 │
│     │ │  - Quem sinalizou: ve loja                │                 │
│     │ │  - Quem nao: "Aguardando..."              │                 │
│     │ │  - Um confirma → timer outro reduz 50%    │                 │
│     │ │  - Timeout → confirma automatico          │                 │
│     │ │  - Compras: Power-Ups, Boosts             │                 │
│     │ │                                           │                 │
│     │ │  Todos confirmados → applyBoosts()        │                 │
│     │ │  → resetRound() → Nova rodada             │                 │
│     │ └───────────────────────────────────────────┘                 │
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
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Mapa de Dependencias

### Imports Criticos

```
App.tsx
├── hooks/index.ts (useGameActions, useGamePhase, usePlayers, ...)
├── components/game/GameBoard.tsx
├── components/game/ItemSelectionScreen.tsx
├── components/game/InfoPanel.tsx
└── components/overlays/OverlayManager.tsx

ItemSelectionScreen.tsx
├── hooks/useItemSelection.ts
├── hooks/useAIItemSelection.ts
├── stores/gameStore.ts
├── utils/itemCatalog.ts
└── components/game/ItemCard.tsx

GameBoard.tsx
├── stores/gameStore.ts (useGameStore)
├── stores/overlayStore.ts (useOverlayStore)
├── hooks/usePillConsumption.ts
├── hooks/useAIPlayer.ts
├── hooks/useItemUsage.ts
├── hooks/useToast.ts
├── utils/itemCatalog.ts
├── components/game/AnimatedPlayerArea.tsx
├── components/game/PillPool.tsx
├── components/game/TurnIndicator.tsx
└── components/game/ItemTargetSelector.tsx

AnimatedPlayerArea.tsx
├── components/game/LivesDisplay.tsx
├── components/game/ResistanceDisplay.tsx
├── components/game/InventoryBar.tsx
├── components/game/FloatingNumber.tsx
└── components/toasts/PlayerToasts.tsx

gameStore.ts
├── types/index.ts
├── utils/constants.ts
├── utils/gameLogic.ts
├── utils/pillGenerator.ts
├── utils/itemCatalog.ts
└── utils/itemLogic.ts
```

---

## Resumo de Responsabilidades

| Arquivo | Responsabilidade |
|---------|-----------------|
| `gameStore.ts` | Estado global, actions de jogo e itens, selectors |
| `overlayStore.ts` | Gerencia overlays bloqueantes (PillReveal, ItemEffect, etc) |
| `toastStore.ts` | Fila de notificacoes contextuais |
| `usePillConsumption.ts` | Fluxo reveal → feedback → idle |
| `useAIPlayer.ts` | Jogada automatica + decisao de uso de item |
| `useItemSelection.ts` | Selecao de itens pre-jogo |
| `useItemUsage.ts` | Uso de itens durante partida |
| `useAIItemSelection.ts` | Selecao automatica de itens pela IA |
| `GameBoard.tsx` | Orquestracao de componentes e handlers |
| `ItemSelectionScreen.tsx` | Tela de selecao pre-jogo |
| `AnimatedPlayerArea.tsx` | Card do jogador + inventario + efeitos visuais |
| `InventoryBar.tsx` | Barra de 5 slots de itens |
| `ItemTargetSelector.tsx` | Overlay de selecao de alvo |
| `ItemEffectOverlay.tsx` | Feedback visual de item usado |
| `PillReveal.tsx` | Overlay de revelacao com countdown |
| `TurnIndicator.tsx` | Indicador de turno/rodada |

---

## Pontos de Extensao

Para adicionar novas funcionalidades:

1. **Novos tipos de pilula**: `utils/constants.ts` + `utils/gameLogic.ts`
2. **Novos itens**: `types/item.ts` + `utils/itemCatalog.ts` + `utils/itemLogic.ts` + case no `gameStore.executeItem`
3. **Multiplayer**: Substituir store local por WebSocket/Firebase
4. **Persistencia**: Adicionar middleware no Zustand (persist)
5. **Sons**: Hook `useSoundEffects` + arquivos de audio
6. **Balanceamento de itens**: Ajustar `AI_ITEM_USE_CHANCE` e heuristicas em `aiLogic.ts`
