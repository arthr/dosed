# Spec: PlayerId como UUID + ordem explícita (não derivada por sorting)

**Data:** 2025-12-12  
**Motivação:** estamos usando ordenação baseada em `PlayerId` (ex.: `player1/player2` ou `getPlayerIds().sort(...)`) para determinar ordem de render/turnos. Isso é **errado por definição**: `PlayerId` identifica um participante, não carrega semântica de posição/ordem.

---

## Objetivo

1. **Migrar `PlayerId` para UUID de sessão** (string), gerado na entrada/criação da partida/sala.
2. **Eliminar qualquer ordenação derivada de `PlayerId`** (sort de keys, parse de `playerN`, etc).
3. Tornar a ordem de turnos/renderização **explícita e estável** via `playerOrder: PlayerId[]` (ordem de entrada na room / ordem fixa do setup).
4. Definir **host** por regra de room (quem cria a sala), não por `playerId`.

---

## Premissas (validadas com backlog futuro)

- A ordem de jogadores **não muda após entrada** (exceto saída/desconexão, que não reordena — apenas remove/flag).
- Host é trivial de definir: **criador da sala**.
- `PlayerId` (sessão) e `UserId` (Supabase Auth) continuam conceitos separados:
  - **PlayerId**: UUID de sessão (não persistente)
  - **UserId**: UUID do Supabase Auth (persistente), em `Player.userId`
- Não introduzir libs novas (**uuid já existe no projeto**).

---

## Decisão de Modelo (crítica)

### Tipos
- **PlayerId**: `string` (UUID v4) gerado no cliente (single) e/orquestrado pelo host (multi) para evitar divergência.
- **PlayerOrder**: `PlayerId[]` **fonte única** de ordem (UI + turnos + loja + confirmações).

### Regra de Ouro (anti-bug)
> **Nunca** ordenar jogadores por `PlayerId`.  
Ordenação sempre vem de `playerOrder`.

---

## Onde a ordem deve viver

### Multiplayer
- `room.playerOrder: PlayerId[]` (ordem de entrada na sala).
- `multiplayerStore.localPlayerId: PlayerId` (uuid).
- Host também mantém `room.hostPlayerId: PlayerId` (ou deriva via `createdBy` + `playerId` do host).

### Single player
- `playerOrder` definido no `initGame()`:
  - `localHumanId` (uuid)
  - `botId` (uuid)
- Garantia: ordem fixa durante a partida.

---

## Mudanças necessárias (alto nível)

### 1) Types e estado
- Atualizar `PlayerId` docs: deixa de ser `playerN` e passa a ser UUID.
- Garantir que todo lugar que usa `Record<PlayerId, ...>` também tenha acesso a `playerOrder` para iterar.

### 2) Stores (fonte de verdade)
- Tornar `playerOrder` obrigatório e acessível para:
  - turn manager (`getNextTurn(currentTurn, playerOrder, alivePlayers?)`)
  - target selection (`getTargetablePlayers(current, playerOrder, alivePlayers?)`)
  - loja (`shopStore.openShop(timer, playerOrder)`)
  - qualquer UI N-player.

### 3) UI
- Substituir todo `Object.keys(players).sort(...)` por iteração em `playerOrder`.
- Fallback aceitável só em debug/devtool: se `playerOrder` vazio, usar `Object.keys(players)` **sem sort** (apenas para não quebrar UI), mas isso deve ser exceção.

### 4) Multiplayer/room
- Host definido por “criador da sala”.
- Ordem definida por “ordem de entrada”.
- Reconexão não muda ordem, apenas restaura vínculo `localPlayerId`.

---

## Arquivos afetados (candidatos)

### Suspeitos clássicos (onde hoje existe sort/parsing)
- `src/utils/playerManager.ts` (`getPlayerIds` hoje ordena por `playerN` — precisa ser repensado/deprecado)
- `src/hooks/useGameState.ts` (`usePlayerIds` baseado em `getPlayerIds`)
- `src/components/game/GameBoard.tsx` (já migrou para `usePlayerIds`, mas precisa migrar para `playerOrder`)
- `src/hooks/useTargetablePlayers.ts` (já usa `getPlayerIds`; precisa migrar para `playerOrder`)
- `src/hooks/useStoreTimer.ts` (já usa `usePlayerIds`; precisa migrar para `playerOrder`)
- `src/stores/game/gameFlowStore.ts` (já tem `playerOrder` — vira fonte de verdade)
- `src/stores/game/playerStore.ts` (já tem `playerOrder`)
- `src/stores/gameStore.ts` (ainda inicializa `['player1','player2']` e mantém shapeQuests/revealAtStart hardcoded)
- `src/stores/multiplayerStore.ts` + `src/hooks/useMultiplayer.ts` (localPlayerId/opponentId ainda assume `player1/player2` em vários pontos)

---

## Estratégia de Migração (segura, incremental)

### Fase A — “Ordem explícita” sem trocar IDs (pré-migração)
1. Introduzir `playerOrder` como fonte única para UI/hook/turnos (parar de ordenar por `playerId`).
2. Deixar `PlayerId` ainda como `playerN` temporariamente.
3. Garantir que multiplayer usa `playerOrder` vindo da room.

### Fase B — Trocar `PlayerId` para UUID
1. Alterar criação de jogadores:
   - single: gerar 2 UUIDs (humano + bot)
   - multi: host gera UUIDs e distribui no syncData inicial
2. Atualizar payloads de eventos multiplayer para carregar `playerId` uuid.
3. Remover/depredar helpers que assumem `playerN`.

---

## Riscos e pontos de atenção (UUID)

- **Logs/debug**: UUID é menos legível; solução: armazenar/mostrar também `seatIndex` derivado de `playerOrder` (ex.: “P1/P2/P3”) apenas para UI/DevTool.
- **Persistência/reconexão**: `PlayerId` é de sessão; reconexão deve reatribuir corretamente o `localPlayerId` do cliente.
- **Compat com código legado**: partes que indexam por `player1/player2` vão quebrar — precisa migração sistemática, não parcial.
- **Anti-cheat** (futuro): UUID de sessão não resolve, mas é compatível com “Authority” do host.

---

## Critérios de pronto (Definition of Done)

- Nenhum componente/hook/stores decide ordem por sort de `PlayerId`.
- A UI N-player rende sempre na ordem `playerOrder`.
- `getNextTurn`/`getTargetablePlayers` usam `playerOrder` (não keys do record).
- Em multiplayer: host e guest compartilham o mesmo `playerOrder` vindo da room.


