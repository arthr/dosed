import { useGameStore } from '@/stores/gameStore'
import { useMultiplayerStore } from '@/stores/multiplayerStore'

/**
 * Hook para encapsular estado do OverlayManager
 * 
 * Centraliza acesso a MÚLTIPLOS stores (gameStore e multiplayerStore),
 * mantendo o componente OverlayManager desacoplado.
 * 
 * Este hook agrega concerns de jogo (fase, jogadores, reset) e
 * multiplayer (rematch) em uma única interface para o componente.
 * 
 * @returns Estado e actions necessários para gerenciar overlays
 * 
 * @example
 * ```tsx
 * function OverlayManager() {
 *   const { gamePhase, players, rematchState } = useOverlayState()
 *   // Componente desacoplado de múltiplos stores
 * }
 * ```
 */
export function useOverlayState() {
  // Estado do jogo
  const gamePhase = useGameStore((s) => s.phase)
  const players = useGameStore((s) => s.players)
  
  // Actions do jogo
  const resetGame = useGameStore((s) => s.resetGame)
  
  // Estado de rematch (multiplayer)
  const rematchState = useMultiplayerStore((s) => s.rematchState)
  
  // Actions de rematch (multiplayer)
  const requestRematch = useMultiplayerStore((s) => s.requestRematch)
  const acceptRematch = useMultiplayerStore((s) => s.acceptRematch)
  const declineRematch = useMultiplayerStore((s) => s.declineRematch)
  
  return {
    // Estado do jogo
    gamePhase,
    players,
    
    // Actions do jogo
    resetGame,
    
    // Estado de rematch
    rematchState,
    
    // Actions de rematch
    requestRematch,
    acceptRematch,
    declineRematch,
  }
}

