# Design: MP-Polish (Multiplayer Polish & Visual Sync)

## Parte 1: Room Exit Refactoring

## Arquitetura Atual

```
+-----------------------------------------------------------------+
|                        FLUXO ATUAL (COM BUG)                    |
+-----------------------------------------------------------------+
|                                                                 |
|  [Jogador clica "Sair"]                                         |
|         |                                                       |
|         v                                                       |
|  ForfeitDialog.handleForfeit()                                  |
|         |                                                       |
|         v                                                       |
|  multiplayerStore.leaveRoom()                                   |
|         |                                                       |
|         +---> sendEvent('player_left', { reason })  <-- SEM ROLE|
|         +---> disconnect()                                      |
|         +---> realtimeService.leave()                           |
|         +---> reset() (multiplayerStore)                        |
|         +---> resetGame() (gameStore) <-- CORRIGIDO RECENTEMENTE|
|                                                                 |
|  [Outro jogador recebe player_left]                             |
|         |                                                       |
|         v                                                       |
|  handleEvent('player_left')                                     |
|         |                                                       |
|         +---> set({ room.status: 'abandoned', error })          |
|                    |                                            |
|                    v                                            |
|              [PROBLEMA: Fica preso, sem UI adequada]            |
|                                                                 |
+-----------------------------------------------------------------+
```

## Arquitetura Proposta

```
+-----------------------------------------------------------------+
|                        FLUXO PROPOSTO                           |
+-----------------------------------------------------------------+
|                                                                 |
|  [Jogador clica "Sair"]                                         |
|         |                                                       |
|         v                                                       |
|  ForfeitDialog.handleForfeit()                                  |
|         |                                                       |
|         v                                                       |
|  multiplayerStore.leaveRoom()                                   |
|         |                                                       |
|         +---> sendEvent('player_left', { reason, role }) <-- COM|
|         +---> disconnect()                                      |
|         +---> realtimeService.leave()                           |
|         +---> reset() (multiplayerStore)                        |
|         +---> resetGame() (gameStore)                           |
|                                                                 |
|  [Outro jogador recebe player_left]                             |
|         |                                                       |
|         v                                                       |
|  handleEvent('player_left')                                     |
|         |                                                       |
|         +--------------+--------------+                         |
|         |              |              |                         |
|    role='host'    role='guest'   sem role                       |
|         |              |         (legado)                       |
|         v              v              v                         |
|   [GUEST ve]     [HOST ve]      [fallback]                      |
|   DisconnectedOverlay  Toast +   status=abandoned               |
|   (hostLeftVoluntarily) WaitingRoom                             |
|         |              |                                        |
|         v              v                                        |
|   Botao volta    Codigo visivel                                 |
|   ao menu        para novo player                               |
|                                                                 |
+-----------------------------------------------------------------+
```

---

## Mudancas em Tipos

### `src/types/events.ts`

**NOTA:** O evento `PlayerLeftEvent` ja existe. Estamos MODIFICANDO o payload.

```typescript
// ANTES (atual)
export interface PlayerLeftEvent extends GameEventBase {
  type: 'player_left'
  payload: {
    reason: 'voluntary' | 'timeout' | 'error'
  }
}

// DEPOIS (modificacao)
export interface PlayerLeftEvent extends GameEventBase {
  type: 'player_left'
  payload: {
    reason: 'voluntary' | 'timeout' | 'error'
    /** Role de quem saiu - host encerra sala, guest libera vaga */
    role?: 'host' | 'guest'  // Opcional para retrocompatibilidade
  }
}
```

---

## Mudancas no Store

### `src/stores/multiplayerStore.ts`

#### 1. Novo campo de estado

```typescript
interface MultiplayerStore extends MultiplayerContext {
  // ... campos existentes ...
  
  /** Flag: host saiu voluntariamente (para UI do guest) */
  hostLeftVoluntarily: boolean
  setHostLeftVoluntarily: (value: boolean) => void
}

// Em initialState
hostLeftVoluntarily: false,
```

