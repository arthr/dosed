# Tasks: n-players-debt (Implementação com checkpoints)

**Regras aplicadas:** `.cursor/rules/architecture.md` (Fronteiras rígidas), `.cursor/rules/tech-stack.md` (Zero novas libs), `.cursor/rules/structure.md` (Localização obrigatória).

## Status
- **PENDING**: próxima tarefa a ser executada (precisa de aprovação antes de tocar no código).
- **TODO**: ainda não iniciada.
- **DONE**: concluída.

---

## Checklist

### Tarefa 1 — Remover arquivo morto de backup
- **Status:** PENDING
- **Objetivo:** deletar `src/stores/gameStore.ts.backup-cleanup` (código morto).
- **Critério de pronto:** arquivo removido; build/lints não pioram.

### Tarefa 2 — Encapsular catálogos (fronteira UI → hooks)
- **Status:** TODO
- **Objetivo:** remover imports diretos de `src/utils/*` em UI.
- **Escopo mínimo:**
  - criar `src/hooks/useItemCatalog.ts` para expor `ITEM_CATALOG`;
  - criar `src/hooks/useStoreCatalog.ts` para expor `{ STORE_ITEMS, getStoreItemById }`;
  - atualizar `src/components/game/GameBoard.tsx` e `src/components/game/PillStore.tsx` para usar esses hooks.
- **Critério de pronto:** nenhum import de `@/utils/itemCatalog`/`@/utils/storeConfig` em `src/components/`.

### Tarefa 3 — Ordenação de players na UI (fonte única)
- **Status:** TODO
- **Objetivo:** padronizar `playerIds` no `GameBoard` via hooks/`getPlayerIds`, removendo reimplementações locais.
- **Critério de pronto:** `GameBoard.tsx` não usa `Object.keys(players)` para ordenar; usa um hook (`usePlayerIds()` ou `usePlayerOrderForUI()`).

### Tarefa 4 — Remover hardcodes 1v1: timer da loja
- **Status:** TODO
- **Objetivo:** `useStoreTimer.ts` confirmar compras no timeout para N jogadores (iterar por `playerIds`).
- **Critério de pronto:** nenhuma referência direta a `players.player1/player2` dentro de `useStoreTimer.ts`.

### Tarefa 5 — Remover hardcodes 1v1: IA (loja + seleção inicial + contexto)
- **Status:** TODO
- **Objetivo:** IA não assumir `player2` como único bot.
- **Escopo mínimo:**
  - `useAIStore.ts` e `useAIItemSelection.ts`: derivar `aiPlayerId` (primeiro `Player.isAI` em single);
  - `useAIPlayer.ts`: calcular oponente via `getTargetablePlayers(...)` (utils pura) ao construir contexto.
- **Critério de pronto:** nenhuma referência direta a `'player2'` como “IA fixa” nesses hooks.

### Tarefa 6 — Remover hardcodes 1v1: fluxo de shopping no gameStore
- **Status:** TODO
- **Objetivo:** em `gameStore.ts`, remover lógica binária `p1Wants/p2Wants` e `otherPlayerId` ternário no shopping flow.
- **Critério de pronto:** shopping é baseado em lista de `playerIds` e funciona com 2+.

### Tarefa 7 — Ajustar UI de GameOver para N jogadores (sem quebrar 1v1)
- **Status:** TODO
- **Objetivo:** `GameOverDialog` aceitar `Record<PlayerId, Player>` e renderizar lista/placar simples.
- **Critério de pronto:** game over continua ok em 1v1; não depende de `players.player2`.

### Tarefa 8 — DevTool: remover suposições `player1/player2`
- **Status:** TODO
- **Objetivo:** tabs do devtool iterarem por `playerIds` em vez de hardcode.
- **Critério de pronto:** devtool não quebra em N jogadores.


