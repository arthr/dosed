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
- [x] Criar `src/types/multiplayer.ts`
- [x] Definir `GameMode`, `RoomStatus`, `LocalRole`
- [x] Definir `Room`, `MultiplayerContext`
- [x] Definir `ConnectionStatus`
- [x] Atualizar `src/types/index.ts` com exports

**Arquivos:**
- `src/types/multiplayer.ts` (criado)
- `src/types/index.ts` (atualizado)

---

### TASK-MP-004: Criar types de eventos
- [x] Criar `src/types/events.ts`
- [x] Definir `GameEventType`, `GameEventBase`
- [x] Definir eventos especificos (PillConsumedEvent, ItemUsedEvent, etc)
- [x] Definir union `GameEvent`
- [x] Atualizar `src/types/index.ts` com exports

**Arquivos:**
- `src/types/events.ts` (criado)
- `src/types/index.ts` (atualizado)

---

### TASK-MP-005: Atualizar GameConfig e GameState
- [x] Adicionar `mode: GameMode` em `GameConfig`
- [x] Adicionar `roomId?: string` em `GameConfig`
- [x] Adicionar `mode: GameMode` em `GameState`
- [x] Adicionar `roomId: string | null` em `GameState`
- [x] Atualizar `DEFAULT_GAME_CONFIG` em constants.ts

**Arquivos:**
- `src/types/game.ts` (atualizado)
- `src/utils/constants.ts` (atualizado)

---

### TASK-MP-006: Criar multiplayerStore
- [x] Criar `src/stores/multiplayerStore.ts`
- [x] Implementar estado inicial
- [x] Implementar `createRoom()` - chama realtimeService
- [x] Implementar `joinRoom()` - valida e conecta
- [x] Implementar `leaveRoom()` - notifica e desconecta
- [x] Implementar `sendEvent()` - emite via WebSocket
- [x] Implementar `handleEvent()` - aplica no gameStore
- [x] Implementar helpers: `connect()`, `disconnect()`, `reset()`

**Arquivos:**
- `src/stores/multiplayerStore.ts` (criado)

---

## Fase 2: Integracao com gameStore

### TASK-MP-007: Adicionar modo ao estado inicial
- [x] Adicionar `mode: 'single_player'` em `initialState`
- [x] Adicionar `roomId: null` em `initialState`
- [x] Atualizar `initGame()` para aceitar `mode` e `roomId`
- [x] Atualizar `resetGame()` para resetar `mode` e `roomId` (usa initialState que ja tem os valores)

**Arquivos:**
- `src/stores/gameStore.ts` (atualizado)

---

### TASK-MP-008: Criar mecanismo de sincronizacao
- [x] Adicionar flag `isSyncingFromRemote` (module-level)
- [x] Criar helper `setSyncingFromRemote()`
- [x] Criar action `applyRemoteEvent()`
- [x] Implementar switch para cada tipo de evento

**Arquivos:**
- `src/stores/gameStore.ts` (atualizado)

---

### TASK-MP-009: Modificar actions para emitir eventos
- [x] Modificar `consumePill()` - emite `pill_consumed`
- [x] Modificar `executeItem()` - emite `item_used`
- [x] Modificar `selectItem()` - emite `item_selected`
- [x] Modificar `deselectItem()` - emite `item_deselected`
- [x] Modificar `confirmItemSelection()` - emite `selection_confirmed`
- [x] Modificar `toggleWantsStore()` - emite `wants_store_toggled`
- [x] Modificar `addToCart()` - emite `cart_updated` (add)
- [x] Modificar `removeFromCart()` - emite `cart_updated` (remove)
- [x] Modificar `confirmStorePurchases()` - emite `store_confirmed`

**Arquivos:**
- `src/stores/gameStore.ts` (atualizado com emitMultiplayerEvent helper)

---

## Fase 3: Condicionar IA

### TASK-MP-010: Condicionar useAIPlayer
- [x] Importar `useGameStore` para obter `mode`
- [x] Adicionar early return se `mode === 'multiplayer'`
- [x] Garantir que nenhum timer e criado em multiplayer