#### 2. Modificar `leaveRoom`

```typescript
leaveRoom: async (): Promise<void> => {
  const state = get()

  if (state.room && state.localRole) {
    get().sendEvent({
      type: 'player_left',
      payload: { 
        reason: 'voluntary',
        role: state.localRole,  // NOVO: envia role
      },
    })
  }

  get().disconnect()
  await realtimeService.leave()
  get().reset()
  useGameStore.getState().resetGame()
},
```

#### 3. Modificar handler `player_left`

```typescript
case 'player_left': {
  const leftPayload = payload.payload as { 
    role?: 'host' | 'guest'
    reason?: string 
  }
  const whoLeft = leftPayload?.role

  if (whoLeft === 'host') {
    // HOST SAIU VOLUNTARIAMENTE -> Guest ve overlay especifico
    set({
      room: state.room ? { ...state.room, status: 'abandoned' } : null,
      hostLeftVoluntarily: true,  // Flag para UI
    })
  } else if (whoLeft === 'guest' && state.localRole === 'host') {
    // GUEST SAIU -> Host volta para WaitingRoom
    if (state.room) {
      set({
        room: {
          ...state.room,
          status: 'waiting',
          guestId: null,
          guestName: null,
        },
      })
      // Reseta game para permitir novo jogador
      useGameStore.getState().resetGame()
      
      // Toast informativo
      useToastStore.getState().show({
        type: 'info',  // Tipo correto para mensagem informativa
        message: 'Jogador saiu da sala',
        duration: 3000,
      })
    }
  } else {
    // Fallback para eventos legados (sem role)
    set({
      room: state.room ? { ...state.room, status: 'abandoned' } : null,
      error: 'Oponente saiu da partida',
    })
  }
  break
}
```

---

## Expansao do Componente Existente

### `src/components/multiplayer/DisconnectedOverlay.tsx`

**ABORDAGEM:** Expandir o componente existente para tratar mais um caso, em vez de criar componente novo.

```tsx
export function DisconnectedOverlay() {
  const room = useMultiplayerStore((state) => state.room)
  const localRole = useMultiplayerStore((state) => state.localRole)
  const opponentDisconnected = useOpponentDisconnected()
  const hostLeftVoluntarily = useMultiplayerStore((state) => state.hostLeftVoluntarily)
  const reset = useMultiplayerStore((state) => state.reset)
  const resetGame = useGameStore((state) => state.resetGame)

  const {
    isReconnecting,
    formattedTimeRemaining,
    hasTimedOut,
    forfeit,
  } = useRoomConnection()

  // NOVO CASO: Host saiu voluntariamente (guest ve)
  const isHostLeftVoluntarily = hostLeftVoluntarily && localRole === 'guest'

  // Casos existentes
  const isLocalReconnecting = isReconnecting && room && !hasTimedOut
  const isOpponentDisconnected = opponentDisconnected && room && !hasTimedOut && !isHostLeftVoluntarily
  
  const shouldShow = isLocalReconnecting || isOpponentDisconnected || isHostLeftVoluntarily

  // Handler para voltar ao menu
  const handleBackToMenu = () => {
    reset()
    resetGame()
  }

  // RENDERIZA: Caso host saiu voluntariamente
  if (isHostLeftVoluntarily) {
    return (
      <AnimatePresence>
        <motion.div className="...overlay-styles...">
          <Card>
            <CardContent>
              <DoorClosed className="size-16 text-muted-foreground" />
              <h2>Sala Encerrada</h2>
              <p>O host encerrou a partida.</p>
              <Button onClick={handleBackToMenu}>
                Voltar ao Menu
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  // RENDERIZA: Casos existentes (reconexao/desconexao)
  // ... codigo existente ...
}
```

**Estrutura Visual (Host Saiu):**
```
+--------------------------------------+
|                                      |
|            [Door Icon]               |
|                                      |
|         Sala Encerrada               |
|                                      |
|    O host encerrou a partida.        |
|                                      |
|     +------------------------+       |
|     |    Voltar ao Menu      |       |
|     +------------------------+       |
|                                      |
+--------------------------------------+
```

