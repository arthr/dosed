import { useState, useCallback, useRef, useEffect } from 'react'
import type { Pill, PillType, PlayerEffectResult } from '@/types'
import { useGameStore } from '@/stores/gameStore'
import { applyPillEffect } from '@/utils/gameLogic'
import type { FeedbackType } from '@/components/game/GameFeedback'

type ConsumptionPhase = 'idle' | 'revealing' | 'feedback'

interface ConsumptionState {
  phase: ConsumptionPhase
  revealedPill: Pill | null
  effect: PlayerEffectResult | null
  feedbackType: FeedbackType | null
  targetPlayer: 'player1' | 'player2' | null
  newRoundStarted: boolean
}

/**
 * Hook para gerenciar o fluxo completo de consumo de pilula
 * 1. Revelar pilula (animacao)
 * 2. Mostrar feedback do efeito
 * 3. Aplicar efeito e alternar turno
 */
export function usePillConsumption() {
  const [state, setState] = useState<ConsumptionState>({
    phase: 'idle',
    revealedPill: null,
    effect: null,
    feedbackType: null,
    targetPlayer: null,
    newRoundStarted: false,
  })

  const consumePill = useGameStore((s) => s.consumePill)
  const currentTurn = useGameStore((s) => s.currentTurn)
  const players = useGameStore((s) => s.players)
  const getPillById = useGameStore((s) => s.getPillById)
  const round = useGameStore((s) => s.round)
  const pillPoolLength = useGameStore((s) => s.pillPool.length)

  // Ref para rastrear a rodada anterior
  const prevRoundRef = useRef(round)

  // Detecta mudanca de rodada
  useEffect(() => {
    if (round > prevRoundRef.current && prevRoundRef.current > 0) {
      setState((prev) => ({ ...prev, newRoundStarted: true }))
    }
    prevRoundRef.current = round
  }, [round])

  /**
   * Determina tipo de feedback baseado no efeito
   */
  const determineFeedbackType = (
    _pillType: PillType,
    effect: PlayerEffectResult
  ): FeedbackType => {
    if (effect.collapsed) return 'collapse'
    if (effect.eliminated) return 'fatal'
    if (effect.damageDealt > 0) return 'damage'
    if (effect.healReceived > 0) return 'heal'
    return 'safe'
  }

  /**
   * Inicia o fluxo de consumo
   */
  const startConsumption = useCallback(
    (pillId: string) => {
      const pill = getPillById(pillId)
      if (!pill) return

      const currentPlayer = players[currentTurn]
      if (!currentPlayer) return

      // Simula o efeito para preview
      const revealedPill: Pill = { ...pill, isRevealed: true }
      const effect = applyPillEffect(revealedPill, currentPlayer)
      const feedbackType = determineFeedbackType(pill.type, effect)

      // Fase 1: Revelar pilula
      setState({
        phase: 'revealing',
        revealedPill,
        effect,
        feedbackType,
        targetPlayer: currentTurn,
        newRoundStarted: false,
      })
    },
    [getPillById, currentTurn, players]
  )

  /**
   * Apos revelacao, aplica efeito e mostra feedback
   */
  const confirmReveal = useCallback(() => {
    if (!state.revealedPill) return

    // Aplica o efeito no store
    consumePill(state.revealedPill.id)

    // Fase 2: Feedback
    setState((prev) => ({
      ...prev,
      phase: 'feedback',
    }))
  }, [state.revealedPill, consumePill])

  /**
   * Finaliza o fluxo e volta ao idle
   */
  const completeFeedback = useCallback(() => {
    setState({
      phase: 'idle',
      revealedPill: null,
      effect: null,
      feedbackType: null,
      targetPlayer: null,
      newRoundStarted: false,
    })
  }, [])

  /**
   * Limpa o flag de nova rodada (apos exibir feedback)
   */
  const clearNewRoundFlag = useCallback(() => {
    setState((prev) => ({ ...prev, newRoundStarted: false }))
  }, [])

  /**
   * Gera mensagem de feedback baseada no efeito
   */
  const getFeedbackMessage = useCallback((): string => {
    if (!state.effect) return 'Nada aconteceu'

    if (state.effect.eliminated) {
      return 'FATAL! Eliminado!'
    }
    if (state.effect.collapsed) {
      return 'COLAPSO! Perdeu 1 vida'
    }
    if (state.effect.damageDealt > 0) {
      return `Dano na resistencia`
    }
    if (state.effect.healReceived > 0) {
      return `Resistencia restaurada`
    }
    return 'Pilula segura!'
  }, [state.effect])

  return {
    // Estado
    phase: state.phase,
    revealedPill: state.revealedPill,
    effect: state.effect,
    feedbackType: state.feedbackType,
    targetPlayer: state.targetPlayer,
    isProcessing: state.phase !== 'idle',
    newRoundStarted: state.newRoundStarted,
    round,
    pillPoolLength,

    // Acoes
    startConsumption,
    confirmReveal,
    completeFeedback,
    clearNewRoundFlag,

    // Helpers
    getFeedbackMessage,
  }
}
