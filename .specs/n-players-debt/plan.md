# Plano de refatoração: N-jogadores + remoção de código morto (dívida pós-limpeza)

**Origem:** `.specs/future/ui-n-players-debt.md`  
**Data:** 2025-12-12  
**Meta do plano:** reduzir hardcodes `player1/player2`, eliminar suposições 1v1 e cortar artefatos mortos **sem aumentar carga cognitiva** (dev solo), obedecendo **Fronteiras Rígidas** (UI → Hooks → Stores/Utils).

---

## Objetivo

1. **Padronizar ordenação/identidade de jogadores na UI**: UI deve renderizar por uma fonte única (preferência: `playerOrder` do store modular; fallback: `getPlayerIds(players)`).
2. **Eliminar hardcodes 1v1 nos fluxos críticos**:
   - seleção de alvo (usar `useTargetablePlayers()` / `getTargetablePlayers()`),
   - escolha do “local player” (single/multi),
   - timer/confirmação da loja (iterar por `playerIds`),
   - IA (não assumir “IA = player2”).
3. **Restaurar fronteiras**: componentes de UI não devem importar `src/utils/*` diretamente (ex.: `ITEM_CATALOG`, `STORE_ITEMS`, `getStoreItemById`).
4. **Limpeza**: remover arquivo morto `src/stores/gameStore.ts.backup-cleanup`.

---

## Arquivos afetados

### UI (components)
- `src/components/game/GameBoard.tsx`
- `src/components/game/PillStore.tsx`
- `src/components/overlays/OverlayManager.tsx`
- `src/components/overlays/GameOverDialog.tsx`
- `src/components/game/ItemSelectionScreen.tsx`
- `src/components/dev/FloatingDevTool/tabs/ActionsTab.tsx`
- `src/components/dev/FloatingDevTool/tabs/GameStateTab.tsx`
- `src/components/dev/FloatingDevTool/tabs/StoresTab.tsx`

### Hooks
- `src/hooks/useGameState.ts` (já tem `usePlayerIds`, `usePlayersArray`; alinhar uso)
- `src/hooks/useTargetablePlayers.ts` (fonte oficial de “alvos”)
- `src/hooks/useAIPlayer.ts`
- `src/hooks/useAIStore.ts`
- `src/hooks/useAIItemSelection.ts`
- `src/hooks/useStoreTimer.ts`
- `src/hooks/useMultiplayer.ts`
- `src/hooks/useGameBoardState.ts` (ponto de agregação do `GameBoard`)
- `src/hooks/usePillStoreState.ts` (ponto de agregação do `PillStore`)
- `src/hooks/useItemSelectionState.ts` (aparece no grep; validar se assume 1v1)
- `src/hooks/useItemSelection.ts` (aparece no grep; validar se assume 1v1)
- `src/hooks/useOverlayState.ts` (fonte do `OverlayManager`)

### Stores
- `src/stores/gameStore.ts` (shopping flow ainda binário; alvo/confirm/tempo)
- `src/stores/multiplayerStore.ts` (grep indica hardcodes; validar onde)
- `src/stores/overlayStore.ts` (grep indica hardcodes; validar onde)

### Stores modulares (referência para fonte de verdade)
- `src/stores/game/gameFlowStore.ts` (tem `playerOrder`)
- `src/stores/game/playerStore.ts` (tem `playerOrder`)

### Utils (suporte N-player já existente)
- `src/utils/playerManager.ts` (`getPlayerIds`, `getAlivePlayers`)
- `src/utils/turnManager.ts` (`getTargetablePlayers`)
- `src/utils/itemCatalog.ts` (atualmente importado direto pela UI — será “encapsulado” via hook)
- `src/utils/storeConfig.ts` (atualmente importado direto pela UI — será “encapsulado” via hook)

### Limpeza
- `src/stores/gameStore.ts.backup-cleanup` (remover)

---

## Diagnóstico (carga cognitiva)

### Violações de fronteira (Regra de Ouro #2)
- `GameBoard.tsx` importa `ITEM_CATALOG` de `src/utils/itemCatalog.ts`.
- `PillStore.tsx` importa `STORE_ITEMS/getStoreItemById` de `src/utils/storeConfig.ts`.

