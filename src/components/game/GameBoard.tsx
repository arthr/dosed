import { useCallback, useState, useMemo } from 'react'
import { LogOut } from 'lucide-react'
import { useGameBoardState } from '@/hooks/useGameBoardState'
import { usePillConsumption } from '@/hooks/usePillConsumption'
import { useAIPlayer } from '@/hooks/useAIPlayer'
import { useAIStore } from '@/hooks/useAIStore'
import { useItemUsage, useToast, useMultiplayer, usePlayerIds } from '@/hooks'
import { useTargetablePlayers } from '@/hooks/useTargetablePlayers'
import { AnimatedPlayerArea } from './AnimatedPlayerArea'
import { PillPool } from './PillPool'
import { TurnIndicator } from './TurnIndicator'
import { ItemTargetSelector } from './ItemTargetSelector'
import { ForfeitDialog } from '@/components/multiplayer'
import { Button } from '@/components/ui/8bit/button'
import { useItemCatalog } from '@/hooks'
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
  // Estado encapsulado via hook (Regra de Ouro #2)
  const {
    players,
    currentTurn,
    pillPool,
    typeCounts,
    round,
    gamePhase,
    revealedPills,
    mode,
    shapeQuests,
    lastQuestReset,
    toggleWantsStore,
    executeItemById,
    openItemEffect,
  } = useGameBoardState()

  // Multiplayer - verifica se pode interagir
  const { isMultiplayer, isLocalTurn, canInteract, localPlayerId } = useMultiplayer()

  // Catálogo de itens via hook (mantém fronteiras)
  const { ITEM_CATALOG } = useItemCatalog()

  // Preparacao para UI N-jogadores:
  // - playerIds: ordem estavel para renderizacao (player1, player2, ...)
  // - playerCount: quantidade de jogadores
  // - localPid: perspectiva do jogador local (multiplayer) ou player1 (single)
  const playerIds = usePlayerIds()

  const playerCount = playerIds.length
  const rawLocalPid: PlayerId = isMultiplayer && localPlayerId ? localPlayerId : 'player1'
  const localPid: PlayerId = playerIds.includes(rawLocalPid)
    ? rawLocalPid
    : (playerIds[0] ?? rawLocalPid)
  const remotePid = useMemo((): PlayerId => {
    const candidate = playerIds.find((id) => id !== localPid)
    // Evita "inventar" player2 quando não existir (ex.: estados incompletos/tests)
    return candidate ?? (playerIds[0] ?? localPid)
  }, [playerIds, localPid])

  // Lista de jogadores para renderizacao (suporta 2-4)
  const playersForRender = useMemo(() => {
    return playerIds.map((id) => ({
      id,
      player: players[id],
      isLocal: id === localPid,
    }))
  }, [playerIds, players, localPid])

  const localPlayerData = playersForRender.find((p) => p.isLocal) ?? playersForRender[0]
  const remotePlayers = playersForRender.filter((p) => !p.isLocal)

  // Aliases para o branch de 2 jogadores (mantem layout/perspectiva antiga)
  const localPlayer = localPlayerData?.player
  const remotePlayer = remotePlayers[0]?.player ?? players[remotePid]
  const localId: PlayerId = localPlayerData?.id ?? localPid
  const remoteId: PlayerId = remotePlayers[0]?.id ?? remotePid

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

  // Estado do dialog de saida
  const [showForfeitDialog, setShowForfeitDialog] = useState(false)

  // Em multiplayer, so pode interagir se for turno local
  // Em single player, pode interagir se for turno humano
  const canPlayerInteract = isMultiplayer ? canInteract : isHumanTurn

  // Hook de comportamento da IA na loja
  useAIStore()

  // Hook de uso de itens
  const {
    isSelectingTarget,
    validTargets,
    selectedItemId,
    selectedItemType,
    startUsage,
    executeItem,
  } = useItemUsage()

  // Toast para feedback de item
  const { toast } = useToast()

  // Determina ID do oponente usando hook (suporta N-jogadores)
  const targetablePlayers = useTargetablePlayers()
  const opponentId = targetablePlayers[0] ?? remotePlayers[0]?.id ?? remotePid // Primeiro alvo ou fallback

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

    // Executa o item por ID (encapsulado via hook do GameBoard)
    executeItemById(itemId, targetId)

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
  }, [currentTurn, players, pillPool, openItemEffect, toast, opponentId, startConsumption, executeItemById])

  // Handler para click em item do inventario
  const handleItemClick = useCallback((itemId: string) => {
    if (!canPlayerInteract || isProcessing || isRoundEnding) return

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
  }, [canPlayerInteract, isProcessing, isRoundEnding, currentPlayer.inventory.items, startUsage, openItemEffect, toast, currentTurn])

  // Hook da IA - joga automaticamente quando e turno dela
  useAIPlayer({
    currentPlayer,
    pillPool,
    phase,
    gamePhase,
    mode,
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
    if (!canPlayerInteract) return // Nao e turno do jogador local ou IA escolhe automaticamente
    startConsumption(pillId)
  }

  // Determina animacao do jogador baseado no efeito
  const getPlayerAnimation = (playerId: PlayerId) => {
    if (phase !== 'feedback' || targetPlayer !== playerId) return null

    if (feedbackType === 'collapse') return 'collapse'
    if (feedbackType === 'damage' || feedbackType === 'fatal') return 'damage'
    if (feedbackType === 'heal') return 'heal'
    return null
  }

  // Calcula o valor do efeito para FloatingNumber (negativo para dano, positivo para cura/vida)
  const getEffectValue = (playerId: PlayerId): number | null => {
    if (phase !== 'feedback' || targetPlayer !== playerId) return null
    if (!effect) return null

    if (effect.damageDealt > 0) return -effect.damageDealt
    if (effect.healReceived > 0) return effect.healReceived
    if (effect.livesRestored > 0) return effect.livesRestored
    return null
  }

  // Determina o tipo de efeito para FloatingNumber (resistance ou life)
  const getEffectType = (playerId: PlayerId): 'resistance' | 'life' => {
    if (phase !== 'feedback' || targetPlayer !== playerId) return 'resistance'
    if (!effect) return 'resistance'

    if (effect.livesRestored > 0) return 'life'
    return 'resistance'
  }

  // Verifica se o quest do jogador foi resetado recentemente (para animacao de shake)
  const isQuestResetRecent = (playerId: PlayerId): boolean => {
    if (!lastQuestReset) return false
    if (lastQuestReset.playerId !== playerId) return false
    // eslint-disable-next-line react-hooks/purity
    return Date.now() - lastQuestReset.timestamp < QUEST_RESET_ANIMATION_DURATION
  }

  // Precisa de pelo menos 2 jogadores para renderizar o board
  if (playerCount < 2 || !localPlayerData) return null

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto relative">
      {/* Botao de sair (apenas multiplayer) */}
      {isMultiplayer && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-0 right-0 text-muted-foreground hover:text-destructive"
          onClick={() => setShowForfeitDialog(true)}
          title="Sair da partida"
        >
          <LogOut className="size-4" />
        </Button>
      )}

      {/* Turn Indicator no topo */}
      <TurnIndicator
        currentPlayer={currentPlayer}
        round={round}
        isHumanTurn={isHumanTurn}
        showWaitingForOpponent={isMultiplayer && !isLocalTurn}
      />

      {/* Layout principal (2-4 jogadores) */}
      {playerCount <= 2 ? (
        // 2 jogadores: preserva layout atual (perspectiva do jogador local: esquerda)
        <div className="flex flex-col-reverse md:grid md:grid-cols-[1fr_3fr_1fr] gap-6 md:items-start">
          {/* Jogador Local - Esquerda (card interativo) */}
          <AnimatedPlayerArea
            player={localPlayer}
            isCurrentTurn={currentTurn === localId}
            animationType={getPlayerAnimation(localId)}
            effectValue={getEffectValue(localId)}
            effectType={getEffectType(localId)}
            onItemClick={handleItemClick}
            usingItemId={selectedItemId}
            quest={shapeQuests[localId]}
            questJustReset={isQuestResetRecent(localId)}
            onToggleStore={() => toggleWantsStore(localId)}
          />

          {/* Pill Pool - Centro */}
          <PillPool
            pills={pillPool}
            typeCounts={typeCounts}
            round={round}
            onSelectPill={handlePillSelect}
            disabled={isProcessing || (!canPlayerInteract && !isSelectingTarget) || isRoundEnding}
            isTargetSelectionMode={isSelectingTarget && validTargets === 'pills'}
            scannedPillIds={revealedPills}
            instructionMessage={
              isSelectingTarget && validTargets === 'pills'
                ? 'Selecione uma pilula alvo'
                : isRoundEnding
                  ? 'Preparando proxima rodada...'
                  : canPlayerInteract
                    ? 'Clique em uma pilula para consumi-la'
                    : isMultiplayer && !isLocalTurn
                      ? 'Aguardando oponente...'
                      : 'Aguardando IA...'
            }
          />

          {/* Oponente - Direita (card do adversario) */}
          <AnimatedPlayerArea
            player={remotePlayer}
            isCurrentTurn={currentTurn === remoteId}
            animationType={getPlayerAnimation(remoteId)}
            effectValue={getEffectValue(remoteId)}
            effectType={getEffectType(remoteId)}
            quest={shapeQuests[remoteId]}
            questJustReset={isQuestResetRecent(remoteId)}
            onToggleStore={undefined}
          />
        </div>
      ) : (
        // 3-4 jogadores: grid 2xN com PillPool central
        <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:grid-rows-[auto_1fr_auto] md:items-start">
          {/* Topo - Esquerda: jogador local */}
          {localPlayerData && (
            <AnimatedPlayerArea
              player={localPlayerData.player}
              isCurrentTurn={currentTurn === localPlayerData.id}
              animationType={getPlayerAnimation(localPlayerData.id)}
              effectValue={getEffectValue(localPlayerData.id)}
              effectType={getEffectType(localPlayerData.id)}
              onItemClick={handleItemClick}
              usingItemId={selectedItemId}
              quest={shapeQuests[localPlayerData.id]}
              questJustReset={isQuestResetRecent(localPlayerData.id)}
              onToggleStore={() => toggleWantsStore(localPlayerData.id)}
            />
          )}

          {/* Topo - Direita: primeiro remoto */}
          {remotePlayers[0] && (
            <AnimatedPlayerArea
              player={remotePlayers[0].player}
              isCurrentTurn={currentTurn === remotePlayers[0].id}
              animationType={getPlayerAnimation(remotePlayers[0].id)}
              effectValue={getEffectValue(remotePlayers[0].id)}
              effectType={getEffectType(remotePlayers[0].id)}
              quest={shapeQuests[remotePlayers[0].id]}
              questJustReset={isQuestResetRecent(remotePlayers[0].id)}
              onToggleStore={undefined}
            />
          )}

          {/* Centro: Pill Pool (span full width) */}
          <div className="md:col-span-2 md:row-start-2">
            <PillPool
              pills={pillPool}
              typeCounts={typeCounts}
              round={round}
              onSelectPill={handlePillSelect}
              disabled={isProcessing || (!canPlayerInteract && !isSelectingTarget) || isRoundEnding}
              isTargetSelectionMode={isSelectingTarget && validTargets === 'pills'}
              scannedPillIds={revealedPills}
              instructionMessage={
                isSelectingTarget && validTargets === 'pills'
                  ? 'Selecione uma pilula alvo'
                  : isRoundEnding
                    ? 'Preparando proxima rodada...'
                    : canPlayerInteract
                      ? 'Clique em uma pilula para consumi-la'
                      : isMultiplayer && !isLocalTurn
                        ? 'Aguardando oponente...'
                        : 'Aguardando IA...'
              }
            />
          </div>

          {/* Base: 3o jogador centralizado (3 players) */}
          {playerCount === 3 && remotePlayers[1] && (
            <div className="md:col-span-2 md:row-start-3 flex justify-center">
              <div className="w-full max-w-md">
                <AnimatedPlayerArea
                  player={remotePlayers[1].player}
                  isCurrentTurn={currentTurn === remotePlayers[1].id}
                  animationType={getPlayerAnimation(remotePlayers[1].id)}
                  effectValue={getEffectValue(remotePlayers[1].id)}
                  effectType={getEffectType(remotePlayers[1].id)}
                  quest={shapeQuests[remotePlayers[1].id]}
                  questJustReset={isQuestResetRecent(remotePlayers[1].id)}
                  onToggleStore={undefined}
                />
              </div>
            </div>
          )}

          {/* Base: 3o e 4o jogadores (4 players) */}
          {playerCount >= 4 && remotePlayers[1] && (
            <AnimatedPlayerArea
              player={remotePlayers[1].player}
              isCurrentTurn={currentTurn === remotePlayers[1].id}
              animationType={getPlayerAnimation(remotePlayers[1].id)}
              effectValue={getEffectValue(remotePlayers[1].id)}
              effectType={getEffectType(remotePlayers[1].id)}
              quest={shapeQuests[remotePlayers[1].id]}
              questJustReset={isQuestResetRecent(remotePlayers[1].id)}
              onToggleStore={undefined}
            />
          )}
          {playerCount >= 4 && remotePlayers[2] && (
            <AnimatedPlayerArea
              player={remotePlayers[2].player}
              isCurrentTurn={currentTurn === remotePlayers[2].id}
              animationType={getPlayerAnimation(remotePlayers[2].id)}
              effectValue={getEffectValue(remotePlayers[2].id)}
              effectType={getEffectType(remotePlayers[2].id)}
              quest={shapeQuests[remotePlayers[2].id]}
              questJustReset={isQuestResetRecent(remotePlayers[2].id)}
              onToggleStore={undefined}
            />
          )}
        </div>
      )}

      {/* Overlay de selecao de alvo para itens */}
      <ItemTargetSelector />

      {/* Dialog de confirmacao para sair (multiplayer) */}
      <ForfeitDialog
        open={showForfeitDialog}
        onClose={() => setShowForfeitDialog(false)}
      />
    </div>
  )
}
