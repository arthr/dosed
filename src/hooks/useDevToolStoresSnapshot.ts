import { useMemo } from 'react'
import { usePillPoolStore } from '@/stores/game/pillPoolStore'
import { useEffectsStore } from '@/stores/game/effectsStore'
import { useOverlayStore } from '@/stores/overlayStore'
import { useToastStore } from '@/stores/toastStore'
import { useGameFlowStore } from '@/stores/game/gameFlowStore'
import { useGameStore } from '@/stores/gameStore'
import type { PlayerId } from '@/types'

/**
 * Hook para a aba Stores do DevTool consumir dados sem acessar stores diretamente.
 */
export function useDevToolStoresSnapshot() {
  const revealedPills = usePillPoolStore((s) => s.revealedPills)
  const activeEffects = useEffectsStore((s) => s.activeEffects)

  const currentOverlay = useOverlayStore((s) => s.current)
  const pillRevealData = useOverlayStore((s) => s.pillRevealData)
  const gameOverData = useOverlayStore((s) => s.gameOverData)

  const toasts = useToastStore((s) => s.toasts)

  const playerOrder = useGameFlowStore((s) => s.playerOrder)
  const currentTurn = useGameFlowStore((s) => s.currentTurn)

  const players = useGameStore((s) => s.players)
  const fallbackIds: PlayerId[] = useMemo(() => Object.keys(players) as PlayerId[], [players])

  const playerIds: PlayerId[] = (playerOrder.length > 0 ? playerOrder : fallbackIds)
    .filter((id) => players[id] !== undefined)

  return {
    revealedPills,
    activeEffects,
    currentOverlay,
    pillRevealData,
    gameOverData,
    toasts,
    playerOrder,
    currentTurn,
    playerIds,
  }
}