**Impacto:** UI passa a “conhecer” regras/catálogos do domínio; mudanças em `utils/` podem quebrar UI silenciosamente e espalham dependências.

### Acoplamento oculto / suposições 1v1
- IA e seleção de itens/loja: `player2` hardcoded como IA (`useAIStore.ts`, `useAIItemSelection.ts`, `useAIPlayer.ts` via `buildAIContext()`).
- Loja/timer: confirmações e “oponente confirmou” assumem 2 players (`useStoreTimer.ts`, `PillStore.tsx`, trechos de `gameStore.ts`).
- Multiplayer helper: `opponentPlayerId` via ternário em `useMultiplayer.ts`.
- Overlay/local player: single player assume “humano = player1 se player1 não é AI” (`OverlayManager.tsx`).
- Game over UI: `GameOverDialog.tsx` tipa `players` como `{player1, player2}` e usa `players.player2.isAI`.

### Complexidade desnecessária
- `GameBoard.tsx` reimplementa ordenação com `Object.keys(players)` + parse `playerN`, apesar de já existir `getPlayerIds(players)` e `usePlayerIds()` em `useGameState.ts`.
- `GameBoard.tsx` mantém fallbacks finais para `'player2'` (potencialmente inválido em estados artificiais).

---

## Estratégia (simples para dev solo)

### Princípio-guia
**Uma única regra para “quem são os jogadores” e “qual a ordem”** deve viver em **hooks** (UI consome), com fallback explícito e testável.

### Nova convenção de UI (proposta)
- Criar um hook de UI:
  - `usePlayerOrderForUI()`:
    1) tenta `playerOrder` do store modular (`gameFlowStore` ou `playerStore`) **se estiver confiável**,
    2) fallback para `getPlayerIds(useGameStore().players)`.
- Criar um hook de UI:
  - `useLocalPlayerIdForUI()`:
    - multiplayer: `localPlayerId` do multiplayer store (fallback para primeiro `playerId`),
    - single: **primeiro player não-AI** (fallback para primeiro `playerId`).

### Encapsular catálogos (para cumprir fronteiras)
- Criar hooks “data-only” (sem efeitos colaterais) para expor catálogos à UI sem importar `src/utils/*`:
  - `useItemCatalog()` → retorna `ITEM_CATALOG`
  - `useStoreCatalog()` → retorna `{ STORE_ITEMS, getStoreItemById }`

> Observação: isso parece “burocrático”, mas reduz acoplamento e torna a regra “UI só chama hooks” simples de seguir.

---

## Passo a passo (Checklist)

### [ ] Passo 1: Preparação (types / hooks pequenos e óbvios)
- [ ] Criar `src/hooks/usePlayerOrderForUI.ts` (ou adicionar em `useGameState.ts` se preferir consolidar).
- [ ] Criar `src/hooks/useLocalPlayerIdForUI.ts`.
- [ ] Criar `src/hooks/useItemCatalog.ts` e `src/hooks/useStoreCatalog.ts` (ou expandir `useGameBoardState` / `usePillStoreState` para fornecer os catálogos).

### [ ] Passo 2: Migração (tirar regras da UI e remover hardcodes 1v1)
- [ ] `GameBoard.tsx`
  - [ ] Substituir ordenação local (`Object.keys(players)` + parse) por `usePlayerOrderForUI()` (ou `usePlayerIds()`).
  - [ ] Remover `remotePid` fallback `'player1'/'player2'` e usar “primeiro id != local” **se existir**; fallback final deve ser “primeiro playerId disponível” (nunca um literal inexistente).
  - [ ] Remover fallback final `opponentId ?? 'player2'` e usar `useTargetablePlayers()[0] ?? null` com guard explícito (sem “inventar” alvo).
  - [ ] Encapsular `ITEM_CATALOG` via hook (`useItemCatalog`) ou via `useGameBoardState`.
  - [ ] Trocar `isQuestResetRecent` para forma idempotente (sem `Date.now()` no render): `useEffect` que deriva um boolean por jogador quando `lastQuestReset` muda, com `setTimeout` curto para limpar.
- [ ] `PillStore.tsx`
  - [ ] Remover `otherPlayerId` ternário.
  - [ ] Substituir aviso “oponente finalizou” por algo N-player:
    - ex.: `hasAnyOtherConfirmed = any(id != playerId && storeState.confirmed[id])`.
  - [ ] Encapsular `STORE_ITEMS/getStoreItemById` via hook (`useStoreCatalog`) ou via `usePillStoreState`.
