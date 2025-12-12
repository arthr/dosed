import { useGameStore } from '@/stores/gameStore'
import { useOverlayStore } from '@/stores/overlayStore'

/**
 * Hook para encapsular estado do GameBoard
 * 
 * Este hook agrega todos os selectors necessários para o componente GameBoard,
 * mantendo o componente desacoplado dos stores.
 * 
 * @returns Estado e actions necessários para o GameBoard
 * 
 * @example
 * ```tsx
 * function GameBoard() {
 *   const { players, currentTurn, pillPool } = useGameBoardState()
 *   // Componente usa apenas o hook, não acessa stores diretamente
 * }
 * ```
 */
export function useGameBoardState() {
  // Estado do jogo
  const players = useGameStore((s) => s.players)
  const currentTurn = useGameStore((s) => s.currentTurn)
  const pillPool = useGameStore((s) => s.pillPool)
  const typeCounts = useGameStore((s) => s.typeCounts)
  const round = useGameStore((s) => s.round)
  const gamePhase = useGameStore((s) => s.phase)
  const revealedPills = useGameStore((s) => s.revealedPills)
  const mode = useGameStore((s) => s.mode)
  
  // Shape Quests
  const shapeQuests = useGameStore((s) => s.shapeQuests)
  const lastQuestReset = useGameStore((s) => s.lastQuestReset)
  
  // Actions
  const toggleWantsStore = useGameStore((s) => s.toggleWantsStore)
  const openItemEffect = useOverlayStore((s) => s.openItemEffect)
  
  return {
    // Estado do jogo
    players,
    currentTurn,
    pillPool,
    typeCounts,
    round,
    gamePhase,
    revealedPills,
    mode,
    
    // Shape Quests
    shapeQuests,
    lastQuestReset,
    
    // Actions
    toggleWantsStore,
    openItemEffect,
  }
}

