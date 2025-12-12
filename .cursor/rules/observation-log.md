# Registro de Observacoes

## 🧠 Licoes de Refatoracao (Preencha durante o processo)

Use esta secao para registrar armadilhas encontradas.
Exemplo:
- [Data] **Risco de Render:** Ao refatorar `GameBoard`, descobrimos que o timer dispara re-renders no componente pai. Solucao: O timer foi isolado em um componente filho `TurnTimer`.
- [Data] **Zustand:** Nao desestruture stores dentro de loops ou callbacks. Use seletores granulares (`useStore(s => s.item)`) para evitar renders desnecessarios.

- [2024-12-11] **Barrel Exports:** Ao adicionar novos tipos, SEMPRE atualizar `src/types/index.ts`. Imports do tipo `import('@/types')` falham se o tipo nao estiver exportado no barrel, mesmo que exista no arquivo de origem.

- [2024-12-11] **Timeout Cleanup:** Em stores com `setTimeout`, SEMPRE limpar o timeout em:
  1. Action de reset especifica
  2. Action `reset()` global
  3. Antes de criar novo timeout (evitar vazamento)
  Exemplo: `multiplayerStore._rematchTimeoutId` limpo em `resetRematchState()` e `reset()`

- [2024-12-11] **Race Conditions em Multiplayer:** Quando dois jogadores acionam mesma action simultaneamente, validar se estado atual ja reflete a intencao antes de criar novo estado. Exemplo: ambos em `rematchState.status === 'waiting'` significa "ambos aceitaram".

- [2024-12-11] **Verificacao de Estado Local vs Remoto:** Ao implementar sistemas de coordenacao multiplayer, SEMPRE verificar se o estado pertence ao jogador local ou remoto. Nao assumir que `requestedBy !== null` identifica o oponente - pode ser o proprio jogador! Padrao correto:
  ```typescript
  // ❌ ERRADO
  const isOpponentState = state.someField !== null
  
  // ✅ CORRETO
  const isMyState = state.someField === myId
  const isOpponentState = state.someField !== null && state.someField !== myId
  ```
  Exemplo: Bug de auto-aceitar rematch corrigido verificando `requestedBy === localPlayerId` vs `requestedBy !== localPlayerId`.

- [2024-12-11] **Callback Chains em React Dialogs:** Ao implementar acoes em Dialogs, EVITAR chamar `onClose()` apos acoes que mudam estado (ex: `onAcceptRematch()`). O Dialog deve fechar automaticamente via mudanca de estado (fase/modo). Problema:
  ```typescript
  // ❌ ERRADO - Cria callback chain duplo
  <Button onClick={() => {
    onAcceptRematch()  // 1. Muda estado
    onClose()          // 2. Dispara onOpenChange
                       // 3. onOpenChange pode chamar outra action conflitante
  }}>
  
  // ✅ CORRETO - Fecha automaticamente
  <Button onClick={() => {
    onAcceptRematch()  // 1. Muda estado
                       // 2. Dialog fecha quando componente pai re-renderiza
  }}>
  ```
  Exemplo: Bug de dupla chamada `acceptRematch()` + `declineRematch()` corrigido removendo `onClose()` manual.

- [2024-12-11] **Refatoracao de Stores (N-Jogadores):** Decomposicao bem-sucedida do gameStore:
  - **6 Stores Modulares** criados: gameFlowStore, pillPoolStore, playerStore, itemUsageStore, effectsStore, shopStore
  - **224 testes unitarios** adicionados (antes: ~10% cobertura)
  - **DUAL-WRITE Strategy:** Manteve retrocompatibilidade durante migracao - gameStore delega para stores modulares
  - **Barrel Exports:** `src/stores/game/index.ts` exporta tudo - permite imports limpos (`@/stores/game`)
  - **Funcoes Puras:** turnManager/playerManager extraidos para `utils/` - facilitam testes e logica N-jogadores
  - **Reducao de 223 linhas** no gameStore (-9%) removendo comentarios DUAL-WRITE e logs
  - **Zero regressoes:** Single player e multiplayer continuam funcionais
  - **Proximos passos:** UI para N-jogadores (spec separada), remover refs hardcoded restantes

### Decisoes Arquiteturais

- [2024-12-11] **PlayerId vs UserId:** Decidimos separar dois conceitos:
  - `PlayerId` = posicao na partida (`player1`, `player2`), gerado por indice, nao persistente
  - `UserId` = UUID do Supabase Auth, identidade do usuario, persistente
  - Motivo: Permite "Guest-First" (jogar sem cadastro) e simplifica logica de turnos
  - Campo `Player.userId: string | null` sera adicionado na Fase 3.5 do refactor

- [2024-12-11] **Sistema de Rematch (Multiplayer):** Implementado fluxo de coordenacao pos-jogo:
  - Estado `rematchState` no `multiplayerStore` (nao no gameStore)
  - 3 eventos novos: `rematch_requested`, `rematch_accepted`, `rematch_declined`
  - Timeout de 30s para decisao (limpo automaticamente)
  - Race condition tratada: ambos solicitam = aceitacao automatica
  - UI condicional em `GameOverDialog` (3 variantes)
  - Importante: `handleRestart` nao chama `resetGame()` em multiplayer (delegado aos callbacks)
  - Resultado: Fluxo completo funcional em ~2h (8 arquivos modificados, 0 erros)

## Diretrizes para o Agente

### Antes de Qualquer Alteracao
1. Leia `architecture.md` para entender a estrutura atual
2. Leia `tech-stack.md` para garantir consistencia tecnologica
3. Verifique `product.md` para alinhar com o objetivo do jogo

### Ao Implementar Features
- Siga os padroes de `structure.md`
- Mantenha separacao entre UI (componentes) e logica (stores/hooks)
- Use TypeScript para todas as interfaces
- Prefira composicao e reutilizacao de componentes existentes

### Decisoes de Design Importantes
- **State Management:** Zustand com stores modulares (gameStore, overlayStore, toastStore)
- **Animacoes:** Framer Motion com AnimatePresence para transicoes
- **UI Retro:** Componentes 8bit/ui para visual pixelado consistente
- **Overlays:** Sistema de stack com apenas 1 overlay ativo por vez
- **Toasts:** Sistema de fila nao-bloqueante para feedback

### Anti-Patterns a Evitar
- Nao criar novos stores sem necessidade clara
- Nao duplicar estado entre stores
- Nao colocar logica de negocio em componentes
- Nao usar inline styles (preferir Tailwind)
- Nao criar componentes muito grandes (max ~200 linhas)
