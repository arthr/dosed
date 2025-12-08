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
  hooks/           # Custom hooks (useGameActions, usePillConsumption, useAIPlayer, useItem*)
  stores/          # Zustand stores (gameStore, toastStore, overlayStore)
  types/           # TypeScript types (game.ts, pill.ts, player.ts, item.ts)
  utils/           # Funcoes utilitarias (constants, pillGenerator, gameLogic, aiLogic, itemCatalog, itemLogic)
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