---

## Fluxo de Estados da Sala

```
                    createRoom()
                         |
                         v
+---------+         +---------+
|  null   | ------> | waiting | <---------------------+
+---------+         +---------+                       |
                         |                            |
                    player_joined                     |
                         |                       guest sai
                         v                       (role='guest')
                    +---------+                       |
                    |  ready  |                       |
                    +---------+                       |
                         |                            |
                    game_started                      |
                         |                            |
                         v                            |
                    +---------+                       |
                    | playing | ----------------------+
                    +---------+
                         |
                    host sai (role='host')
                    ou jogo termina
                         |
                         v
                    +-----------+
                    | abandoned | (guest ve DisconnectedOverlay)
                    | finished  | (jogo normal)
                    +-----------+
```

---

## Codigo Legado a Remover

### Nenhum arquivo a deletar

Apenas modificacoes em arquivos existentes. O novo campo `hostLeftVoluntarily` substitui o uso de `error` como marcador semantico.

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Eventos legados (sem role) | Media | Baixo | Fallback no handler |
| Race condition em saida simultanea | Baixa | Baixo | Cada cliente processa independentemente |
| Overlay nao fecha | Baixa | Alto | Garantir que botao sempre reseta estado |

---

---

## Parte 2: Visual Sync (Feedbacks Visuais)

## Estado Atual dos Feedbacks

| Evento | Jogador Local | Jogador Remoto |
|--------|---------------|----------------|
| `pill_consumed` | PillReveal overlay + Toast | Toast simples |
| `item_used` | ItemEffect overlay + Toast | Toast simples |
| `selection_confirmed` | UI atualiza | Nenhum feedback |
| `round_reset` | NewRound overlay | NewRound overlay (via hook) |

## Melhorias Propostas

### 1. ItemEffectOverlay para Eventos Remotos

**Problema:** Quando oponente usa item, jogador local ve apenas toast.

**Solucao:** Abrir `ItemEffectOverlay` em `applyRemoteEvent` para `item_used`.

```typescript
// Em applyRemoteEvent, case 'item_used':
case 'item_used': {
  // ... validacoes existentes ...
  
  get().executeItem(payload.itemId, payload.targetId)

  // Mostra overlay de item (reutiliza existente)
  if (payload.itemType) {
    const opponentName = state.players[event.playerId]?.name ?? 'Oponente'
    
    // Abre overlay ao inves de apenas toast
    useOverlayStore.getState().openItemEffect(
      payload.itemType,
      `${opponentName} usou`
    )
  }
  break
}
```

**Vantagem:** Reutiliza componente existente, feedback visual rico.

### 2. Toast para Confirmacao de Selecao

**Problema:** Jogador nao sabe quando oponente confirmou itens.

**Solucao:** Toast em `applyRemoteEvent` para `selection_confirmed`.

```typescript
case 'selection_confirmed': {
  // ... logica existente ...
  
  // Toast informativo
  const opponentName = state.players[event.playerId]?.name ?? 'Oponente'
  useToastStore.getState().show({
    type: 'info',
    message: `${opponentName} esta pronto!`,
    duration: 2000,
  })
  break
}
```

### 3. Feedback Visual no Card do Oponente

**Problema:** Quando oponente toma dano/cura, apenas numero muda.

**Solucao:** Trigger de animacao via estado no gameStore.

**Arquitetura:**
```
[Evento remoto recebido]
        |
        v
[gameStore: set({ lastRemoteEffect: { playerId, type, value } })]
        |
        v
[AnimatedPlayerArea: detecta lastRemoteEffect via selector]
        |
        v
[Trigger animacao: shake (dano), glow (cura)]
        |
        v
[Limpa lastRemoteEffect apos animacao]
```

**Novo campo no gameStore:**
```typescript
interface GameState {
  // ... campos existentes ...
  
  /** Ultimo efeito aplicado por evento remoto (para animacao) */
  lastRemoteEffect: {
    playerId: PlayerId
    type: 'damage' | 'heal' | 'collapse'
    value: number
    timestamp: number
  } | null
}
```

