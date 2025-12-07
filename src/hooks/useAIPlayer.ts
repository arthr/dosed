import { useEffect, useRef } from 'react'
import type { GamePhase, Pill, Player, PlayerId } from '@/types'
import {
  selectRandomPill,
  getAIThinkingDelay,
  shouldAIUseItem,
  selectAIItem,
  selectAIItemTarget,
  itemRequiresTarget,
} from '@/utils/aiLogic'

interface UseAIPlayerOptions {
  /** Jogador atual */
  currentPlayer: Player
  /** Pool de pilulas disponiveis */
  pillPool: Pill[]
  /** Fase atual do consumo (idle, revealing, feedback) */
  phase: 'idle' | 'revealing' | 'feedback'
  /** Fase atual do jogo */
  gamePhase: GamePhase
  /** Funcao para iniciar consumo de pilula */
  startConsumption: (pillId: string) => void
  /** ID do oponente (para itens que afetam oponente) */
  opponentId?: PlayerId
  /** Funcao para usar item (opcional) */
  executeItem?: (itemId: string, targetId?: string) => void
}

/**
 * Hook que gerencia a jogada automatica da IA
 * 
 * - Detecta quando e turno da IA e phase === 'idle'
 * - Aguarda delay simulado (1-2s) para "pensar"
 * - Decide se usa item (35% chance) antes de consumir pilula
 * - Seleciona pilula aleatoria e inicia consumo
 * - Evita jogar durante animacoes/feedback
 * - Para quando jogo termina ou rodada esta em transicao
 */
export function useAIPlayer({
  currentPlayer,
  pillPool,
  phase,
  gamePhase,
  startConsumption,
  opponentId,
  executeItem,
}: UseAIPlayerOptions) {
  // Ref para controlar timeout e evitar memory leaks
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Ref para evitar dupla execucao no StrictMode
  const hasScheduledRef = useRef(false)
  // Ref para rastrear se ja usou item neste turno
  const hasUsedItemRef = useRef(false)

  useEffect(() => {
    // Condicoes para IA jogar:
    // 1. Jogo esta em andamento (nao ended, nao roundEnding)
    // 2. E turno da IA (currentPlayer.isAI)
    // 3. Fase de consumo e idle (nao esta processando)
    // 4. Tem pilulas disponiveis
    // 5. Nao tem timeout ja agendado
    const shouldAIPlay =
      gamePhase === 'playing' &&
      currentPlayer.isAI &&
      phase === 'idle' &&
      pillPool.length > 0 &&
      !hasScheduledRef.current

    if (shouldAIPlay) {
      hasScheduledRef.current = true

      const delay = getAIThinkingDelay()

      timeoutRef.current = setTimeout(() => {
        // Tenta usar item primeiro (se ainda nao usou neste turno)
        if (!hasUsedItemRef.current && executeItem && opponentId) {
          const shouldUseItem = shouldAIUseItem(currentPlayer)

          if (shouldUseItem) {
            const selectedItem = selectAIItem(currentPlayer, pillPool)

            if (selectedItem) {
              // Seleciona alvo se necessario
              const targetId = itemRequiresTarget(selectedItem.type)
                ? selectAIItemTarget(selectedItem.type, pillPool, opponentId)
                : undefined

              // Usa o item
              executeItem(selectedItem.id, targetId)
              hasUsedItemRef.current = true

              // Agenda consumo de pilula apos usar item
              setTimeout(() => {
                const selectedPillId = selectRandomPill(pillPool)
                if (selectedPillId) {
                  startConsumption(selectedPillId)
                }
                hasScheduledRef.current = false
              }, getAIThinkingDelay() / 2)

              return
            }
          }
        }

        // Consumo normal de pilula (sem usar item)
        const selectedPillId = selectRandomPill(pillPool)

        if (selectedPillId) {
          startConsumption(selectedPillId)
        }

        hasScheduledRef.current = false
      }, delay)
    }

    // Cleanup: cancela timeout se componente desmontar ou condicoes mudarem
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [
    gamePhase,
    currentPlayer,
    phase,
    pillPool,
    startConsumption,
    executeItem,
    opponentId,
  ])

  // Reset flags quando turno muda para humano
  useEffect(() => {
    if (!currentPlayer.isAI) {
      hasScheduledRef.current = false
      hasUsedItemRef.current = false
    }
  }, [currentPlayer.isAI])
}

