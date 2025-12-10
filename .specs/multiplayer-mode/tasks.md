# Tarefas: Multiplayer Online

## Visao Geral

**Estimativa total:** 40-50 horas de desenvolvimento
**Complexidade:** Alta
**Dependencias externas:** Supabase Realtime (ou alternativa)

---

## Fase 0: Setup e Infraestrutura

### TASK-MP-001: Configurar Supabase Realtime
- [x] Criar projeto Supabase (se nao existir)
- [x] Configurar Realtime Broadcast
- [x] Adicionar variaveis de ambiente
- [x] Instalar dependencias: `@supabase/supabase-js`

**Arquivos:**
- `.env.example` (criado)
- `package.json` (ja tinha dependencia)

---

### TASK-MP-002: Criar servico de realtime
- [x] Criar `src/services/realtimeService.ts`
- [x] Implementar interface `RealtimeService`
- [x] Implementar `createSupabaseRealtimeService()`
- [x] Exportar instancia singleton

**Arquivos:**
- `src/services/realtimeService.ts` (ja existia)
- `src/services/index.ts` (criado)

---

## Fase 1: Types e Stores

### TASK-MP-003: Criar types de multiplayer
- [ ] Criar `src/types/multiplayer.ts`
- [ ] Definir `GameMode`, `RoomStatus`, `LocalRole`
- [ ] Definir `Room`, `MultiplayerContext`
- [ ] Definir `ConnectionStatus`
- [ ] Atualizar `src/types/index.ts` com exports

**Arquivos:**
- `src/types/multiplayer.ts` (novo)
- `src/types/index.ts`

---

### TASK-MP-004: Criar types de eventos
- [ ] Criar `src/types/events.ts`
- [ ] Definir `GameEventType`, `GameEventBase`
- [ ] Definir eventos especificos (PillConsumedEvent, ItemUsedEvent, etc)
- [ ] Definir union `GameEvent`
- [ ] Atualizar `src/types/index.ts` com exports

**Arquivos:**
- `src/types/events.ts` (novo)
- `src/types/index.ts`

---

### TASK-MP-005: Atualizar GameConfig e GameState
- [ ] Adicionar `mode: GameMode` em `GameConfig`
- [ ] Adicionar `roomId?: string` em `GameConfig`
- [ ] Adicionar `mode: GameMode` em `GameState`
- [ ] Adicionar `roomId: string | null` em `GameState`
- [ ] Atualizar `DEFAULT_GAME_CONFIG` em constants.ts

**Arquivos:**
- `src/types/game.ts`
- `src/utils/constants.ts`

---

### TASK-MP-006: Criar multiplayerStore
- [ ] Criar `src/stores/multiplayerStore.ts`
- [ ] Implementar estado inicial
- [ ] Implementar `createRoom()` - chama realtimeService
- [ ] Implementar `joinRoom()` - valida e conecta
- [ ] Implementar `leaveRoom()` - notifica e desconecta
- [ ] Implementar `sendEvent()` - emite via WebSocket
- [ ] Implementar `handleEvent()` - aplica no gameStore
- [ ] Implementar helpers: `connect()`, `disconnect()`, `reset()`

**Arquivos:**
- `src/stores/multiplayerStore.ts` (novo)

---

## Fase 2: Integracao com gameStore

### TASK-MP-007: Adicionar modo ao estado inicial
- [ ] Adicionar `mode: 'single_player'` em `initialState`
- [ ] Adicionar `roomId: null` em `initialState`
- [ ] Atualizar `initGame()` para aceitar `mode` e `roomId`
- [ ] Atualizar `resetGame()` para resetar `mode` e `roomId`

**Arquivos:**
- `src/stores/gameStore.ts`

---

### TASK-MP-008: Criar mecanismo de sincronizacao
- [ ] Adicionar flag `isSyncingFromRemote` (module-level)
- [ ] Criar helper `setSyncingFromRemote()`
- [ ] Criar action `applyRemoteEvent()`
- [ ] Implementar switch para cada tipo de evento

**Arquivos:**
- `src/stores/gameStore.ts`

---

### TASK-MP-009: Modificar actions para emitir eventos
- [ ] Modificar `consumePill()` - emite `pill_consumed`
- [ ] Modificar `executeItem()` - emite `item_used`
- [ ] Modificar `selectItem()` - emite `item_selected`
- [ ] Modificar `deselectItem()` - emite `item_deselected`
- [ ] Modificar `confirmItemSelection()` - emite `selection_confirmed`
- [ ] Modificar `toggleWantsStore()` - emite `wants_store_toggled`
- [ ] Modificar `addToCart()` - emite `cart_updated` (add)
- [ ] Modificar `removeFromCart()` - emite `cart_updated` (remove)
- [ ] Modificar `confirmStorePurchases()` - emite `store_confirmed`

