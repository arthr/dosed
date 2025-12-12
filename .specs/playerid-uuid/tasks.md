# Tasks: playerid-uuid (ordem explícita + UUID)

## Tarefa 1 — Parar de ordenar por PlayerId (migrar para playerOrder)
- **Status:** PENDING
- **Objetivo:** remover `sort`/parse de `playerN` e padronizar iteração via `playerOrder`.
- **Critério de pronto:** não existe mais `getPlayerIds().sort(...)` alimentando UI/turnos.

## Tarefa 2 — Deprecar `getPlayerIds` e criar helper neutro
- **Status:** TODO
- **Objetivo:** `getPlayerIds` não pode mais assumir `playerN`; criar helper que não ordena por semântica (ex.: `getPlayerIdsUnordered`) e migrar usos.

## Tarefa 3 — Introduzir seatIndex apenas para UI/DevTool (legibilidade)
- **Status:** TODO
- **Objetivo:** exibir “P1/P2/P3” por posição em `playerOrder` sem depender de PlayerId.

## Tarefa 4 — Migrar PlayerId para UUID (single player)
- **Status:** TODO
- **Objetivo:** gerar UUIDs para humano/bot no `initGame`, manter `playerOrder` como fonte de ordem.

## Tarefa 5 — Migrar PlayerId para UUID (multiplayer)
- **Status:** TODO
- **Objetivo:** host cria UUIDs + `playerOrder` e envia para guest no sync inicial; eventos usam UUID.


