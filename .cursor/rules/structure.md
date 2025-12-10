# Estrutura do Projeto e Convencoes

## Estrutura de Pastas
```
src/
  components/
    game/          # Componentes do jogo (Pill, PillPool, GameBoard, Item*, Inventory*)
    layout/        # Layout da aplicacao (GameLayout, Header, Footer)
    overlays/      # Modais e overlays (PillReveal, GameOverDialog, NewRoundOverlay, ItemEffectOverlay)
    toasts/        # Sistema de notificacoes (Toast, ToastManager, PlayerToasts)
    ui/            # Componentes base shadcn/ui
      8bit/        # Componentes 8bit/ui (visual retro)
  hooks/           # Custom hooks (useGameActions, usePillConsumption, useAIPlayer, useItem*, useAIStore, useStoreTimer)
  stores/          # Zustand stores (gameStore, toastStore, overlayStore)
  types/           # TypeScript types
    game.ts        # GameState, GamePhase, GameConfig, DifficultyLevel
    pill.ts        # Pill, PillType, PillShape, PillStats
    player.ts      # Player, PlayerId, PlayerEffectResult
    item.ts        # ItemType, ItemDefinition, InventoryItem
    ai.ts          # AIConfig, AIDecisionContext, PoolRiskAnalysis
    quest.ts       # ShapeQuest, QuestConfig
    store.ts       # StoreState, StoreItem, CartItem, BoostType
    index.ts       # Barrel export
  utils/           # Funcoes utilitarias
    constants.ts       # Constantes do jogo, cores, labels, shapes
    pillGenerator.ts   # Geracao de pool de pilulas
    pillProgression.ts # Progressao de tipos e quantidade por rodada
    shapeProgression.ts # Progressao de shapes ATIVAS/SAZONAIS
    gameLogic.ts       # Logica de efeitos e colapso
    aiLogic.ts         # Logica de decisao da IA (refatorado)
    aiConfig.ts        # Configuracoes de IA por dificuldade
    itemCatalog.ts     # Catalogo de itens/power-ups
    itemLogic.ts       # Logica de efeitos de itens
    questGenerator.ts  # Geracao e validacao de Shape Quests
    storeConfig.ts     # Configuracao da Pill Store
```

## Convencoes de Nomenclatura
- **Componentes React:** `PascalCase.tsx` (ex: `GameBoard.tsx`)
- **Hooks:** `camelCase.ts` com prefixo `use` (ex: `useGameActions.ts`)
- **Stores:** `camelCase.ts` com sufixo `Store` (ex: `gameStore.ts`)
- **Types:** `camelCase.ts` (ex: `game.ts`, `pill.ts`)
- **Utils:** `camelCase.ts` (ex: `pillGenerator.ts`)
- **Variaveis:** `camelCase` sempre
- **Constantes:** `UPPER_SNAKE_CASE` (ex: `MAX_LIVES`, `PILL_TYPES`)

## Padroes de Codigo
- Componentes funcionais com hooks
- Props tipadas com interfaces (nao types inline)
- Exports nomeados (evitar default exports)
- Barrel exports em `index.ts` para cada pasta
