import { useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'
import type { GameConfig, PlayerId } from '@/types'

/**
 * Hook que encapsula todas as actions do jogo
 * Fornece funcoes memoizadas para evitar re-renders desnecessarios
 */
export function useGameActions() {
  const initGame = useGameStore((state) => state.initGame)
  const consumePill = useGameStore((state) => state.consumePill)
  const revealPillById = useGameStore((state) => state.revealPillById)
  const nextTurn = useGameStore((state) => state.nextTurn)
  const resetRound = useGameStore((state) => state.resetRound)
  const endGame = useGameStore((state) => state.endGame)
  const resetGame = useGameStore((state) => state.resetGame)

  // Memoiza as funcoes para estabilidade de referencia
  const startGame = useCallback(
    (config?: Partial<GameConfig>) => {
      initGame(config)
    },
    [initGame]
  )

  const selectPill = useCallback(
    (pillId: string) => {
      consumePill(pillId)
    },
    [consumePill]
  )

  const revealPill = useCallback(
    (pillId: string) => {
      revealPillById(pillId)
    },
    [revealPillById]
  )

  const skipTurn = useCallback(() => {
    nextTurn()
  }, [nextTurn])

  const newRound = useCallback(() => {
    resetRound()
  }, [resetRound])

  const finishGame = useCallback(
    (winnerId: PlayerId) => {
      endGame(winnerId)
    },
    [endGame]
  )

  const restartGame = useCallback(() => {
    resetGame()
  }, [resetGame])

  return {
    startGame,
    selectPill,
    revealPill,
    skipTurn,
    newRound,
    finishGame,
    restartGame,
  }
}