**Arquivos:**
- `src/stores/gameStore.ts`

---

## Fase 3: Condicionar IA

### TASK-MP-010: Condicionar useAIPlayer
- [ ] Importar `useGameStore` para obter `mode`
- [ ] Adicionar early return se `mode === 'multiplayer'`
- [ ] Garantir que nenhum timer e criado em multiplayer

**Arquivos:**
- `src/hooks/useAIPlayer.ts`

---

### TASK-MP-011: Condicionar useAIItemSelection
- [ ] Importar `useGameStore` para obter `mode`
- [ ] Adicionar early return se `mode === 'multiplayer'`

**Arquivos:**
- `src/hooks/useAIItemSelection.ts`

---

### TASK-MP-012: Condicionar useAIStore
- [ ] Importar `useGameStore` para obter `mode`
- [ ] Adicionar early return se `mode === 'multiplayer'`

**Arquivos:**
- `src/hooks/useAIStore.ts`

---

## Fase 4: Hooks Multiplayer

### TASK-MP-013: Criar useMultiplayer
- [ ] Criar `src/hooks/useMultiplayer.ts`
- [ ] Implementar `isLocalTurn` - verifica se turno do jogador local
- [ ] Implementar `canInteract` - turno local + fase correta
- [ ] Re-exportar estado relevante do multiplayerStore

**Arquivos:**
- `src/hooks/useMultiplayer.ts` (novo)
- `src/hooks/index.ts`

---

### TASK-MP-014: Criar useRoomConnection
- [ ] Criar `src/hooks/useRoomConnection.ts`
- [ ] Implementar reconexao automatica
- [ ] Implementar countdown de timeout
- [ ] Cleanup ao desmontar

**Arquivos:**
- `src/hooks/useRoomConnection.ts` (novo)
- `src/hooks/index.ts`

---

## Fase 5: Componentes Multiplayer

### TASK-MP-015: Criar estrutura de componentes
- [ ] Criar diretorio `src/components/multiplayer/`
- [ ] Criar `src/components/multiplayer/index.ts` (barrel)

**Arquivos:**
- `src/components/multiplayer/index.ts` (novo)

---

### TASK-MP-016: Criar LobbyScreen
- [ ] Criar `src/components/multiplayer/LobbyScreen.tsx`
- [ ] Implementar view switcher (menu/create/join)
- [ ] Estilizar com visual 8bit consistente

**Arquivos:**
- `src/components/multiplayer/LobbyScreen.tsx` (novo)

---

### TASK-MP-017: Criar CreateRoomForm
- [ ] Criar `src/components/multiplayer/CreateRoomForm.tsx`
- [ ] Input para nome do host
- [ ] Botao para criar sala
- [ ] Loading state durante criacao
- [ ] Tratamento de erros

**Arquivos:**
- `src/components/multiplayer/CreateRoomForm.tsx` (novo)

---

### TASK-MP-018: Criar JoinRoomForm
- [ ] Criar `src/components/multiplayer/JoinRoomForm.tsx`
- [ ] Input para codigo da sala
- [ ] Input para nome do guest
- [ ] Validacao de codigo (6 caracteres alfanumericos)
- [ ] Loading state durante conexao
- [ ] Tratamento de erros

**Arquivos:**
- `src/components/multiplayer/JoinRoomForm.tsx` (novo)

---

### TASK-MP-019: Criar WaitingRoom
- [ ] Criar `src/components/multiplayer/WaitingRoom.tsx`
- [ ] Exibir codigo da sala
- [ ] Botao para copiar codigo
- [ ] Animacao de espera
- [ ] Botao para cancelar

**Arquivos:**
- `src/components/multiplayer/WaitingRoom.tsx` (novo)

---

### TASK-MP-020: Criar RoomCodeDisplay
- [ ] Criar `src/components/multiplayer/RoomCodeDisplay.tsx`
- [ ] Exibir codigo formatado (separado em grupos)
- [ ] Botao de copiar com feedback
- [ ] Estilo visual destacado

**Arquivos:**
- `src/components/multiplayer/RoomCodeDisplay.tsx` (novo)

---

### TASK-MP-021: Criar ConnectionStatus
- [ ] Criar `src/components/multiplayer/ConnectionStatus.tsx`
- [ ] Indicador visual de conexao (verde/amarelo/vermelho)
- [ ] Tooltip com detalhes do status
- [ ] Posicionamento discreto na UI

