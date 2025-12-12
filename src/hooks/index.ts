// Game Actions
export { useGameActions } from './useGameActions'

// Game State Selectors
export {
  useGamePhase,
  useCurrentTurn,
  useRound,
  useWinner,
  usePillPool,
  useTypeCounts,
  usePlayer,
  useCurrentPlayer,
  usePlayerIds,
  useOpponent,
  useIsHumanTurn,
  usePlayers,
  useGameStats,
  useGameSnapshot,
} from './useGameState'

// Pill Consumption Flow
export { usePillConsumption } from './usePillConsumption'

// AI Player
export { useAIPlayer } from './useAIPlayer'
export { useAIStore } from './useAIStore'

// Overlay System
export {
  useOverlay,
  useCurrentOverlay,
  usePillRevealData,
  useGameOverData,
  useNewRoundData,
  useOverlayClose,
} from './useOverlay'

// Toast System
export {
  useToast,
  useToasts,
  useToastDismiss,
} from './useToast'

// Item Selection (pre-game)
export { useItemSelection } from './useItemSelection'
export { useAIItemSelection } from './useAIItemSelection'

// Item Usage (during game)
export {
  useItemUsage,
  useIsValidTarget,
  useSelectedItemType,
} from './useItemUsage'

// Store Timer (shopping phase)
export { useStoreTimer } from './useStoreTimer'

// Multiplayer
export {
  useMultiplayer,
  useIsLocalTurn,
  useCanInteract,
} from './useMultiplayer'

export { useRoomConnection } from './useRoomConnection'

// Dev Tools
export { useDevTool } from './useDevTool'

// Targetable Players (N-player support)
export {
  useTargetablePlayers,
  useFirstTargetablePlayer,
  useIsTargetable,
  useTargetableCount,
  useOpponentId,
} from './useTargetablePlayers'

// Hooks de encapsulamento de estado
export { useGameBoardState } from './useGameBoardState'
export { usePillStoreState } from './usePillStoreState'
export { useItemSelectionState } from './useItemSelectionState'
export { useOverlayState } from './useOverlayState'

// Catálogos
export { useItemCatalog } from './useItemCatalog'
export { useStoreCatalog } from './useStoreCatalog'

// DevTool
export { useDevToolGameSnapshot } from './useDevToolGameSnapshot'
export { useDevToolStoresSnapshot } from './useDevToolStoresSnapshot'
export { useDevToolActions } from './useDevToolActions'