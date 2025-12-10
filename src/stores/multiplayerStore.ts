import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type {
  ConnectionStatus,
  GameEvent,
  GameEventType,
  MultiplayerContext,
  PlayerId,
  Room,
  RoomStatus,
} from '@/types'
import { realtimeService } from '@/services'
import { useGameStore } from '@/stores/gameStore'

/**
 * Interface do Store com estado e actions
 */
interface MultiplayerStore extends MultiplayerContext {
  // Actions - Room Management
  createRoom: (hostName: string) => Promise<Room>
  joinRoom: (roomId: string, guestName: string) => Promise<Room>
  leaveRoom: () => Promise<void>

  // Actions - Connection
  connect: () => void
  disconnect: () => void

  // Actions - Events
  sendEvent: (event: { type: GameEventType; payload?: Record<string, unknown> }) => void
  handleEvent: (event: string, payload: Record<string, unknown>) => void

  // Actions - State
  setConnectionStatus: (status: ConnectionStatus) => void
  setRoomStatus: (status: RoomStatus) => void
  setError: (error: string | null) => void
  reset: () => void

  // Internal
  _sequenceNumber: number
  _localPlayerId: string
  _unsubscribeEvent: (() => void) | null
  _unsubscribeStatus: (() => void) | null
  
  // Estado de desconexao do oponente
  opponentDisconnected: boolean
  setOpponentDisconnected: (value: boolean) => void
}

/**
 * Estado inicial
 */
const initialState: MultiplayerContext & {
  _sequenceNumber: number
  _localPlayerId: string
  _unsubscribeEvent: (() => void) | null
  _unsubscribeStatus: (() => void) | null
  opponentDisconnected: boolean
} = {
  mode: 'single_player',
  room: null,
  localRole: null,
  localPlayerId: null,
  connectionStatus: 'disconnected',
  error: null,
  _sequenceNumber: 0,
  _localPlayerId: '',
  _unsubscribeEvent: null,
  _unsubscribeStatus: null,
  opponentDisconnected: false,
}

/**
 * Zustand Store para gerenciamento do estado multiplayer
 */