**Arquivos:**
- `src/components/multiplayer/ConnectionStatus.tsx` (novo)

---

### TASK-MP-022: Criar DisconnectedOverlay
- [ ] Criar `src/components/multiplayer/DisconnectedOverlay.tsx`
- [ ] Overlay fullscreen com fundo escuro
- [ ] Mensagem de aguardando reconexao
- [ ] Countdown de timeout
- [ ] Botao para encerrar partida

**Arquivos:**
- `src/components/multiplayer/DisconnectedOverlay.tsx` (novo)

---

## Fase 6: Integracao com UI Existente

### TASK-MP-023: Atualizar InfoPanel
- [ ] Adicionar selector de modo (Single/Multi)
- [ ] Mostrar `DifficultySelect` apenas em single player
- [ ] Mostrar `LobbyScreen` em multiplayer
- [ ] Ajustar layout para acomodar novos elementos

**Arquivos:**
- `src/components/game/InfoPanel.tsx`

---

### TASK-MP-024: Atualizar App.tsx
- [ ] Importar componentes multiplayer
- [ ] Adicionar logica de roteamento para lobby/waiting
- [ ] Integrar `DisconnectedOverlay` globalmente

**Arquivos:**
- `src/App.tsx`

---

### TASK-MP-025: Atualizar GameBoard
- [ ] Importar `useMultiplayer`
- [ ] Usar `canInteract` para habilitar/desabilitar pills
- [ ] Usar `isLocalTurn` para feedback visual
- [ ] Adicionar `DisconnectedOverlay`

**Arquivos:**
- `src/components/game/GameBoard.tsx`

---

### TASK-MP-026: Atualizar PillPool
- [ ] Aceitar prop `disabled`
- [ ] Aplicar estilo visual quando desabilitado
- [ ] Prevenir clicks quando desabilitado

**Arquivos:**
- `src/components/game/PillPool.tsx`

---

### TASK-MP-027: Atualizar InventoryBar
- [ ] Usar `canInteract` para habilitar/desabilitar itens
- [ ] Feedback visual quando nao pode usar

**Arquivos:**
- `src/components/game/InventoryBar.tsx`

---

### TASK-MP-028: Atualizar TurnIndicator
- [ ] Aceitar prop `showWaitingMessage`
- [ ] Exibir "Aguardando oponente..." quando apropriado
- [ ] Animacao de espera

**Arquivos:**
- `src/components/game/TurnIndicator.tsx`

---

### TASK-MP-029: Atualizar ItemSelectionScreen
- [ ] Usar `useMultiplayer` para determinar interatividade
- [ ] Em multiplayer, ambos jogadores veem mesma tela
- [ ] Feedback quando oponente confirma

**Arquivos:**
- `src/components/game/ItemSelectionScreen.tsx`

---

### TASK-MP-030: Atualizar PillStore
- [ ] Usar `useMultiplayer` para permissoes
- [ ] Sincronizar carrinhos via eventos

**Arquivos:**
- `src/components/game/PillStore.tsx`

---

## Fase 7: Tratamento de Erros e Edge Cases

### TASK-MP-031: Implementar timeout de sala
- [ ] Sala expira apos 5 minutos sem guest
- [ ] Host recebe notificacao
- [ ] Sala e removida automaticamente

**Arquivos:**
- `src/stores/multiplayerStore.ts`
- `src/components/multiplayer/WaitingRoom.tsx`

---

### TASK-MP-032: Implementar desconexao durante jogo
- [ ] Detectar perda de conexao
- [ ] Exibir overlay de reconexao
- [ ] Timeout de 30s para W.O.
- [ ] Cleanup correto de recursos

**Arquivos:**
- `src/stores/multiplayerStore.ts`
- `src/hooks/useRoomConnection.ts`

---

### TASK-MP-033: Implementar validacao de eventos
- [ ] Validar turno correto no receptor
- [ ] Validar dados do evento
- [ ] Log de eventos invalidos
- [ ] Recuperacao graceful

**Arquivos:**
- `src/stores/gameStore.ts` (applyRemoteEvent)

---

### TASK-MP-034: Tratar saida voluntaria
- [ ] Botao de sair durante partida
- [ ] Confirmacao antes de sair
- [ ] Notificar oponente
- [ ] Declarar W.O.

**Arquivos:**
- `src/components/game/GameBoard.tsx`
- `src/stores/multiplayerStore.ts`

---

## Fase 8: Polish e UX

### TASK-MP-035: Adicionar animacoes de transicao
- [ ] Transicao suave lobby -> waiting
- [ ] Transicao waiting -> itemSelection
- [ ] Feedback visual de conexao estabelecida

