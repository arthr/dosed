import { useEffect, useRef } from 'react'
import type { AIDecisionContext, GameMode, GamePhase, Pill, Player, PlayerId } from '@/types'
import { useGameStore } from '@/stores/gameStore'
import { getAIConfig, getAIThinkingDelay } from '@/utils/aiConfig'
import { getAlivePlayers, getPlayerIds } from '@/utils/playerManager'
import { getTargetablePlayers } from '@/utils/turnManager'
import {
  selectAIPill,
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
  /** Modo de jogo atual */
  mode: GameMode
  /** Funcao para iniciar consumo de pilula */
  startConsumption: (pillId: string) => void
  /** ID do oponente (para itens que afetam oponente) */
  opponentId?: PlayerId
  /** Funcao para usar item (opcional) */
  executeItem?: (itemId: string, targetId?: string) => void
}

/**
 * Constroi contexto de decisao da IA a partir do estado atual
 */
function buildAIContext(aiPlayerId: PlayerId): AIDecisionContext {
  const state = useGameStore.getState()
  const difficulty = state.difficulty
  const config = getAIConfig(difficulty)

  const aiPlayer = state.players[aiPlayerId]

  const allPlayerIds = getPlayerIds(state.players)
  const alivePlayerIds = getAlivePlayers(state.players)
  const targetable = getTargetablePlayers(aiPlayerId, allPlayerIds, alivePlayerIds)
  const opponentId =
    targetable[0] ?? allPlayerIds.find((id) => id !== aiPlayerId) ?? aiPlayerId
  const opponent = state.players[opponentId]

  return {
    aiPlayer,
    opponent,
    pillPool: state.pillPool,
    revealedPills: state.revealedPills,
    typeCounts: state.typeCounts,
    shapeCounts: state.shapeCounts,
    aiQuest: state.shapeQuests[aiPlayerId],
    opponentQuest: state.shapeQuests[opponentId],
    round: state.round,
    revealAtStart: state.revealAtStart[aiPlayerId],
    config,
  }
}

/**
 * Hook que gerencia a jogada automatica da IA
 *
 * - Detecta quando e turno da IA e phase === 'idle'
 * - Aguarda delay simulado (variavel por dificuldade) para "pensar"
 * - Decide se usa item baseado na dificuldade e analise de risco
 * - Seleciona pilula usando logica apropriada para a dificuldade
 * - Evita jogar durante animacoes/feedback
 * - Para quando jogo termina ou rodada esta em transicao
 */
export function useAIPlayer({
  currentPlayer,
  pillPool,
  phase,
  gamePhase,
  mode,
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
  // Ref para rastrear quantidade de pilulas (detecta novo turno)
  const lastPillCountRef = useRef(pillPool.length)

  // Em multiplayer, IA nao deve jogar - oponente e humano real
  const isMultiplayer = mode === 'multiplayer'

  // Reset flags quando uma pilula e consumida (novo turno)
  // Isso resolve o bug de handcuffs onde turno pula de volta para IA
  useEffect(() => {
    // Nao executa em multiplayer
    if (isMultiplayer) return

    if (pillPool.length !== lastPillCountRef.current) {
      lastPillCountRef.current = pillPool.length
      // Reset para permitir nova jogada
      hasScheduledRef.current = false
      hasUsedItemRef.current = false
    }
  }, [pillPool.length, isMultiplayer])

  // Reset quando phase volta para idle (fim de animacao/processamento)
  useEffect(() => {
    // Nao executa em multiplayer
    if (isMultiplayer) return

    if (phase === 'idle' && currentPlayer.isAI) {
      // Permite nova jogada quando processamento termina
      hasScheduledRef.current = false
    }
  }, [phase, currentPlayer.isAI, isMultiplayer])

  useEffect(() => {
    // Nao executa em multiplayer - oponente e humano real
    if (isMultiplayer) return

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

      // Delay variavel por dificuldade
      const difficulty = useGameStore.getState().difficulty
      const delay = getAIThinkingDelay(difficulty)

      timeoutRef.current = setTimeout(() => {
        // Verificacao de seguranca: confirma que condicoes ainda sao validas
        const currentState = useGameStore.getState()
        const stillValidTurn =
          currentState.phase === 'playing' &&
          currentState.players[currentState.currentTurn].isAI &&
          currentState.pillPool.length > 0

        if (!stillValidTurn) {
          hasScheduledRef.current = false
          return
        }

        // Constroi contexto de decisao
        const aiPlayerId = currentState.currentTurn
        const ctx = buildAIContext(aiPlayerId)

        // Tenta usar item primeiro (se ainda nao usou neste turno)
        if (!hasUsedItemRef.current && executeItem && opponentId) {
          const shouldUse = shouldAIUseItem(ctx)

          if (shouldUse) {
            const selectedItem = selectAIItem(ctx)

            if (selectedItem) {
              // Seleciona alvo se necessario
              const targetId = itemRequiresTarget(selectedItem.type)
                ? selectAIItemTarget(selectedItem.type, ctx, opponentId)
                : undefined

              // Usa o item
              executeItem(selectedItem.id, targetId)
              hasUsedItemRef.current = true

              // Agenda consumo de pilula apos usar item
              const delayAfterItem = getAIThinkingDelay(difficulty) / 2
              setTimeout(() => {
                // Reconstroi contexto com estado atualizado
                const updatedCtx = buildAIContext(aiPlayerId)
                const selectedPillId = selectAIPill(updatedCtx)
                if (selectedPillId) {
                  startConsumption(selectedPillId)
                }
              }, delayAfterItem)

              return
            }
          }
        }

        // Consumo normal de pilula (sem usar item)
        const selectedPillId = selectAIPill(ctx)

        if (selectedPillId) {
          startConsumption(selectedPillId)
        }
      }, delay)
    }

    // Cleanup: cancela timeout se componente desmontar ou condicoes mudarem
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
        hasScheduledRef.current = false
      }
    }
  }, [gamePhase, currentPlayer, phase, pillPool, startConsumption, executeItem, opponentId, isMultiplayer])

  // Reset flags quando turno muda para humano
  useEffect(() => {
    // Nao executa em multiplayer
    if (isMultiplayer) return

    if (!currentPlayer.isAI) {
      hasScheduledRef.current = false
      hasUsedItemRef.current = false
    }
  }, [currentPlayer.isAI, isMultiplayer])
}
