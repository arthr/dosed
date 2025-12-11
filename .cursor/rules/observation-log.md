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