export const useMultiplayerStore = create<MultiplayerStore>((set, get) => ({
  ...initialState,

  /**
   * Cria uma nova sala (host)
   */
  createRoom: async (hostName: string): Promise<Room> => {
    const state = get()

    // Gera ID unico para o host
    const hostId = state._localPlayerId || uuidv4()

    try {
      set({
        connectionStatus: 'connecting',
        error: null,
        _localPlayerId: hostId,
      })

      // Cria sala no realtimeService
      const roomId = await realtimeService.createRoom()

      // Cria objeto Room
      const room: Room = {
        id: roomId,
        createdAt: Date.now(),
        status: 'waiting',
        hostId,
        hostName,
        guestId: null,
        guestName: null,
      }

      // Configura listeners
      get().connect()

      set({
        mode: 'multiplayer',
        room,
        localRole: 'host',
        localPlayerId: 'player1',
        connectionStatus: 'connected',
      })

      // Envia evento de sala criada
      get().sendEvent({
        type: 'room_created',
        payload: { hostName },
      })

      return room
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Falha ao criar sala'
      set({
        connectionStatus: 'disconnected',
        error: errorMessage,
      })
      throw error
    }
  },

  /**
   * Entra em uma sala existente (guest)
   */
  joinRoom: async (roomId: string, guestName: string): Promise<Room> => {
    const state = get()

    // Gera ID unico para o guest
    const guestId = state._localPlayerId || uuidv4()

    try {
      set({
        connectionStatus: 'connecting',
        error: null,
        _localPlayerId: guestId,
      })

      // Conecta ao canal da sala
      await realtimeService.joinRoom(roomId)

      // Cria objeto Room (parcial, sera atualizado pelo host)
      const room: Room = {
        id: roomId.toUpperCase(),
        createdAt: Date.now(),
        status: 'ready',
        hostId: '', // Sera preenchido pelo host
        hostName: '', // Sera preenchido pelo host
        guestId,
        guestName,
      }

      // Configura listeners
      get().connect()

      set({
        mode: 'multiplayer',
        room,
        localRole: 'guest',
        localPlayerId: 'player2',
        connectionStatus: 'connected',
      })

      // Envia evento de jogador entrou
      get().sendEvent({
        type: 'player_joined',
        payload: { guestName },
      })

      return room
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Falha ao entrar na sala'
      set({
        connectionStatus: 'disconnected',
        error: errorMessage,
      })
      throw error
    }
  },

  /**
   * Sai da sala atual
   */
  leaveRoom: async (): Promise<void> => {
    const state = get()

    if (state.room) {
      // Notifica outro jogador
      get().sendEvent({
        type: 'player_left',
        payload: { reason: 'voluntary' },
      })
    }

    // Desconecta do WebSocket
    get().disconnect()

    // Desconecta do realtimeService
    await realtimeService.leave()

    // Reset state
    get().reset()
  },

  /**
   * Configura listeners de conexao
   */
  connect: () => {
    const state = get()

    // Remove listeners anteriores
    if (state._unsubscribeEvent) {
      state._unsubscribeEvent()
    }
    if (state._unsubscribeStatus) {
      state._unsubscribeStatus()
    }

    // Registra handler de eventos
    const unsubscribeEvent = realtimeService.onEvent((event, payload) => {
      get().handleEvent(event, payload)
    })

    // Registra handler de status
    const unsubscribeStatus = realtimeService.onStatusChange((status) => {
      const prevStatus = get().connectionStatus
      set({ connectionStatus: status })

      // Emite evento de desconexao/reconexao para notificar oponente
      if (get().room && get().mode === 'multiplayer') {
        if (prevStatus === 'connected' && status === 'disconnected') {
          // Notifica oponente que desconectamos
          // Nota: pode nao chegar se a conexao ja caiu
          get().sendEvent({ type: 'player_disconnected' })
        } else if (prevStatus !== 'connected' && status === 'connected') {
          // Notifica oponente que reconectamos
          get().sendEvent({ type: 'player_reconnected' })
          // Reseta flag de oponente desconectado (ele pode ter reconectado tambem)
          set({ opponentDisconnected: false })
        }
      }
    })

    set({
      _unsubscribeEvent: unsubscribeEvent,
      _unsubscribeStatus: unsubscribeStatus,
    })
  },

  /**
   * Remove listeners e desconecta
   */
  disconnect: () => {
    const state = get()

    if (state._unsubscribeEvent) {
      state._unsubscribeEvent()
    }
    if (state._unsubscribeStatus) {
      state._unsubscribeStatus()
    }

    set({
      _unsubscribeEvent: null,
      _unsubscribeStatus: null,
      connectionStatus: 'disconnected',
    })
  },

  /**
   * Envia evento para a sala
   */
  sendEvent: (event) => {
    const state = get()

    if (!state.room || state.connectionStatus !== 'connected') {
      console.warn('[MultiplayerStore] Tentativa de enviar evento sem conexao')
      return
    }

    const fullEvent = {
      type: event.type,
      roomId: state.room.id,
      playerId: state.localPlayerId!,
      timestamp: Date.now(),
      sequence: state._sequenceNumber,
      payload: event.payload,
    }

    // Incrementa numero de sequencia
    set({ _sequenceNumber: state._sequenceNumber + 1 })

    // Envia via realtimeService
    realtimeService.send(event.type, fullEvent as Record<string, unknown>).catch((err) => {
      console.error('[MultiplayerStore] Erro ao enviar evento:', err)
    })
  },

  /**
   * Processa evento recebido do outro jogador
   */
  handleEvent: (eventType: string, payload: Record<string, unknown>) => {
    const state = get()

    // Ignora eventos se nao estiver em multiplayer
    if (state.mode !== 'multiplayer') return

    // Ignora eventos enviados por si mesmo (payload tem playerId)
    const eventPlayerId = payload.playerId as PlayerId | undefined
    if (eventPlayerId === state.localPlayerId) return

    console.log('[MultiplayerStore] Evento recebido:', eventType, payload)

    switch (eventType) {
      case 'player_joined': {
        // Guest entrou - atualiza sala e inicia jogo (apenas host processa)
        if (state.localRole === 'host' && state.room) {
          const guestNamePayload = (payload.payload as { guestName?: string }) ?? {}
          const guestName = guestNamePayload.guestName ?? 'Guest'

          // Atualiza sala
          const updatedRoom = {
            ...state.room,
            status: 'ready' as const,
            guestId: payload.playerId as string,
            guestName,
          }

          set({ room: updatedRoom })

          // Inicia o jogo automaticamente (host gera os dados)
          const gameStore = useGameStore.getState()
          gameStore.initGame({
            mode: 'multiplayer',
            roomId: state.room.id,
            player1: { name: state.room.hostName, isAI: false },
            player2: { name: guestName, isAI: false },
          })

          // Obtem dados gerados para sincronizar com guest
          const { pillPool, shapeQuests } = useGameStore.getState()

          // Envia evento game_started COM dados sincronizados
          get().sendEvent({
            type: 'game_started',
            payload: {
              hostName: state.room.hostName,
              guestName,
              // Dados sincronizados para garantir estado identico
              syncData: {
                pillPool,
                shapeQuests,
              },
            },
          })
        }
        break
      }

      case 'player_left': {
        // Jogador saiu - atualiza status
        if (state.room) {
          set({
            room: {
              ...state.room,
              status: 'abandoned',
            },
            error: 'Oponente saiu da partida',
          })
        }
        break
      }

      case 'player_disconnected': {
        // Oponente desconectou temporariamente
        set({ opponentDisconnected: true })
        break
      }

      case 'player_reconnected': {
        // Oponente reconectou
        set({ opponentDisconnected: false })
        break
      }

      case 'game_started': {
        // Jogo iniciado pelo host - guest sincroniza usando dados recebidos
        if (state.localRole === 'guest' && state.room) {
          const startPayload = (payload.payload as {
            hostName?: string
            guestName?: string
            syncData?: {
              pillPool: unknown[]
              shapeQuests: Record<string, unknown>
            }
          }) ?? {}

          // Atualiza room com dados do host
          const updatedRoom = {
            ...state.room,
            status: 'playing' as const,
            hostName: startPayload.hostName ?? state.room.hostName,
          }

          set({ room: updatedRoom })

          // Inicia o jogo localmente COM dados sincronizados do host
          const gameStore = useGameStore.getState()
          gameStore.initGame({
            mode: 'multiplayer',
            roomId: state.room.id,
            player1: { name: startPayload.hostName ?? 'Host', isAI: false },
            player2: { name: startPayload.guestName ?? state.room.guestName ?? 'Guest', isAI: false },
            // Passa dados sincronizados para garantir estado identico
            syncData: startPayload.syncData as import('@/types').SyncData | undefined,
          })

          console.log('[MultiplayerStore] Guest iniciou com dados sincronizados do host')
        } else if (state.localRole === 'host' && state.room) {
          // Host tambem atualiza status
          set({
            room: {
              ...state.room,
              status: 'playing',
            },
          })
        }
        break
      }

      case 'game_ended': {
        // Jogo encerrado
        if (state.room) {
          set({
            room: {
              ...state.room,
              status: 'finished',
            },
          })
        }
        break
      }

      case 'round_reset': {
        // Nova rodada iniciada pelo host - guest sincroniza
        if (state.localRole === 'guest') {
          const resetPayload = (payload.payload as {
            roundNumber?: number
            syncData?: {
              pillPool: unknown[]
              shapeQuests: Record<string, unknown>
            }
          }) ?? {}

          if (resetPayload.syncData) {
            const gameStore = useGameStore.getState()
            gameStore.resetRound(resetPayload.syncData as {
              pillPool: import('@/types').Pill[]
              shapeQuests: Record<import('@/types').PlayerId, import('@/types').ShapeQuest | null>
            })
            console.log('[MultiplayerStore] Guest aplicou round_reset com dados do host')
          }
        }
        break
      }

      // Eventos de gameplay - delega para gameStore
      case 'pill_consumed':
      case 'item_used':
      case 'item_selected':
      case 'item_deselected':
      case 'selection_confirmed':
      case 'wants_store_toggled':
      case 'cart_updated':
      case 'store_confirmed': {
        // Aplica evento no gameStore
        const gameStore = useGameStore.getState()
        console.log('[MultiplayerStore] Delegando evento para gameStore:', {
          eventType,
          payloadPlayerId: payload.playerId,
          localPlayerId: state.localPlayerId,
          currentTurn: gameStore.currentTurn,
          gamePhase: gameStore.phase,
        })
        if ('applyRemoteEvent' in gameStore) {
          (gameStore as unknown as { applyRemoteEvent: (event: GameEvent) => void }).applyRemoteEvent(
            payload as unknown as GameEvent
          )
        }
        break
      }
    }
  },

  /**
   * Atualiza status de conexao
   */
  setConnectionStatus: (status: ConnectionStatus) => {
    set({ connectionStatus: status })
  },

  /**
   * Atualiza status da sala
   */
  setRoomStatus: (status: RoomStatus) => {
    const state = get()
    if (state.room) {
      set({
        room: {
          ...state.room,
          status,
        },
      })
    }
  },

  /**
   * Define erro atual
   */
  setError: (error: string | null) => {
    set({ error })
  },

  /**
   * Define se oponente esta desconectado
   */
  setOpponentDisconnected: (value: boolean) => {
    set({ opponentDisconnected: value })
  },

  /**
   * Reseta para estado inicial
   */
  reset: () => {
    const state = get()

    // Remove listeners
    if (state._unsubscribeEvent) {
      state._unsubscribeEvent()
    }
    if (state._unsubscribeStatus) {
      state._unsubscribeStatus()
    }

    set(initialState)
  },
}))

// ============ HOOKS HELPERS ============

/**
 * Hook para verificar se esta em modo multiplayer
 */
export const useIsMultiplayer = () =>
  useMultiplayerStore((state) => state.mode === 'multiplayer')

/**
 * Hook para obter papel local (host/guest)
 */
export const useLocalRole = () =>
  useMultiplayerStore((state) => state.localRole)

/**
 * Hook para obter status de conexao
 */
export const useConnectionStatus = () =>
  useMultiplayerStore((state) => state.connectionStatus)

/**
 * Hook para obter sala atual
 */
export const useRoom = () =>
  useMultiplayerStore((state) => state.room)

/**
 * Hook para obter erro atual
 */
export const useMultiplayerError = () =>
  useMultiplayerStore((state) => state.error)

/**
 * Hook para verificar se oponente esta desconectado
 */
export const useOpponentDisconnected = () =>
  useMultiplayerStore((state) => state.opponentDisconnected)

