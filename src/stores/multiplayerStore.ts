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
}

/**
 * Estado inicial
 */
const initialState: MultiplayerContext & {
  _sequenceNumber: number
  _localPlayerId: string
  _unsubscribeEvent: (() => void) | null
  _unsubscribeStatus: (() => void) | null
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
      set({ connectionStatus: status })
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
        // Guest entrou - atualiza sala (apenas host processa)
        if (state.localRole === 'host' && state.room) {
          const guestName = payload.payload as { guestName: string }
          set({
            room: {
              ...state.room,
              status: 'ready',
              guestId: payload.playerId as string,
              guestName: guestName?.guestName ?? 'Guest',
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
        // Jogador desconectou temporariamente
        set({ connectionStatus: 'reconnecting' })
        break
      }

      case 'player_reconnected': {
        // Jogador reconectou
        set({ connectionStatus: 'connected' })
        break
      }

      case 'game_started': {
        // Jogo iniciado
        if (state.room) {
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