**Arquivos:**
- Varios componentes multiplayer

---

### TASK-MP-036: Adicionar toasts informativos
- [ ] Toast quando oponente conecta
- [ ] Toast quando oponente confirma selecao
- [ ] Toast quando oponente usa item
- [ ] Toast quando oponente desconecta/reconecta

**Arquivos:**
- `src/stores/multiplayerStore.ts`
- Handlers de eventos

---

### TASK-MP-037: Melhorar responsividade mobile
- [ ] Testar em telas pequenas
- [ ] Ajustar layouts de lobby/waiting
- [ ] Garantir touch targets adequados

**Arquivos:**
- Componentes multiplayer (CSS)

---

## Fase 9: Testes e Verificacao

### TASK-MP-038: Testar fluxo completo single player
- [ ] Verificar que single player continua funcionando
- [ ] IA funciona normalmente
- [ ] Nenhuma regressao

**Verificacao manual**

---

### TASK-MP-039: Testar fluxo criar sala
- [ ] Criar sala
- [ ] Ver codigo gerado
- [ ] Copiar codigo
- [ ] Cancelar sala

**Verificacao manual em 2 browsers**

---

### TASK-MP-040: Testar fluxo entrar em sala
- [ ] Entrar com codigo valido
- [ ] Tentar codigo invalido (erro)
- [ ] Tentar sala cheia (erro)

**Verificacao manual em 2 browsers**

---

### TASK-MP-041: Testar partida completa
- [ ] Selecao de itens sincroniza
- [ ] Turnos alternam corretamente
- [ ] Consumo de pilula sincroniza
- [ ] Uso de item sincroniza
- [ ] Loja sincroniza
- [ ] Fim de jogo sincroniza

**Verificacao manual em 2 browsers**

---

### TASK-MP-042: Testar desconexao
- [ ] Desconexao durante jogo
- [ ] Overlay aparece
- [ ] Reconexao funciona
- [ ] Timeout declara W.O.

**Verificacao manual em 2 browsers**

---

### TASK-MP-043: Verificacao final
- [ ] Build de producao funciona
- [ ] Nenhum erro no console
- [ ] Performance adequada
- [ ] UX fluida

**Verificacao manual**

---

## Resumo de Arquivos

### Novos Arquivos (18)
- `src/services/realtimeService.ts`
- `src/services/index.ts`
- `src/types/multiplayer.ts`
- `src/types/events.ts`
- `src/stores/multiplayerStore.ts`
- `src/hooks/useMultiplayer.ts`
- `src/hooks/useRoomConnection.ts`
- `src/components/multiplayer/index.ts`
- `src/components/multiplayer/LobbyScreen.tsx`
- `src/components/multiplayer/CreateRoomForm.tsx`
- `src/components/multiplayer/JoinRoomForm.tsx`
- `src/components/multiplayer/WaitingRoom.tsx`
- `src/components/multiplayer/RoomCodeDisplay.tsx`
- `src/components/multiplayer/ConnectionStatus.tsx`
- `src/components/multiplayer/DisconnectedOverlay.tsx`
- `.env.example`

### Arquivos Modificados (15)
- `src/types/game.ts`
- `src/types/index.ts`
- `src/utils/constants.ts`
- `src/stores/gameStore.ts`
- `src/hooks/useAIPlayer.ts`
- `src/hooks/useAIItemSelection.ts`
- `src/hooks/useAIStore.ts`
- `src/hooks/index.ts`
- `src/App.tsx`
- `src/components/game/InfoPanel.tsx`
- `src/components/game/GameBoard.tsx`
- `src/components/game/PillPool.tsx`
- `src/components/game/InventoryBar.tsx`
- `src/components/game/TurnIndicator.tsx`
- `src/components/game/ItemSelectionScreen.tsx`
- `src/components/game/PillStore.tsx`
- `package.json`

---

## Ordem de Execucao Recomendada

1. **Infraestrutura:** TASK-MP-001, TASK-MP-002
2. **Types:** TASK-MP-003, TASK-MP-004, TASK-MP-005
3. **Stores:** TASK-MP-006, TASK-MP-007, TASK-MP-008, TASK-MP-009
4. **IA:** TASK-MP-010, TASK-MP-011, TASK-MP-012
5. **Hooks:** TASK-MP-013, TASK-MP-014
6. **Componentes:** TASK-MP-015 a TASK-MP-022
7. **Integracao:** TASK-MP-023 a TASK-MP-030
8. **Edge Cases:** TASK-MP-031 a TASK-MP-034
9. **Polish:** TASK-MP-035 a TASK-MP-037
10. **Testes:** TASK-MP-038 a TASK-MP-043

