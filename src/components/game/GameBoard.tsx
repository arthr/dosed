import { useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useOverlayStore } from '@/stores/overlayStore'
import { usePillConsumption } from '@/hooks/usePillConsumption'
import { useAIPlayer } from '@/hooks/useAIPlayer'
import { useItemUsage, useToast } from '@/hooks'
import { AnimatedPlayerArea } from './AnimatedPlayerArea'
import { PillPool } from './PillPool'
import { TurnIndicator } from './TurnIndicator'
import { ItemTargetSelector } from './ItemTargetSelector'
import { ITEM_CATALOG } from '@/utils/itemCatalog'
import type { ItemType, PlayerId } from '@/types'

/** Tempo em ms para considerar um reset de quest como "recente" (para animacao de shake) */
const QUEST_RESET_ANIMATION_DURATION = 600

/**
 * GameBoard - Tabuleiro principal do jogo
 * Compoe PlayerAreas, PillPool e TurnIndicator
 *
 * Overlays (PillReveal, GameOver, NewRound) sao gerenciados pelo OverlayManager
 * Toasts sao gerenciados pelo ToastManager
 */
export function GameBoard() {
  // State do store
  const players = useGameStore((s) => s.players)
  const currentTurn = useGameStore((s) => s.currentTurn)
  const pillPool = useGameStore((s) => s.pillPool)
  const typeCounts = useGameStore((s) => s.typeCounts)
  const round = useGameStore((s) => s.round)
  const gamePhase = useGameStore((s) => s.phase)
  const revealedPills = useGameStore((s) => s.revealedPills)

  // Shape Quests state
  const shapeQuests = useGameStore((s) => s.shapeQuests)
  const lastQuestReset = useGameStore((s) => s.lastQuestReset)
  const toggleWantsStore = useGameStore((s) => s.toggleWantsStore)

  const player1 = players.player1
  const player2 = players.player2

  // Hook de consumo de pilula
  const {
    phase,
    effect,
    feedbackType,
    targetPlayer,
    isProcessing,
    startConsumption,
  } = usePillConsumption()

  // Jogador atual
  const currentPlayer = players[currentTurn]
  const isHumanTurn = !currentPlayer.isAI
  const isRoundEnding = gamePhase === 'roundEnding'

  // Hook de uso de itens
  const {
    isSelectingTarget,
    validTargets,
    selectedItemId,
    selectedItemType,
    startUsage,
    executeItem,
  } = useItemUsage()

  // Overlay store para feedback de item
  const openItemEffect = useOverlayStore((s) => s.openItemEffect)

  // Toast para feedback de item
  const { toast } = useToast()

  // Determina ID do oponente
  const opponentId = currentTurn === 'player1' ? 'player2' : 'player1'

  /**
   * Wrapper para executar item com feedback visual
   * Abre overlay de ItemEffect apos execucao (exceto para force_feed que usa PillReveal)
   */
  const executeItemWithFeedback = useCallback((targetId?: string) => {
    const itemType = selectedItemType
    if (!itemType) return

    // Executa o item (remove do inventario, reseta targetSelection)
    executeItem(targetId)

    // Toast de feedback (mostra no jogador atual)
    toast.item(itemType, currentTurn)

    // Force Feed: delega consumo para o fluxo completo com PillReveal
    if (itemType === 'force_feed' && targetId) {
      // Inicia consumo com forcedTarget (oponente)
      // Isso abre o PillReveal overlay mostrando a pilula sendo consumida pelo oponente
      startConsumption(targetId, opponentId)
      return
    }

    // Outros itens: abre overlay de feedback
    let targetInfo: string | undefined

    // Gera info contextual do alvo
    if (targetId) {
      const targetPill = pillPool.find((p) => p.id === targetId)
      if (targetPill) {
        targetInfo = `Pilula #${pillPool.indexOf(targetPill) + 1}`
      }
    }

    openItemEffect(itemType, targetInfo)
  }, [selectedItemType, executeItem, openItemEffect, pillPool, toast, currentTurn, opponentId, startConsumption])

  /**
   * Wrapper para IA executar item com feedback
   */
  const executeItemForAI = useCallback((itemId: string, targetId?: string) => {
    // Busca o item no inventario da IA para obter o tipo
    const aiInventory = players[currentTurn]?.inventory.items ?? []
    const item = aiInventory.find((i) => i.id === itemId)
    if (!item) return

    const itemType: ItemType = item.type

    // Chama a action da store diretamente (remove item, reseta targetSelection)
    useGameStore.getState().executeItem(itemId, targetId)

    // Toast de feedback (mostra no jogador atual - IA)
    toast.item(itemType, currentTurn)

    // Force Feed: delega consumo para o fluxo completo com PillReveal
    if (itemType === 'force_feed' && targetId) {
      // Inicia consumo com forcedTarget (oponente humano)
      // Isso abre o PillReveal overlay mostrando a pilula sendo consumida pelo oponente
      startConsumption(targetId, opponentId)
      return
    }

    // Outros itens: abre overlay de feedback
    let targetInfo: string | undefined

    if (targetId) {
      const targetPill = pillPool.find((p) => p.id === targetId)
      if (targetPill) {
        targetInfo = `Pilula #${pillPool.indexOf(targetPill) + 1}`
      }
    }

    openItemEffect(itemType, targetInfo)
  }, [currentTurn, players, pillPool, openItemEffect, toast, opponentId, startConsumption])

  // Handler para click em item do inventario
  const handleItemClick = useCallback((itemId: string) => {
    if (!isHumanTurn || isProcessing || isRoundEnding) return

    // Busca o item para verificar o tipo
    const item = currentPlayer.inventory.items.find((i) => i.id === itemId)
    if (!item) return

    const itemDef = ITEM_CATALOG[item.type]

    // Inicia o uso (para self/table/opponent, executa imediatamente)
    startUsage(itemId)

    // Para itens self/table/opponent, mostra toast e overlay de feedback apos execucao
    if (itemDef.targetType === 'self' || itemDef.targetType === 'table' || itemDef.targetType === 'opponent') {
      toast.item(item.type, currentTurn)
      openItemEffect(item.type)
    }
  }, [isHumanTurn, isProcessing, isRoundEnding, currentPlayer.inventory.items, startUsage, openItemEffect, toast])

  // Hook da IA - joga automaticamente quando e turno dela
  useAIPlayer({
    currentPlayer,
    pillPool,
    phase,
    gamePhase,
    startConsumption,
    executeItem: executeItemForAI,
    opponentId,
  })

  // Handler para click na pilula
  const handlePillSelect = (pillId: string) => {
    // Se esta selecionando alvo para um item, executa o item com feedback
    if (isSelectingTarget && validTargets === 'pills') {
      executeItemWithFeedback(pillId)
      return
    }

    // Comportamento normal: consumir pilula
    if (isProcessing) return
    if (!isHumanTurn) return // IA escolhe automaticamente
    startConsumption(pillId)
  }

  // Determina animacao do jogador baseado no efeito
  const getPlayerAnimation = (playerId: 'player1' | 'player2') => {
    if (phase !== 'feedback' || targetPlayer !== playerId) return null

    if (feedbackType === 'collapse') return 'collapse'
    if (feedbackType === 'damage' || feedbackType === 'fatal') return 'damage'
    if (feedbackType === 'heal') return 'heal'
    return null
  }

  // Calcula o valor do efeito para FloatingNumber (negativo para dano, positivo para cura/vida)
  const getEffectValue = (playerId: 'player1' | 'player2'): number | null => {
    if (phase !== 'feedback' || targetPlayer !== playerId) return null
    if (!effect) return null

    if (effect.damageDealt > 0) return -effect.damageDealt
    if (effect.healReceived > 0) return effect.healReceived
    if (effect.livesRestored > 0) return effect.livesRestored
    return null
  }

  // Determina o tipo de efeito para FloatingNumber (resistance ou life)
  const getEffectType = (playerId: 'player1' | 'player2'): 'resistance' | 'life' => {
    if (phase !== 'feedback' || targetPlayer !== playerId) return 'resistance'
    if (!effect) return 'resistance'

    if (effect.livesRestored > 0) return 'life'
    return 'resistance'
  }

  // Verifica se o quest do jogador foi resetado recentemente (para animacao de shake)
  const isQuestResetRecent = (playerId: PlayerId): boolean => {
    if (!lastQuestReset) return false
    if (lastQuestReset.playerId !== playerId) return false
    return Date.now() - lastQuestReset.timestamp < QUEST_RESET_ANIMATION_DURATION
  }

  if (!player1 || !player2) return null

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Turn Indicator no topo */}
      <TurnIndicator
        currentPlayer={currentPlayer}
        round={round}
        isHumanTurn={isHumanTurn}
      />

      {/* Layout principal: Player1 | Pills | Player2 */}
      <div className="flex flex-col-reverse md:grid md:grid-cols-[1fr_3fr_1fr] gap-6 md:items-start">
        {/* Player 1 - Esquerda (card auto-suficiente) */}
        <AnimatedPlayerArea
          player={player1}
          isCurrentTurn={currentTurn === 'player1'}
          animationType={getPlayerAnimation('player1')}
          effectValue={getEffectValue('player1')}
          effectType={getEffectType('player1')}
          onItemClick={handleItemClick}
          usingItemId={selectedItemId}
          quest={shapeQuests.player1}
          questJustReset={isQuestResetRecent('player1')}
          onToggleStore={() => toggleWantsStore('player1')}
        />

        {/* Pill Pool - Centro */}
        <PillPool
          pills={pillPool}
          typeCounts={typeCounts}
          round={round}
          onSelectPill={handlePillSelect}
          disabled={isProcessing || (!isHumanTurn && !isSelectingTarget) || isRoundEnding}
          isTargetSelectionMode={isSelectingTarget && validTargets === 'pills'}
          scannedPillIds={revealedPills}
          instructionMessage={
            isSelectingTarget && validTargets === 'pills'
              ? 'Selecione uma pilula alvo'
              : isRoundEnding
                ? 'Preparando proxima rodada...'
                : isHumanTurn
                  ? 'Clique em uma pilula para consumi-la'
                  : 'Aguardando IA...'
          }
        />

        {/* Player 2 - Direita (card auto-suficiente) */}
        <AnimatedPlayerArea
          player={player2}
          isCurrentTurn={currentTurn === 'player2'}
          animationType={getPlayerAnimation('player2')}
          effectValue={getEffectValue('player2')}
          effectType={getEffectType('player2')}
          quest={shapeQuests.player2}
          questJustReset={isQuestResetRecent('player2')}
          onToggleStore={() => toggleWantsStore('player2')}
        />
      </div>

      {/* Overlay de selecao de alvo para itens */}
      <ItemTargetSelector />
    </div>
  )
}
