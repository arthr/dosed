# Tarefas: MP-Polish (Multiplayer Polish & Visual Sync)

## Resumo

Polimento completo do modo multiplayer em tres frentes:
1. **Room Exit**: Refatoracao do sistema de saida de sala
2. **Visual Sync**: Sincronizacao de feedbacks visuais
3. **GameOver & Rematch**: Tela de fim de jogo contextualizada e sistema de revanche

> **Nota:** Sistema de reconexao automatica foi movido para fase futura (backlog).

**Complexidade:** Media
**Arquivos afetados:** 8
**Estimativa:** ~4 horas
**Tasks:** 20

---

## Tasks por Area

### PARTE 1: Room Exit

#### Types (1 task)

- [x] TASK-MPP-001: Expandir tipo `PlayerLeftEvent` com campo `role`
  - Arquivo: `src/types/events.ts`
  - Adicionar `role?: 'host' | 'guest'` ao payload (opcional para retrocompatibilidade)
  - Atualizar JSDoc

#### Store (3 tasks)

- [x] TASK-MPP-002: Adicionar campo `hostLeftVoluntarily` ao multiplayerStore
  - Arquivo: `src/stores/multiplayerStore.ts`
  - Novo campo: `hostLeftVoluntarily: boolean`
  - Adicionar ao `initialState` como `false`
  - Criar action: `setHostLeftVoluntarily(value: boolean)`

- [x] TASK-MPP-003: Modificar `leaveRoom` para enviar `role`
  - Arquivo: `src/stores/multiplayerStore.ts`
  - Incluir `state.localRole` no payload do evento `player_left`

- [x] TASK-MPP-004: Refatorar handler `player_left` com logica diferenciada
  - Arquivo: `src/stores/multiplayerStore.ts`
  - Importar `useToastStore` (se ainda nao importado)
  - Tratar `role === 'host'`: status 'abandoned', setar `hostLeftVoluntarily: true`
  - Tratar `role === 'guest'`: status 'waiting', limpar guest, resetGame, toast
  - Fallback para eventos sem role (retrocompatibilidade)
  - **NAO usar `error` como campo semantico**

#### Components (1 task)

- [ ] TASK-MPP-005: Expandir `DisconnectedOverlay` para tratar saida do host
  - Arquivo: `src/components/multiplayer/DisconnectedOverlay.tsx`
  - Importar `hostLeftVoluntarily` do multiplayerStore
  - Adicionar condicao: `isHostLeftVoluntarily = hostLeftVoluntarily && localRole === 'guest'`
  - Renderizar UI diferente quando `isHostLeftVoluntarily`:
    - Icone: `DoorClosed` ou similar
    - Titulo: "Sala Encerrada"
    - Mensagem: "O host encerrou a partida."
    - Botao: "Voltar ao Menu" -> `reset()` + `resetGame()`
  - Estilo consistente com casos existentes

---

### PARTE 2: Visual Sync

#### Pre-requisito: ToastType `info`

> **Nota:** Foi adicionado o tipo `info` ao `ToastType` para mensagens informativas do sistema/multiplayer, mantendo a semantica correta (o tipo `safe` e exclusivo para pilulas placebo).

#### Store - Visual Feedback (3 tasks)

- [ ] TASK-MPP-006: Importar `useOverlayStore` no gameStore
  - Arquivo: `src/stores/gameStore.ts`
  - Adicionar import para abrir overlays em eventos remotos

- [ ] TASK-MPP-007: Abrir `ItemEffectOverlay` para eventos remotos
  - Arquivo: `src/stores/gameStore.ts`
  - Em `applyRemoteEvent` case `item_used`:
    - Chamar `useOverlayStore.getState().openItemEffect(itemType, targetInfo)`
    - `targetInfo` = "Oponente usou"
  - Remover toast redundante (overlay ja da feedback)

- [ ] TASK-MPP-008: Toast para `selection_confirmed` remoto
  - Arquivo: `src/stores/gameStore.ts`
  - Em `applyRemoteEvent` case `selection_confirmed`:
    - Adicionar toast "Oponente esta pronto!" (tipo 'info')

#### Store - Animacao Remota (2 tasks)

