import { useMemo } from 'react'
import { useMultiplayerStore } from '@/stores/multiplayerStore'
import { useGameStore } from '@/stores/gameStore'
import type { PlayerId } from '@/types'

/**
 * Hook principal para funcionalidades multiplayer
 *
 * Fornece:
 * - Estado do multiplayerStore (mode, room, connectionStatus, etc)
 * - Computacoes derivadas (isLocalTurn, canInteract)
 * - Actions do multiplayerStore
 */
export function useMultiplayer() {
  // Estado do multiplayer store
  const mode = useMultiplayerStore((state) => state.mode)
  const room = useMultiplayerStore((state) => state.room)
  const localRole = useMultiplayerStore((state) => state.localRole)
  const localPlayerId = useMultiplayerStore((state) => state.localPlayerId)
  const connectionStatus = useMultiplayerStore((state) => state.connectionStatus)
  const error = useMultiplayerStore((state) => state.error)

  // Actions do multiplayer store
  const createRoom = useMultiplayerStore((state) => state.createRoom)
  const joinRoom = useMultiplayerStore((state) => state.joinRoom)
  const leaveRoom = useMultiplayerStore((state) => state.leaveRoom)
  const sendEvent = useMultiplayerStore((state) => state.sendEvent)
  const reset = useMultiplayerStore((state) => state.reset)

  // Estado do game store para computacoes
  const currentTurn = useGameStore((state) => state.currentTurn)
  const gamePhase = useGameStore((state) => state.phase)

  // Determina se e turno do jogador local
  const isLocalTurn = useMemo(() => {
    // Em single player, sempre e turno local (para o humano)
    if (mode !== 'multiplayer') return true

    // Em multiplayer, verifica se currentTurn e o jogador local
    return currentTurn === localPlayerId
  }, [mode, currentTurn, localPlayerId])

  // Determina se pode interagir (turno local + fase correta)
  const canInteract = useMemo(() => {
    // Em single player, sempre pode interagir quando e turno do humano
    if (mode !== 'multiplayer') return true

    // Em multiplayer, precisa ser turno local E fase de jogo correta
    return isLocalTurn && gamePhase === 'playing'
  }, [mode, isLocalTurn, gamePhase])

  // Verifica se esta conectado ao multiplayer
  const isConnected = connectionStatus === 'connected'

  // Verifica se esta em modo multiplayer
  const isMultiplayer = mode === 'multiplayer'

  // Verifica se esta aguardando oponente (host na sala waiting)
  const isWaitingForOpponent = isMultiplayer && room?.status === 'waiting'

  // Verifica se sala esta pronta para jogar
  const isRoomReady = isMultiplayer && room?.status === 'ready'

  // Obtem ID do oponente
  const opponentPlayerId: PlayerId | null = useMemo(() => {
    if (!isMultiplayer || !localPlayerId) return null
    return localPlayerId === 'player1' ? 'player2' : 'player1'
  }, [isMultiplayer, localPlayerId])

  return {
    // Estado
    mode,
    room,
    localRole,
    localPlayerId,
    connectionStatus,
    error,

    // Computacoes derivadas
    isLocalTurn,
    canInteract,
    isConnected,
    isMultiplayer,
    isWaitingForOpponent,
    isRoomReady,
    opponentPlayerId,

    // Actions
    createRoom,
    joinRoom,
    leaveRoom,
    sendEvent,
    reset,
  }
}

/**
 * Hook para verificar se e turno do jogador local
 * Versao leve para componentes que so precisam dessa informacao
 */
export function useIsLocalTurn(): boolean {
  const mode = useMultiplayerStore((state) => state.mode)
  const localPlayerId = useMultiplayerStore((state) => state.localPlayerId)
  const currentTurn = useGameStore((state) => state.currentTurn)

  return useMemo(() => {
    if (mode !== 'multiplayer') return true
    return currentTurn === localPlayerId
  }, [mode, currentTurn, localPlayerId])
}

/**
 * Hook para verificar se pode interagir
 * Versao leve para componentes que so precisam dessa informacao
 */
export function useCanInteract(): boolean {
  const mode = useMultiplayerStore((state) => state.mode)
  const localPlayerId = useMultiplayerStore((state) => state.localPlayerId)
  const currentTurn = useGameStore((state) => state.currentTurn)
  const gamePhase = useGameStore((state) => state.phase)

  return useMemo(() => {
    if (mode !== 'multiplayer') return true
    const isLocalTurn = currentTurn === localPlayerId
    return isLocalTurn && gamePhase === 'playing'
  }, [mode, currentTurn, localPlayerId, gamePhase])
}