**Arquivos:**
- `src/hooks/useAIPlayer.ts` (atualizado - recebe mode como prop)

---

### TASK-MP-011: Condicionar useAIItemSelection
- [x] Importar `useGameStore` para obter `mode`
- [x] Adicionar early return se `mode === 'multiplayer'`

**Arquivos:**
- `src/hooks/useAIItemSelection.ts` (atualizado)

---

### TASK-MP-012: Condicionar useAIStore
- [x] Importar `useGameStore` para obter `mode`
- [x] Adicionar early return se `mode === 'multiplayer'`

**Arquivos:**
- `src/hooks/useAIStore.ts` (atualizado)

---

## Fase 4: Hooks Multiplayer

### TASK-MP-013: Criar useMultiplayer
- [x] Criar `src/hooks/useMultiplayer.ts`
- [x] Implementar `isLocalTurn` - verifica se turno do jogador local
- [x] Implementar `canInteract` - turno local + fase correta
- [x] Re-exportar estado relevante do multiplayerStore

**Arquivos:**
- `src/hooks/useMultiplayer.ts` (criado)
- `src/hooks/index.ts` (atualizado)

---

### TASK-MP-014: Criar useRoomConnection
- [x] Criar `src/hooks/useRoomConnection.ts`
- [x] Implementar reconexao automatica
- [x] Implementar countdown de timeout (60s para W.O.)
- [x] Cleanup ao desmontar

**Arquivos:**
- `src/hooks/useRoomConnection.ts` (criado)
- `src/hooks/index.ts` (atualizado)

---

## Fase 5: Componentes Multiplayer

### TASK-MP-015: Criar estrutura de componentes
- [x] Criar diretorio `src/components/multiplayer/`
- [x] Criar `src/components/multiplayer/index.ts` (barrel)

**Arquivos:**
- `src/components/multiplayer/index.ts` (criado, atualizado com exports)

---

### TASK-MP-016: Criar LobbyScreen
- [x] Criar `src/components/multiplayer/LobbyScreen.tsx`
- [x] Implementar view switcher (menu/create/join)
- [x] Estilizar com visual 8bit consistente

**Arquivos:**
- `src/components/multiplayer/LobbyScreen.tsx` (criado)

---

### TASK-MP-017: Criar CreateRoomForm
- [x] Criar `src/components/multiplayer/CreateRoomForm.tsx`
- [x] Input para nome do host
- [x] Botao para criar sala
- [x] Loading state durante criacao
- [x] Tratamento de erros

**Arquivos:**
- `src/components/multiplayer/CreateRoomForm.tsx` (criado)

---

### TASK-MP-018: Criar JoinRoomForm
- [x] Criar `src/components/multiplayer/JoinRoomForm.tsx`
- [x] Input para codigo da sala
- [x] Input para nome do guest
- [x] Validacao de codigo (6 caracteres alfanumericos)
- [x] Loading state durante conexao
- [x] Tratamento de erros

**Arquivos:**
- `src/components/multiplayer/JoinRoomForm.tsx` (criado)

---

### TASK-MP-019: Criar WaitingRoom
- [x] Criar `src/components/multiplayer/WaitingRoom.tsx`
- [x] Exibir codigo da sala
- [x] Botao para copiar codigo
- [x] Animacao de espera
- [x] Botao para cancelar

**Arquivos:**
- `src/components/multiplayer/WaitingRoom.tsx` (criado)
- `src/components/multiplayer/index.ts` (atualizado)

---

### TASK-MP-020: Criar RoomCodeDisplay
- [x] ~~Criar `src/components/multiplayer/RoomCodeDisplay.tsx`~~ (incorporado em WaitingRoom)
- [x] Exibir codigo formatado (separado em grupos)
- [x] Botao de copiar com feedback
- [x] Estilo visual destacado

**Arquivos:**
- Incorporado em `src/components/multiplayer/WaitingRoom.tsx` (TASK-MP-019)

