# ✅ BUG's CORRIGIDOS

1. ✅ *Item* - **Scanner X2:** não revela as pilulas igualmente para os jogadores. Cada um vê pilulas reveladas diferentes.
   - **Solução:** Implementado sincronização via `pillsToReveal` no evento `round_reset`
   - **Arquivos:** `gameStore.ts`, `multiplayerStore.ts`, `types/sync.ts`
   - **Data:** 2024-12-11

2. ✅ *UI/State* - **Wants Store Toggle:** jogador pode clicar em ambos toggles ativando indevidamente o Wants Store do adversário.
   - **Solução:** Desabilitado `onToggleStore` para jogador remoto
   - **Arquivos:** `GameBoard.tsx`
   - **Data:** 2024-12-11

3. ✅ *Multiplayer* - **GameOver:** Ao final da partida, refatorar fluxo de sair/nova partida entre jogadores.
   - **Solução:** Implementado fluxo completo de Rematch com eventos `rematch_requested`, `rematch_accepted`, `rematch_declined`
   - **Arquivos:** `multiplayerStore.ts`, `GameOverDialog.tsx`, `OverlayManager.tsx`, `App.tsx`, tipos
   - **Data:** 2024-12-11

---

**Referência:** Ver detalhes completos em `.specs/refactor-game-store/PLANO-CORRECOES.md`