- [ ] TASK-MPP-009: Adicionar `lastRemoteEffect` ao gameStore
  - Arquivo: `src/stores/gameStore.ts`
  - Novo campo: `lastRemoteEffect: { playerId, type, value, timestamp } | null`
  - Adicionar ao `initialState`
  - Criar action: `setLastRemoteEffect(effect)`
  - Criar action: `clearLastRemoteEffect()`

- [ ] TASK-MPP-010: Setar `lastRemoteEffect` em `pill_consumed` remoto
  - Arquivo: `src/stores/gameStore.ts`
  - Apos aplicar consumePill em evento remoto:
    - Extrair `effectType` e `effectValue` do payload
    - Chamar `setLastRemoteEffect({ playerId, type, value, timestamp })`

#### Components - Animacao (2 tasks)

- [ ] TASK-MPP-011: Detectar `lastRemoteEffect` no AnimatedPlayerArea
  - Arquivo: `src/components/game/AnimatedPlayerArea.tsx`
  - Adicionar selector para `lastRemoteEffect`
  - Quando `lastRemoteEffect.playerId === playerId`:
    - Trigger animacao apropriada (shake/glow)
    - Limpar `lastRemoteEffect` apos animacao

- [ ] TASK-MPP-012: Passar `showWaitingForOpponent` corretamente no GameBoard
  - Arquivo: `src/components/game/GameBoard.tsx`
  - **Nota:** TurnIndicator JA possui a prop, apenas garantir passagem correta
  - Adicionar: `showWaitingForOpponent={isMultiplayer && !isLocalTurn}`
  - Verificar se `isMultiplayer` e `localPlayerId` estao disponiveis via hook

---

### PARTE 3: GameOver & Rematch

#### Types (1 task)

- [ ] TASK-MPP-013: Adicionar eventos de rematch
  - Arquivo: `src/types/events.ts`
  - Adicionar interfaces: `RematchRequestedEvent`, `RematchAcceptedEvent`, `RematchDeclinedEvent`
  - Payload vazio: `payload: Record<string, never>`
  - Adicionar ao union `GameEventType`
  - Adicionar ao union `GameEvent`

#### Store - Rematch State (2 tasks)

- [ ] TASK-MPP-014: Adicionar estado de rematch no multiplayerStore
  - Arquivo: `src/stores/multiplayerStore.ts`
  - Novo campo: `rematchState: { localWants, remoteWants, declined }`
  - Adicionar ao `initialState`
  - Criar action: `resetRematchState()`

- [ ] TASK-MPP-015: Implementar actions de rematch
  - Arquivo: `src/stores/multiplayerStore.ts`
  - Implementar: `requestRematch()` - seta localWants, envia evento
  - Implementar: `declineRematch()` - envia evento, reseta stores
  - Handler para `rematch_requested`: seta remoteWants
  - Handler para `rematch_accepted`: inicia nova partida (host gera e sincroniza)
  - Handler para `rematch_declined`: reseta e volta ao menu

#### Components - GameOver (3 tasks)

- [ ] TASK-MPP-016: Contextualizar GameOverDialog para multiplayer
  - Arquivo: `src/components/overlays/GameOverDialog.tsx`
  - Importar `useMultiplayer` hook
  - Obter `isMultiplayer` e `localPlayerId`
  - Calcular `isLocalWinner = isMultiplayer ? winner === localPlayerId : !winnerPlayer?.isAI`
  - Exibir "VENCEDOR!" ou "DERROTA!" baseado em `isLocalWinner`
  - Trocar icone: Trophy (vitoria) vs Skull (derrota)

- [ ] TASK-MPP-017: Adicionar botao "Sair" no GameOverDialog
  - Arquivo: `src/components/overlays/GameOverDialog.tsx`
  - Adicionar botao "Sair" (variant="outline")
  - Apenas visivel em multiplayer (`isMultiplayer`)
  - Ao clicar: chama `declineRematch()` do multiplayerStore

- [ ] TASK-MPP-018: Implementar UI de estado de rematch
  - Arquivo: `src/components/overlays/GameOverDialog.tsx`
  - Se `localWants && !remoteWants`: mostrar "Aguardando oponente..." + spinner + Cancelar
  - Se `remoteWants && !localWants`: mostrar "Oponente quer revanche" + Aceitar/Recusar
  - Se `declined`: mostrar mensagem e voltar ao menu