---

### TASK-MP-021: Criar ConnectionStatus
- [x] Criar `src/components/multiplayer/ConnectionStatus.tsx`
- [x] Indicador visual de conexao (verde/amarelo/vermelho)
- [x] Tooltip com detalhes do status
- [x] Posicionamento discreto na UI

**Arquivos:**
- `src/components/multiplayer/ConnectionStatus.tsx` (criado)
- `src/components/multiplayer/index.ts` (atualizado)

---

### TASK-MP-022: Criar DisconnectedOverlay
- [x] Criar `src/components/multiplayer/DisconnectedOverlay.tsx`
- [x] Overlay fullscreen com fundo escuro
- [x] Mensagem de aguardando reconexao
- [x] Countdown de timeout
- [x] Botao para encerrar partida

**Arquivos:**
- `src/components/multiplayer/DisconnectedOverlay.tsx` (criado)
- `src/components/multiplayer/index.ts` (atualizado)

---

## Fase 6: Integracao com UI Existente

### TASK-MP-023: Atualizar InfoPanel
- [x] Adicionar selector de modo (Single/Multi)
- [x] Mostrar `DifficultySelect` apenas em single player
- [x] Mostrar `LobbyScreen` em multiplayer
- [x] Ajustar layout para acomodar novos elementos

**Arquivos:**
- `src/App.tsx` (atualizado - selector de modo na tela setup)

---

### TASK-MP-024: Atualizar App.tsx
- [x] Importar componentes multiplayer
- [x] Adicionar logica de roteamento para lobby/waiting
- [x] Integrar `DisconnectedOverlay` globalmente

**Arquivos:**
- `src/App.tsx` (atualizado)

---

### TASK-MP-025: Atualizar GameBoard
- [x] Importar `useMultiplayer`
- [x] Usar `canInteract` para habilitar/desabilitar pills
- [x] Usar `isLocalTurn` para feedback visual
- [x] ~~Adicionar `DisconnectedOverlay`~~ (movido para App.tsx global)

**Arquivos:**
- `src/components/game/GameBoard.tsx` (atualizado)

---

### TASK-MP-026: Atualizar PillPool
- [x] Aceitar prop `disabled` (ja existia)
- [x] Aplicar estilo visual quando desabilitado (ja existia)
- [x] Prevenir clicks quando desabilitado (ja existia)

**Arquivos:**
- `src/components/game/PillPool.tsx` (sem alteracoes - ja implementado)

---

### TASK-MP-027: Atualizar InventoryBar
- [x] Usar `canInteract` para habilitar/desabilitar itens (via AnimatedPlayerArea.isCurrentTurn)
- [x] Feedback visual quando nao pode usar (ja implementado via prop disabled)

**Arquivos:**
- `src/components/game/InventoryBar.tsx` (sem alteracoes - ja implementado)
- `src/components/game/AnimatedPlayerArea.tsx` (ja usa isCurrentTurn para desabilitar)

---

### TASK-MP-028: Atualizar TurnIndicator
- [x] Aceitar prop `showWaitingForOpponent`
- [x] Exibir "Aguardando oponente..." quando apropriado
- [x] Animacao de espera (reutiliza animacao pulse existente)

**Arquivos:**
- `src/components/game/TurnIndicator.tsx` (atualizado)
- `src/components/game/GameBoard.tsx` (passa showWaitingForOpponent)

---

### TASK-MP-029: Atualizar ItemSelectionScreen
- [x] Usar `useMultiplayer` para determinar interatividade
- [x] Em multiplayer, ambos jogadores veem mesma tela
- [x] Feedback quando oponente confirma
- [x] Usar `localPlayerId` dinamicamente em vez de hardcoded 'player1'
- [x] Exibir nome do oponente real em vez de "IA" em multiplayer

**Arquivos:**
- `src/components/game/ItemSelectionScreen.tsx` (atualizado)

---

