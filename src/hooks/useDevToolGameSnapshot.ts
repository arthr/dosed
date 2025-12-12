import { useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { getPlayerIds } from '@/utils/playerManager'
import type { PlayerId } from '@/types'

/**
 * Hook para o DevTool consumir estado do jogo sem acessar stores diretamente.
 * Mantém a fronteira: Components -> Hooks -> Stores/Utils.
 */
export function useDevToolGameSnapshot() {
  const phase = useGameStore((s) => s.phase)
  const round = useGameStore((s) => s.round)
  const currentTurn = useGameStore((s) => s.currentTurn)
  const players = useGameStore((s) => s.players)
  const pillPool = useGameStore((s) => s.pillPool)
  const typeCounts = useGameStore((s) => s.typeCounts)
  const shapeQuests = useGameStore((s) => s.shapeQuests)
  const actionHistory = useGameStore((s) => s.actionHistory)
  const mode = useGameStore((s) => s.mode)

  const playerIds: PlayerId[] = useMemo(() => getPlayerIds(players), [players])

  return {
    phase,
    round,
    currentTurn,
    players,
    playerIds,
    pillPool,
    typeCounts,
    shapeQuests,
    actionHistory,
    mode,
  }
}