#### Logic - Timeout (1 task)

- [ ] TASK-MPP-019: Implementar timeout de rematch
  - Arquivo: `src/components/overlays/GameOverDialog.tsx`
  - Timer de 30s apos primeiro jogador confirmar
  - Se timeout: automaticamente declina e volta ao menu
  - Exibir countdown visual (segundos restantes)

---

### Verificacao (1 task)

- [ ] TASK-MPP-020: Teste manual completo
  - **Room Exit:**
    - Testar: Host sai durante jogo (guest ve overlay expandido)
    - Testar: Guest sai durante jogo (host ve toast + WaitingRoom)
    - Testar: Guest sai durante selecao de itens
    - Testar: Novo guest entra apos saida do anterior
  - **Visual Sync:**
    - Testar: ItemEffectOverlay quando oponente usa item
    - Testar: Animacao no card quando oponente toma dano/cura
    - Testar: Toast quando oponente confirma selecao
    - Testar: "Aguardando oponente..." no TurnIndicator
  - **GameOver & Rematch:**
    - Testar: Vencedor ve "VENCEDOR!", perdedor ve "DERROTA!"
    - Testar: Ambos aceitam rematch -> nova partida
    - Testar: Um recusa rematch -> ambos voltam ao menu
    - Testar: Timeout de rematch -> ambos voltam ao menu
    - Testar: Botao "Sair" funciona corretamente

---

## Ordem de Execucao

```
PARTE 1: Room Exit
==================
TASK-MPP-001 (Types - player_left role)
      |
      v
TASK-MPP-002 (hostLeftVoluntarily state)
      |
      v
TASK-MPP-003 (leaveRoom)
      |
      v
TASK-MPP-004 (handler player_left)
      |
      v
TASK-MPP-005 (DisconnectedOverlay expandido)


PARTE 2: Visual Sync
====================
TASK-MPP-006 (Import overlayStore)
      |
      v
TASK-MPP-007 (ItemEffect remoto)
      |
      v
TASK-MPP-008 (Toast selection_confirmed)
      |
      v
TASK-MPP-009 (lastRemoteEffect state)
      |
      v
TASK-MPP-010 (set lastRemoteEffect)
      |
      v
TASK-MPP-011 (AnimatedPlayerArea)
      |
      v
TASK-MPP-012 (GameBoard - showWaitingForOpponent)


PARTE 3: GameOver & Rematch
===========================
TASK-MPP-013 (Types - eventos rematch)
      |
      v
TASK-MPP-014 (rematchState no store)
      |
      v
TASK-MPP-015 (actions de rematch)
      |
      v
TASK-MPP-016 (GameOverDialog contextualizado)
      |
      v
TASK-MPP-017 (Botao Sair)
      |
      v
TASK-MPP-018 (UI estados rematch)
      |
      v
TASK-MPP-019 (Timeout rematch)
      |
      v
TASK-MPP-020 (Testes completos)
```

---

## Dependencias entre Tasks

### Parte 1: Room Exit
| Task | Depende de |
|------|------------|
| TASK-MPP-002 | - |
| TASK-MPP-003 | TASK-MPP-001 |
| TASK-MPP-004 | TASK-MPP-001, TASK-MPP-002 |
| TASK-MPP-005 | TASK-MPP-002, TASK-MPP-004 |

### Parte 2: Visual Sync
| Task | Depende de |
|------|------------|
| TASK-MPP-007 | TASK-MPP-006 |
| TASK-MPP-008 | - |
| TASK-MPP-010 | TASK-MPP-009 |
| TASK-MPP-011 | TASK-MPP-009 |
| TASK-MPP-012 | - |

### Parte 3: GameOver & Rematch
| Task | Depende de |
|------|------------|
| TASK-MPP-014 | TASK-MPP-013 |
| TASK-MPP-015 | TASK-MPP-013, TASK-MPP-014 |
| TASK-MPP-016 | - |
| TASK-MPP-017 | TASK-MPP-015, TASK-MPP-016 |
| TASK-MPP-018 | TASK-MPP-014, TASK-MPP-015, TASK-MPP-016 |
| TASK-MPP-019 | TASK-MPP-018 |
| TASK-MPP-020 | Todas anteriores |