### TASK-MP-030: Atualizar PillStore
- [x] Usar `useMultiplayer` para permissoes (via OverlayManager)
- [x] Sincronizar carrinhos via eventos (ja implementado em gameStore)
- [x] Usar `localPlayerId` dinamicamente em vez de logica hardcoded

**Arquivos:**
- `src/components/overlays/OverlayManager.tsx` (atualizado - usa localPlayerId)
- `src/components/game/PillStore.tsx` (sem alteracoes - ja recebia playerId como prop)

---

## Fase 7: Tratamento de Erros e Edge Cases

### TASK-MP-031: Implementar timeout de sala
- [x] Sala expira apos 5 minutos sem guest
- [x] Host recebe notificacao (aviso visual quando < 1 min)
- [x] Sala e removida automaticamente (auto-sai ao expirar)
- [x] Timer visual com countdown

**Arquivos:**
- `src/components/multiplayer/WaitingRoom.tsx` (atualizado - timer de expiracao)

---

### TASK-MP-032: Implementar desconexao durante jogo
- [x] Detectar perda de conexao (local e oponente)
- [x] Exibir overlay de reconexao (diferencia local vs oponente)
- [x] Timeout de 60s para W.O. (ja implementado)
- [x] Cleanup correto de recursos (ja implementado)
- [x] Emitir eventos player_disconnected/player_reconnected
- [x] Estado opponentDisconnected no store

**Arquivos:**
- `src/stores/multiplayerStore.ts` (atualizado - opponentDisconnected, emissao de eventos)
- `src/components/multiplayer/DisconnectedOverlay.tsx` (atualizado - suporte a ambos casos)
- `src/hooks/useRoomConnection.ts` (sem alteracoes - ja estava completo)

---

### TASK-MP-033: Implementar validacao de eventos
- [x] Validar turno correto no receptor
- [x] Validar dados do evento (pillId, itemId, fase)
- [x] Log de eventos invalidos (detalhado com contexto)
- [x] Recuperacao graceful (try/catch, nao crasha)

**Arquivos:**
- `src/stores/gameStore.ts` (applyRemoteEvent - refatorado com validacoes)

---

### TASK-MP-034: Tratar saida voluntaria
- [x] Botao de sair durante partida (icone discreto no canto)
- [x] Confirmacao antes de sair (ForfeitDialog)
- [x] Notificar oponente (via leaveRoom que emite player_left)
- [x] Declarar W.O. (oponente recebe evento e processa)

**Arquivos:**
- `src/components/multiplayer/ForfeitDialog.tsx` (criado)
- `src/components/multiplayer/index.ts` (atualizado)
- `src/components/game/GameBoard.tsx` (atualizado - botao + dialog)

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

## Hotfixes da Revisao

### HOTFIX-MP-001: Corrigir inicio automatico do jogo
- [x] Adicionar transicao automatica waiting -> itemSelection quando guest entra
- [x] Host inicia jogo e emite `game_started` apos `player_joined`
- [x] Guest sincroniza config e inicia jogo ao receber `game_started`
- [x] Adicionar tela de transicao "Iniciando partida..." em App.tsx

**Arquivos:**
- `src/stores/multiplayerStore.ts` (handleEvent player_joined e game_started)
- `src/App.tsx` (tela de transicao para status 'ready')

---

### HOTFIX-MP-002: Extrair validacao de nome (DRY)
- [x] Criar funcao `validatePlayerName` em `src/lib/utils.ts`
- [x] Atualizar `CreateRoomForm.tsx` para usar funcao
- [x] Atualizar `JoinRoomForm.tsx` para usar funcao

**Arquivos:**
- `src/lib/utils.ts` (nova funcao)
- `src/components/multiplayer/CreateRoomForm.tsx`
- `src/components/multiplayer/JoinRoomForm.tsx`

---

### HOTFIX-MP-003: Melhorar tratamento de erros em emitMultiplayerEvent
- [x] Refatorar funcao para ser sincrona com agendamento async
- [x] Adicionar tratamento de erro com log detalhado