### 4. Passagem Correta de showWaitingForOpponent

**Estado Atual:** `TurnIndicator` JA possui prop `showWaitingForOpponent` implementada.

**Ajuste necessario:** Garantir que `GameBoard` passe a prop corretamente em multiplayer.

```tsx
// Em GameBoard.tsx
const { isMultiplayer, localPlayerId } = useMultiplayer()
const isLocalTurn = currentTurn === localPlayerId

<TurnIndicator
  currentPlayer={players[currentTurn]}
  round={round}
  isHumanTurn={isLocalTurn}
  showWaitingForOpponent={isMultiplayer && !isLocalTurn}  // NOVO
/>
```

---

## Fluxo Visual Completo (Proposto)

```
JOGADOR A CONSOME PILL
========================

[A: Clica pill]
      |
      v
[A: PillReveal overlay]  ----evento---->  [B: Recebe pill_consumed]
      |                                          |
      v                                          v
[A: Toast local]                          [B: Toast + animacao no card de A]
      |                                          |
      v                                          v
[A: Turno passa]                          [B: Turno local - "Sua vez!"]


JOGADOR A USA ITEM
==================

[A: Clica item]
      |
      v
[A: ItemEffect overlay]  ----evento---->  [B: Recebe item_used]
      |                                          |
      v                                          v
[A: Efeito aplicado]                      [B: ItemEffect overlay]
      |                                          |
      v                                          v
[A: Continua turno]                       [B: Overlay fecha, aguarda]
```

---

## Testes Manuais Recomendados

### Room Exit
1. **Host sai durante jogo**
   - Guest deve ver overlay (via DisconnectedOverlay expandido)
   - Guest clica voltar -> tela inicial

2. **Guest sai durante jogo**
   - Host ve toast
   - Host volta para WaitingRoom
   - Codigo da sala visivel

3. **Guest sai durante selecao de itens**
   - Mesmo comportamento do cenario 2

4. **Host sai durante WaitingRoom**
   - Nao aplicavel (guest ainda nao entrou)

5. **Reconexao apos saida**
   - Novo guest pode entrar na sala do host

### Visual Sync
6. **Oponente usa item**
   - Deve ver ItemEffectOverlay com nome do oponente
   - Overlay fecha automaticamente

7. **Oponente consome pill**
   - Toast com tipo da pill
   - Animacao no card do oponente

8. **Oponente confirma selecao**
   - Toast "Oponente esta pronto!"

9. **Turno do oponente**
   - TurnIndicator mostra "Aguardando oponente..."

### GameOver & Rematch
10. **Fim de jogo - vencedor**
    - Ve "VENCEDOR!" com trofeu
    - Botoes: "Jogar Novamente" / "Sair"

11. **Fim de jogo - perdedor**
    - Ve "DERROTA!" com icone de skull ou similar
    - Botoes: "Jogar Novamente" / "Sair"

12. **Rematch - primeiro a confirmar**
    - Clica "Jogar Novamente"
    - Ve "Aguardando oponente..."
    - Pode clicar "Cancelar" para voltar

13. **Rematch - segundo jogador**
    - Ve que oponente quer jogar novamente
    - Pode aceitar ou recusar

14. **Rematch - timeout**
    - Se 30s sem resposta, sala encerrada

---

## Parte 3: GameOver & Rematch

## Problema Atual: GameOver Identico

Ambos jogadores veem "VENCEDOR!" porque o `GameOverDialog` usa apenas `winner` sem comparar com `localPlayerId`.

```tsx
// GameOverDialog.tsx atual (problema)
const isHumanWinner = winnerPlayer !== null && !winnerPlayer.isAI
// Em multiplayer, ambos sao humanos, entao sempre true
```

## Solucao: Contextualizar por Jogador