---

## Checklist Pre-Implementacao

- [x] Requirements revisados
- [x] Design aprovado
- [x] Impacto em arquivos mapeado
- [x] Spec revisada e simplificada (remocao de reconexao)
- [ ] **Pronto para implementacao**

---

## Notas de Implementacao

### TASK-MPP-001 - Tipo PlayerLeftEvent

```typescript
// ANTES
export interface PlayerLeftEvent extends GameEventBase {
  type: 'player_left'
  payload: {
    reason: 'voluntary' | 'timeout' | 'error'
  }
}

// DEPOIS
export interface PlayerLeftEvent extends GameEventBase {
  type: 'player_left'
  payload: {
    reason: 'voluntary' | 'timeout' | 'error'
    /** Role de quem saiu - opcional para retrocompatibilidade */
    role?: 'host' | 'guest'
  }
}
```

### TASK-MPP-002 - Estado hostLeftVoluntarily

```typescript
// Em multiplayerStore.ts - adicionar ao estado
interface MultiplayerStore {
  // ... existentes ...
  hostLeftVoluntarily: boolean
  setHostLeftVoluntarily: (value: boolean) => void
}

// Em initialState
hostLeftVoluntarily: false,

// Action
setHostLeftVoluntarily: (value: boolean) => {
  set({ hostLeftVoluntarily: value })
},
```

### TASK-MPP-004 - Handler player_left Refatorado

```typescript
case 'player_left': {
  const leftPayload = payload.payload as { 
    role?: 'host' | 'guest'
    reason?: string 
  }
  const whoLeft = leftPayload?.role

  if (whoLeft === 'host') {
    // Host saiu voluntariamente - guest ve overlay
    set({
      room: state.room ? { ...state.room, status: 'abandoned' } : null,
      hostLeftVoluntarily: true,  // Flag para UI (NAO usar error!)
    })
  } else if (whoLeft === 'guest' && state.localRole === 'host') {
    // Guest saiu - host volta para WaitingRoom
    if (state.room) {
      set({
        room: {
          ...state.room,
          status: 'waiting',
          guestId: null,
          guestName: null,
        },
      })
      useGameStore.getState().resetGame()
      useToastStore.getState().show({
        type: 'info',
        message: 'Jogador saiu da sala',
        duration: 3000,
      })
    }
  } else {
    // Fallback para eventos legados
    set({
      room: state.room ? { ...state.room, status: 'abandoned' } : null,
      error: 'Oponente saiu da partida',
    })
  }
  break
}
```

### TASK-MPP-005 - DisconnectedOverlay Expandido

```tsx
// Adicionar imports e estado
const hostLeftVoluntarily = useMultiplayerStore((state) => state.hostLeftVoluntarily)
const localRole = useMultiplayerStore((state) => state.localRole)
const reset = useMultiplayerStore((state) => state.reset)
const resetGame = useGameStore((state) => state.resetGame)

// Nova condicao
const isHostLeftVoluntarily = hostLeftVoluntarily && localRole === 'guest'

// Atualizar shouldShow
const shouldShow = isLocalReconnecting || isOpponentDisconnected || isHostLeftVoluntarily

// Handler
const handleBackToMenu = () => {
  reset()
  resetGame()
}

// Renderizar caso especifico ANTES dos casos existentes
if (isHostLeftVoluntarily) {
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 ...">
        <Card>
          <CardContent>
            <DoorClosed className="size-16 text-muted-foreground" />
            <h2 className="text-xl font-bold">Sala Encerrada</h2>
            <p className="text-muted-foreground">O host encerrou a partida.</p>
            <Button onClick={handleBackToMenu}>
              Voltar ao Menu
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
```

### TASK-MPP-012 - GameBoard showWaitingForOpponent