**Arquivos:**
- `src/stores/gameStore.ts` (emitMultiplayerEvent)

---

### HOTFIX-MP-004: Sincronizar pillPool e quests entre clientes
- [x] Adicionar tipo `SyncData` em `src/types/game.ts`
- [x] Modificar `GameConfig` para aceitar `syncData` opcional
- [x] Host envia `syncData` (pillPool + shapeQuests) em `game_started`
- [x] Guest usa `syncData` recebido em `initGame`
- [x] Adicionar logs de debug para diagnostico de sincronia
- [x] Corrigir `confirmItemSelection` para NAO regenerar pool (reutiliza existente)

**Arquivos:**
- `src/types/game.ts` (SyncData, GameConfig)
- `src/types/index.ts` (export SyncData)
- `src/stores/gameStore.ts` (initGame com syncData, confirmItemSelection sem regenerar)
- `src/stores/multiplayerStore.ts` (handleEvent game_started e player_joined)

---

### HOTFIX-MP-005: Corrigir perspectiva de UI para jogador local
- [x] Jogador local sempre exibido a esquerda (posicao "player1" visual)
- [x] Oponente sempre exibido a direita (posicao "player2" visual)
- [x] Usar `localPlayerId` do multiplayerStore para determinar perspectiva
- [x] Manter compatibilidade com single player (player1 = local)

**Arquivos:**
- `src/components/game/GameBoard.tsx` (perspectiva local/remote)

---

### HOTFIX-MP-006: Sincronizar novas rodadas (round_reset)
- [x] Adicionar evento `round_reset` com syncData (pillPool + shapeQuests)
- [x] Host gera dados e emite evento `round_reset` para guest
- [x] Guest aguarda evento ao inves de gerar dados localmente
- [x] Handler em multiplayerStore para `round_reset`
- [x] Modificar `checkAndStartShopping` para verificar role
- [x] Modificar `checkShoppingComplete` para verificar role

**Arquivos:**
- `src/stores/gameStore.ts` (resetRound com syncData, checkAndStart*, checkShoppingComplete)
- `src/stores/multiplayerStore.ts` (handler round_reset)

---

### HOTFIX-MP-007: Sincronizar IDs de itens e relaxar validacao de turno
- [x] Incluir `itemId` no evento `item_selected` para sincronizar IDs entre clientes
- [x] Modificar `selectItem` para aceitar `itemId` opcional (usado em eventos remotos)
- [x] Atualizar interface `GameStore.selectItem` com parametro opcional
- [x] Atualizar `applyRemoteEvent` para passar `itemId` ao `selectItem`
- [x] Substituir `validateTurn()` por `warnIfWrongTurn()` (apenas log, nao rejeita)
- [x] Evitar dessincronizacao por rejeicao de eventos em race conditions

**Problema resolvido:**
Itens tinham IDs gerados localmente com `uuidv4()`, resultando em IDs diferentes
entre host e guest. Eventos `item_deselected` e `item_used` falhavam por nao
encontrar o item com ID correto no cliente remoto.

**Arquivos:**
- `src/types/events.ts` (ItemSelectedEvent.payload.itemId)
- `src/stores/gameStore.ts` (selectItem, interface, applyRemoteEvent)

---

### HOTFIX-MP-008: Feedback visual para eventos remotos (Opcao C - Hibrido)
- [x] Adicionar tipo `PillEffectType` em events.ts
- [x] Expandir `PillConsumedEvent.payload.feedback` com dados visuais
- [x] Expandir `ItemUsedEvent.payload.itemType` para identificacao
- [x] Calcular dados de feedback antes de emitir `pill_consumed`
- [x] Incluir `itemType` na emissao de `item_used`
- [x] Mostrar toast informativo em `applyRemoteEvent` para `pill_consumed`
- [x] Mostrar toast informativo em `applyRemoteEvent` para `item_used`

**Problema resolvido:**
Jogador remoto nao recebia feedback visual quando oponente consumia pills ou
usava itens. Agora, toasts informativos sao exibidos com mensagem contextualizada
(ex: "Oponente tomou dano", "Oponente usou Scanner").

