import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { usePlayerIds } from '@/hooks/useGameState'

interface UseStoreTimerReturn {
  /** Tempo restante em milissegundos */
  remainingTime: number
  /** Tempo restante formatado (ex: "0:25") */
  formattedTime: string
  /** Se o timer esta ativo */
  isActive: boolean
  /** Porcentagem de tempo restante (0-100) */
  progress: number
}

/**
 * Hook para monitorar o timer da Pill Store
 * Atualiza a cada segundo e confirma compras automaticamente ao expirar
 */
export function useStoreTimer(): UseStoreTimerReturn {
  const phase = useGameStore((s) => s.phase)
  const storeState = useGameStore((s) => s.storeState)
  const confirmStorePurchases = useGameStore((s) => s.confirmStorePurchases)
  const players = useGameStore((s) => s.players)
  const playerIds = usePlayerIds()

  const [remainingTime, setRemainingTime] = useState(0)

  // Calcula tempo restante
  const calculateRemaining = useCallback(() => {
    if (!storeState || phase !== 'shopping') {
      return 0
    }

    const { timerStartedAt, timerDuration } = storeState
    if (!timerStartedAt) {
      return timerDuration
    }

    const elapsed = Date.now() - timerStartedAt
    return Math.max(0, timerDuration - elapsed)
  }, [storeState, phase])

  // Atualiza timer a cada 100ms
  useEffect(() => {
    if (phase !== 'shopping' || !storeState) {
      setRemainingTime(0)
      return
    }

    // Calcula imediatamente
    setRemainingTime(calculateRemaining())

    const interval = setInterval(() => {
      const remaining = calculateRemaining()
      setRemainingTime(remaining)

      // Timer expirou - confirma automaticamente para quem ainda nao confirmou
      if (remaining <= 0) {
        clearInterval(interval)

        // Confirma automaticamente para quem ainda nao confirmou (N jogadores)
        for (const playerId of playerIds) {
          const wantsStore = players[playerId]?.wantsStore ?? false
          const confirmed = storeState.confirmed[playerId] ?? false
          if (wantsStore && !confirmed) {
            confirmStorePurchases(playerId)
          }
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [phase, storeState, calculateRemaining, confirmStorePurchases, players, playerIds])

  // Formata tempo para exibicao (M:SS)
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Calcula porcentagem de progresso
  const calculateProgress = (): number => {
    if (!storeState || storeState.timerDuration === 0) {
      return 0
    }
    return (remainingTime / storeState.timerDuration) * 100
  }

  return {
    remainingTime,
    formattedTime: formatTime(remainingTime),
    isActive: phase === 'shopping' && remainingTime > 0,
    progress: calculateProgress(),
  }
}