```tsx
// GameOverDialog.tsx corrigido
import { useMultiplayer } from '@/hooks'

const { isMultiplayer, localPlayerId } = useMultiplayer()

// Determina se jogador local venceu
const isLocalWinner = isMultiplayer 
  ? winner === localPlayerId 
  : !winnerPlayer?.isAI  // Single player: humano ganhou se winner nao e IA

return (
  <>
    {isLocalWinner ? (
      <>
        <Trophy className="text-yellow-500" />
        <h2>VENCEDOR!</h2>
      </>
    ) : (
      <>
        <Skull className="text-red-500" />
        <h2>DERROTA!</h2>
      </>
    )}
    <p>Vencedor: {players[winner].name}</p>
  </>
)
```

---

## Fluxo de Rematch

### Novos Eventos

```typescript
// types/events.ts - ADICIONAR ao union existente

export interface RematchRequestedEvent extends GameEventBase {
  type: 'rematch_requested'
  payload: Record<string, never>  // Payload vazio
}

export interface RematchAcceptedEvent extends GameEventBase {
  type: 'rematch_accepted'
  payload: Record<string, never>
}

export interface RematchDeclinedEvent extends GameEventBase {
  type: 'rematch_declined'
  payload: Record<string, never>
}

// Adicionar ao GameEventType union
export type GameEventType =
  | // ... existentes ...
  | 'rematch_requested'
  | 'rematch_accepted'
  | 'rematch_declined'

// Adicionar ao GameEvent union
export type GameEvent =
  | // ... existentes ...
  | RematchRequestedEvent
  | RematchAcceptedEvent
  | RematchDeclinedEvent
```

### Estado no Store

```typescript
// multiplayerStore.ts

interface RematchState {
  localWants: boolean
  remoteWants: boolean
  declined: boolean
}

interface MultiplayerStore {
  // ... campos existentes ...
  
  /** Estado de rematch */
  rematchState: RematchState
  
  // Actions
  requestRematch: () => void
  declineRematch: () => void
  resetRematchState: () => void
}

// Em initialState
rematchState: {
  localWants: false,
  remoteWants: false,
  declined: false,
}
```

### Diagrama de Estados

```
+----------------------------------------------------------------+
|                     FLUXO DE REMATCH                           |
+----------------------------------------------------------------+
|                                                                |
|  [GameOver exibido]                                            |
|         |                                                      |
|         +---> [Jogador A clica "Jogar Novamente"]              |
|         |           |                                          |
|         |           v                                          |
|         |    [A: localWants = true]                            |
|         |    [A: Envia rematch_requested]                      |
|         |    [A: UI "Aguardando oponente..."]                  |
|         |           |                                          |
|         |           v                                          |
|         |    [B: Recebe rematch_requested]                     |
|         |    [B: remoteWants = true]                           |
|         |    [B: UI mostra "Oponente quer revanche"]           |
|         |           |                                          |
|         |           +---> [B clica "Jogar Novamente"]          |
|         |           |           |                              |
|         |           |           v                              |
|         |           |    [B: localWants = true]                |
|         |           |    [B: Envia rematch_accepted]           |
|         |           |           |                              |
|         |           |           v                              |
|         |           |    [AMBOS: Nova partida inicia]          |
|         |           |                                          |
|         |           +---> [B clica "Sair"]                     |
|         |                       |                              |
|         |                       v                              |
|         |                [B: Envia rematch_declined]           |
|         |                [B: Volta ao menu]                    |
|         |                       |                              |
|         |                       v                              |
|         |                [A: Recebe declined]                  |
|         |                [A: Volta ao menu]                    |
|         |                                                      |
|         +---> [Jogador A clica "Sair"]                         |
|                     |                                          |
|                     v                                          |
|              [A: Envia rematch_declined]                       |
|              [A: Volta ao menu]                                |
|              [B: Recebe declined, volta ao menu]               |
|                                                                |
+----------------------------------------------------------------+
```

### UI do GameOverDialog (Multiplayer)