**Filosofia da solucao (Opcao C - Hibrido):**
- Animacoes bloqueantes (overlays) apenas para quem executa a acao
- Feedback informativo (toasts) para quem observa
- Mantem fluidez sem sacrificar informacao

**Arquivos:**
- `src/types/events.ts` (PillEffectType, PillConsumedEvent, ItemUsedEvent)
- `src/stores/gameStore.ts` (consumePill, executeItem, applyRemoteEvent)

---

### HOTFIX-MP-009: Sincronizar IDs de itens comprados na Pill Store
- [x] Modificar `processCart` para aceitar `itemIds` opcional e retornar IDs gerados
- [x] Modificar `confirmStorePurchases` para capturar IDs e incluir no evento
- [x] Modificar `applyRemoteEvent` para passar `itemIds` ao processar `store_confirmed`
- [x] Atualizar `StoreConfirmedEvent` em events.ts com campo `itemIds` no payload
- [x] Atualizar interface `GameStore` com novos tipos de parametros/retorno

**Problema resolvido:**
Itens comprados na Pill Store (`shape_bomb`, `shape_scanner` e outros power-ups)
geravam IDs diferentes em cada cliente. Quando Host usava um item comprado, o
evento `item_used` falhava no Guest porque o ID nao correspondia.

**Fluxo corrigido:**
1. Host processa carrinho -> gera IDs -> emite `store_confirmed` com `itemIds`
2. Guest recebe evento -> passa `itemIds` para `processCart` -> usa mesmos IDs
3. Itens ficam sincronizados -> eventos `item_used` funcionam corretamente

**Arquivos:**
- `src/types/events.ts` (StoreConfirmedEvent.payload.itemIds)
- `src/stores/gameStore.ts` (processCart, confirmStorePurchases, applyRemoteEvent)

---

### HOTFIX-MP-010: Sincronizar estado apos reconexao do oponente
- [x] Adicionar evento `state_sync` ao `GameEventType` em events.ts
- [x] Criar interface `StateSyncEvent` com payload de estado completo
- [x] Atualizar union `GameEvent` com novo tipo
- [x] Modificar handler `player_reconnected` para enviar estado se for host
- [x] Adicionar handler `state_sync` para guest aplicar estado sincronizado

**Problema resolvido:**
Apos reconexao do guest, ambos jogadores viam "aguardando oponente" mesmo quando
era turno de alguem. Isso acontecia porque o guest perdia eventos enquanto estava
desconectado e o estado de turno ficava dessincronizado.

**Fluxo corrigido:**
1. Guest desconecta temporariamente
2. Guest reconecta -> emite `player_reconnected`
3. Host recebe `player_reconnected` -> envia `state_sync` com estado atual
4. Guest recebe `state_sync` -> aplica estado (currentTurn, phase, pillPool, etc)
5. Ambos clientes ficam sincronizados novamente

**Arquivos:**
- `src/types/events.ts` (state_sync, StateSyncEvent, GameEvent union)
- `src/stores/multiplayerStore.ts` (handlers player_reconnected, state_sync)

---

### HOTFIX-MP-011: Sistema de heartbeat para detectar desconexao do oponente
- [x] Adicionar evento `heartbeat` ao `GameEventType` em events.ts
- [x] Adicionar estado e funcoes de heartbeat no multiplayerStore
- [x] Implementar `startHeartbeat()` - envia heartbeat a cada 5s e verifica timeout
- [x] Implementar `stopHeartbeat()` - limpa intervalos
- [x] Handler `heartbeat` atualiza timestamp e reseta flag se estava desconectado
- [x] Iniciar heartbeat apos `game_started` para ambos os jogadores
- [x] Parar heartbeat em `leaveRoom()` e `reset()`

**Problema resolvido:**
Quando oponente desconecta abruptamente (fechou browser, perdeu internet), o evento
`player_disconnected` pode nao ser enviado porque a conexao ja caiu. O host nao
saberia que o guest desconectou.