```tsx
// Em GameBoard.tsx
import { useMultiplayer } from '@/hooks'

// Dentro do componente
const { isMultiplayer, localPlayerId } = useMultiplayer()
const isLocalTurn = currentTurn === localPlayerId

// Na renderizacao do TurnIndicator
<TurnIndicator
  currentPlayer={players[currentTurn]}
  round={round}
  isHumanTurn={isLocalTurn}
  showWaitingForOpponent={isMultiplayer && !isLocalTurn}
/>
```

### TASK-MPP-013 - Eventos de Rematch

```typescript
// Em types/events.ts

export interface RematchRequestedEvent extends GameEventBase {
  type: 'rematch_requested'
  payload: Record<string, never>
}

export interface RematchAcceptedEvent extends GameEventBase {
  type: 'rematch_accepted'
  payload: Record<string, never>
}

export interface RematchDeclinedEvent extends GameEventBase {
  type: 'rematch_declined'
  payload: Record<string, never>
}

// Adicionar ao union GameEventType
export type GameEventType =
  | // ... existentes ...
  | 'rematch_requested'
  | 'rematch_accepted'
  | 'rematch_declined'

// Adicionar ao union GameEvent
export type GameEvent =
  | // ... existentes ...
  | RematchRequestedEvent
  | RematchAcceptedEvent
  | RematchDeclinedEvent
```

### TASK-MPP-014 - Estado de Rematch

```typescript
// Em multiplayerStore.ts

interface RematchState {
  localWants: boolean
  remoteWants: boolean
  declined: boolean
}

// No initialState
rematchState: {
  localWants: false,
  remoteWants: false,
  declined: false,
},

// Action
resetRematchState: () => {
  set({
    rematchState: { localWants: false, remoteWants: false, declined: false },
  })
},
```

### TASK-MPP-016 - GameOverDialog Contextualizado

```tsx
// Em GameOverDialog.tsx
import { useMultiplayer } from '@/hooks'

// Dentro do componente
const { isMultiplayer, localPlayerId } = useMultiplayer()

// Determina se jogador local venceu
const isLocalWinner = isMultiplayer 
  ? winner === localPlayerId 
  : !winnerPlayer?.isAI  // Single player: humano ganhou se nao e IA

// Usar isLocalWinner para determinar tema e icone
const theme = getThemeConfig(winnerPlayer, isLocalWinner)
```

### TASK-MPP-019 - Timeout de Rematch

```tsx
const REMATCH_TIMEOUT = 30000 // 30 segundos
const [timeLeft, setTimeLeft] = useState(30)

useEffect(() => {
  if (rematchState.localWants && !remoteWants) {
    const timer = setTimeout(() => {
      declineRematch()
    }, REMATCH_TIMEOUT)
    return () => clearTimeout(timer)
  }
}, [rematchState.localWants, rematchState.remoteWants])

useEffect(() => {
  if (rematchState.localWants && !rematchState.remoteWants) {
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(interval)
  } else {
    setTimeLeft(30)
  }
}, [rematchState.localWants, rematchState.remoteWants])
```

---

## Arquivos Afetados (Resumo)

| Arquivo | Mudancas |
|---------|----------|
| `src/types/events.ts` | + campo `role` em PlayerLeftEvent, + 3 eventos rematch |
| `src/stores/multiplayerStore.ts` | + hostLeftVoluntarily, + rematchState, + handlers |
| `src/stores/gameStore.ts` | + lastRemoteEffect, + import overlayStore |
| `src/components/multiplayer/DisconnectedOverlay.tsx` | + caso hostLeftVoluntarily |
| `src/components/game/AnimatedPlayerArea.tsx` | + animacao remota |
| `src/components/game/GameBoard.tsx` | + showWaitingForOpponent |
| `src/components/overlays/GameOverDialog.tsx` | + multiplayer context, + rematch UI |

---

## Backlog (Fase Futura)

Tasks removidas desta spec e movidas para implementacao futura:

- **Persistencia de sala em localStorage**
- **Reconexao automatica ao recarregar pagina**
- **ReconnectionScreen** (novo componente)
- **Presence tracking customizado** no realtimeService
- **Heartbeat de conexao** customizado

O sistema atual (`DisconnectedOverlay` com countdown de 60s via Supabase Presence) ja cobre adequadamente o cenario de desconexao abrupta.