```
ESTADO: Inicial (multiplayer)
+-------------------------------------+
|                                     |
|            [Trophy/Skull]           |
|                                     |
|         VENCEDOR! / DERROTA!        |
|                                     |
|          Vencedor: PlayerName       |
|                                     |
|  +-----------+-----------------+    |
|  |   RODADAS |      PILULAS    |    |
|  |      6    |        35       |    |
|  +-----------+-----------------+    |
|                                     |
|  +-------------------------------+  |
|  |      Jogar Novamente          |  |  <-- Verde
|  +-------------------------------+  |
|  +-------------------------------+  |
|  |           Sair                |  |  <-- Outline
|  +-------------------------------+  |
|                                     |
+-------------------------------------+


ESTADO: Aguardando Oponente
+-------------------------------------+
|                                     |
|            [Trophy/Skull]           |
|                                     |
|         VENCEDOR! / DERROTA!        |
|                                     |
|        Aguardando oponente...       |
|             [Spinner]               |
|                                     |
|            Tempo: 0:25              |
|                                     |
|  +-------------------------------+  |
|  |          Cancelar             |  |
|  +-------------------------------+  |
|                                     |
+-------------------------------------+


ESTADO: Oponente quer revanche
+-------------------------------------+
|                                     |
|            [Trophy/Skull]           |
|                                     |
|         VENCEDOR! / DERROTA!        |
|                                     |
|     Oponente quer jogar novamente!  |
|                                     |
|  +-------------------------------+  |
|  |        Aceitar Revanche       |  |
|  +-------------------------------+  |
|  +-------------------------------+  |
|  |           Recusar             |  |
|  +-------------------------------+  |
|                                     |
+-------------------------------------+
```

---

## Implementacao de Nova Partida (Rematch)

```typescript
// Em multiplayerStore.ts - handler de rematch_accepted

case 'rematch_accepted': {
  const state = get()
  
  // Ambos concordaram - inicia nova partida
  if (state.rematchState.localWants) {
    // Reseta estado de rematch
    set({
      rematchState: { localWants: false, remoteWants: false, declined: false },
    })
    
    // Host inicia novo jogo e sincroniza
    if (state.localRole === 'host' && state.room) {
      const gameStore = useGameStore.getState()
      gameStore.initGame({
        mode: 'multiplayer',
        roomId: state.room.id,
        player1: { name: state.room.hostName, isAI: false },
        player2: { name: state.room.guestName ?? 'Guest', isAI: false },
      })
      
      // Sincroniza com guest
      const { pillPool, shapeQuests } = useGameStore.getState()
      get().sendEvent({
        type: 'game_started',
        payload: {
          hostName: state.room.hostName,
          guestName: state.room.guestName,
          syncData: { pillPool, shapeQuests },
        },
      })
    }
  }
  break
}
```

---

## Timeout de Rematch

```tsx
// Em GameOverDialog.tsx
const REMATCH_TIMEOUT = 30000 // 30 segundos

useEffect(() => {
  // Inicia timer quando localWants = true
  if (rematchState.localWants && !rematchState.remoteWants) {
    const timer = setTimeout(() => {
      declineRematch() // Timeout - volta ao menu
    }, REMATCH_TIMEOUT)
    
    return () => clearTimeout(timer)
  }
}, [rematchState.localWants, rematchState.remoteWants, declineRematch])

// Exibir countdown
const [timeLeft, setTimeLeft] = useState(REMATCH_TIMEOUT / 1000)

useEffect(() => {
  if (rematchState.localWants && !rematchState.remoteWants) {
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(interval)
  } else {
    setTimeLeft(REMATCH_TIMEOUT / 1000)
  }
}, [rematchState.localWants, rematchState.remoteWants])
```

---

## Backlog (Fase Futura)

A **Parte 4: Sistema de Reconexao** foi movida para implementacao futura. Inclui:

- Persistencia de sala em localStorage com TTL
- Reconexao automatica ao recarregar pagina
- ReconnectionScreen para UI de reconexao
- Presence tracking customizado
- Heartbeat de conexao

O sistema atual (`DisconnectedOverlay` com countdown de 60s via Supabase Presence) ja cobre adequadamente o cenario de desconexao abrupta.