**Solucao:**
Sistema de heartbeat onde cada cliente envia pulso a cada 5 segundos. Se nao receber
heartbeat do oponente por 15 segundos, considera desconectado e exibe overlay.

**Configuracao:**
- `HEARTBEAT_INTERVAL_MS = 5000` - envia heartbeat a cada 5s
- `HEARTBEAT_TIMEOUT_MS = 15000` - considera desconectado apos 15s sem heartbeat

**Arquivos:**
- `src/types/events.ts` (heartbeat event type)
- `src/stores/multiplayerStore.ts` (heartbeat system, handlers)

---

### HOTFIX-MP-012: Corrigir reinicio indevido do jogo apos reconexao do guest
- [x] Adicionar guard no handler `player_joined` para verificar se jogo esta em andamento
- [x] Enviar `state_sync` automaticamente quando guest tenta entrar em jogo ja iniciado
- [x] Melhorar validacao do payload no handler `state_sync` com logs detalhados
- [x] Aplicar estado sincronizado de forma condicional (evitar sobrescrever com undefined)
- [x] **FIX:** Host iniciar heartbeat apos enviar `game_started` (nao no handler que ele ignora)
- [x] **FIX:** Incluir `mode` e `roomId` no payload de `state_sync` para restaurar emissao de eventos

**Problema resolvido:**
Apos reconexao do guest, o host recebia evento `player_joined` e chamava `initGame()` sem
verificar se ja havia um jogo em andamento. Isso resetava o estado do jogo e enviava ambos
os jogadores de volta para a tela de selecao de itens.

**Causa raiz:**
O handler de `player_joined` nao tinha guard para verificar `room.status` ou `gamePhase`
antes de reiniciar o jogo. Reconexoes do WebSocket podiam disparar eventos que eram
tratados como novas entradas na sala.

**Bug adicional encontrado (heartbeat):**
O Host nunca iniciava o sistema de heartbeat porque:
- Host envia `game_started` no handler de `player_joined`
- O evento `game_started` e ignorado pelo Host (filtro de eventos proprios)
- O `startHeartbeat()` so era chamado no handler de `game_started`
- Resultado: Guest enviava heartbeats, Host nao enviava, Guest considerava Host desconectado

**Bug adicional encontrado (state_sync incompleto):**
Apos Guest reconectar (ex: recarregar pagina), eventos de gameplay nao eram sincronizados:
- Guest recarrega pagina -> `gameStore.mode` reseta para `'single_player'`
- Host envia `state_sync` mas sem `mode` e `roomId`
- Guest aplica `state_sync` mas `mode` continua `'single_player'`
- `emitMultiplayerEvent` verifica `if (mode !== 'multiplayer')` e nao emite eventos
- Resultado: jogadas do Guest nao eram enviadas ao Host

**Solucao:**
1. Guard no handler `player_joined`:
   - Verifica se `room.status === 'playing'` ou `gamePhase` indica jogo em andamento
   - Se jogo em andamento, ignora reinicio e envia `state_sync` para sincronizar guest

2. Validacao robusta no handler `state_sync`:
   - Verifica se payload existe e e objeto valido
   - Verifica campos obrigatorios (`phase`, `currentTurn`)
   - Logs detalhados antes e depois da aplicacao
   - Spread condicional para evitar sobrescrever com undefined

3. Host inicia heartbeat no local correto:
   - `startHeartbeat()` chamado apos Host enviar `game_started`
   - Nao depende mais do handler `game_started` que o Host ignora

4. `state_sync` inclui `mode` e `roomId`:
   - Campos adicionados ao payload de `state_sync`
   - Guest restaura `mode: 'multiplayer'` apos reconexao
   - Eventos de gameplay voltam a ser emitidos corretamente

**Arquivos:**
- `src/stores/multiplayerStore.ts` (handlers player_joined, state_sync, heartbeat)
- `src/types/events.ts` (StateSyncEvent payload atualizado)

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