- [ ] `OverlayManager.tsx`
  - [ ] Remover lógica `players.player1.isAI ? ...` e usar `useLocalPlayerIdForUI()`.
- [ ] `GameOverDialog.tsx`
  - [ ] Alterar props `players` de `{player1, player2}` para `Record<PlayerId, Player>`.
  - [ ] Exibir ranking simples (ordenar por `lives`, desempate por `resistance`) e destacar vencedor.
  - [ ] Em multiplayer, manter rematch UI sem depender de “oponente = player2”.
- [ ] IA
  - [ ] `useAIStore.ts` e `useAIItemSelection.ts`: parar de assumir `player2`.
    - Estratégia mínima: escolher `aiPlayerId = first(players).find(p.isAI)` e operar somente nele (single player).
    - Se houver múltiplos AIs (futuro), decidir política (fora deste escopo).
  - [ ] `useAIPlayer.ts`: em `buildAIContext`, calcular `opponent` via `getTargetablePlayers(aiPlayerId, allIds, aliveIds)[0]` (fallback para “primeiro id != ai”).
- [ ] Multiplayer helper
  - [ ] `useMultiplayer.ts`: remover `opponentPlayerId` ternário; expor `otherPlayerIds` (todos exceto `localPlayerId`) ou `targetablePlayersForLocal`.
- [ ] Loja/timer
  - [ ] `useStoreTimer.ts`: ao expirar, iterar por `playerIds` e confirmar para todos que `wantsStore` e não confirmaram.
  - [ ] `gameStore.ts`:
    - [ ] `checkAndStartShopping`: trocar `p1Wants/p2Wants` por loop em `playerIds`.
    - [ ] Remover trechos que calculam `otherPlayerId` ternário na redução de timer/confirm (usar “outros jogadores relevantes”).

### [ ] Passo 3: Integração (UI via hooks, sem imports de `src/utils/*`)
- [ ] Garantir que **nenhum componente em `src/components/`** importe `src/utils/*` diretamente para regras/catálogos do jogo.
- [ ] Centralizar esses imports em hooks (ou em stores, se fizer sentido).

### [ ] Passo 4: Limpeza (código morto / consistência)
- [ ] Deletar `src/stores/gameStore.ts.backup-cleanup`.
- [ ] Atualizar DevTool para iterar em `playerIds` (não hardcode `player1/player2`).
- [ ] Revisar `useGameState.ts` e remover/ajustar hooks marcados como `@deprecated` que ainda expõem 1v1 (ou documentar “compat layer”).

---

## Verificação de risco (testes manuais)

### Cenários single player (humano vs IA)
- [ ] Iniciar partida, confirmar que **IA ainda joga** e escolhe pilula/item sem crash.
- [ ] Completar quest, abrir loja, timer expirar: confirmar compras automáticas funcionam.
- [ ] Encerrar jogo: GameOver exibe vencedor corretamente.

### Cenários multiplayer (2 jogadores, baseline atual)
- [ ] Host cria sala, guest entra, turnos ok.
- [ ] Loja: ambos podem sinalizar/confirmar; timer e sincronização ok.
- [ ] Rematch flow: solicitar/aceitar/recusar funciona sem depender de `player2`.

### Cenários N-jogadores (quando já existir setup 3–4)
- [ ] Render do `GameBoard` não quebra com `player3/player4`.
- [ ] `useTargetablePlayers` retorna lista correta e ações que exigem alvo não “inventam” `player2`.

---

## Safety Check (regras)

- [x] **Zero novas libs**: nenhuma dependência npm proposta.
- [x] **Estrutura**: novos arquivos apenas em `src/hooks/` (conforme `structure.md`).
- [x] **Fronteiras rígidas**: plano move acesso a `src/utils/*` para hooks; UI fica consumidora.
- [x] **Imutabilidade Zustand**: nenhuma mudança proposta que exija mutação in-place.

---

## Pedido de aprovação

Plano de refatoração validado contra as Regras de Ouro criado em `.specs/n-players-debt/plan.md`. Podemos prosseguir?


