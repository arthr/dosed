import { useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useGameFlowStore, usePlayerOrder } from '@/stores/game/gameFlowStore'
import { getTargetablePlayers } from '@/utils/turnManager'
import type { Player, PlayerId } from '@/types'

/**
 * Hook para selecionar estado do jogo de forma otimizada
 * Cada selector e separado para evitar re-renders desnecessarios
 */

// Selectors individuais para granularidade fina
export const useGamePhase = () => useGameStore((state) => state.phase)
export const useCurrentTurn = () => useGameStore((state) => state.currentTurn)
export const useRound = () => useGameStore((state) => state.round)
export const useWinner = () => useGameStore((state) => state.winner)
export const usePillPool = () => useGameStore((state) => state.pillPool)
export const useTypeCounts = () => useGameStore((state) => state.typeCounts)

/**
 * Hook para obter um jogador especifico
 */
export function usePlayer(playerId: PlayerId): Player | undefined {
    return useGameStore((state) => state.players[playerId])
}

/**
 * Hook para obter o jogador do turno atual
 */
export function useCurrentPlayer(): Player {
    return useGameStore((state) => state.players[state.currentTurn])
}

/**
 * Hook para obter todos os IDs de jogadores
 * @returns Array ordenado de PlayerIds
 */
export function usePlayerIds(): PlayerId[] {
    const players = useGameStore((state) => state.players)
    const playerOrder = useGameFlowStore((state) => state.playerOrder)

    return useMemo(() => {
        const fallbackIds = Object.keys(players) as PlayerId[]
        const ordered = (playerOrder.length > 0 ? playerOrder : fallbackIds)
            .filter((id) => players[id] !== undefined)
        return ordered
    }, [players, playerOrder])
}

/**
 * Hook para obter IDs de jogadores vivos
 * @returns Array de PlayerIds com lives > 0
 */
export function useAlivePlayerIds(): PlayerId[] {
    const players = useGameStore((state) => state.players)
    const playerIds = usePlayerIds()

    return useMemo(() => {
        return playerIds.filter((id) => players[id]?.lives > 0)
    }, [playerIds, players])
}

/**
 * Hook para obter todos os jogadores como array
 * @returns Array de Players ordenado por ID
 */
export function usePlayersArray(): Player[] {
    const players = useGameStore((state) => state.players)
    const playerOrder = useGameFlowStore((state) => state.playerOrder)
    return useMemo(() => {
        const ids = Object.keys(players) as PlayerId[]
        // Preferir ordem explícita do gameFlowStore quando disponível
        const orderedIds = (playerOrder.length > 0 ? playerOrder : ids)
            .filter((id) => players[id] !== undefined)
        return orderedIds.map((id) => players[id]).filter((p): p is Player => p !== undefined)
    }, [players, playerOrder])
}

/**
 * Hook para obter jogadores vivos como array
 * @returns Array de Players vivos
 */
export function useAlivePlayers(): Player[] {
    const players = useGameStore((state) => state.players)
    const playerOrder = useGameFlowStore((state) => state.playerOrder)
    return useMemo(() => {
        const ids = Object.keys(players) as PlayerId[]
        const orderedIds = (playerOrder.length > 0 ? playerOrder : ids)
            .filter((id) => players[id] !== undefined)
        const aliveIds = orderedIds.filter((id) => players[id]?.lives > 0)
        return aliveIds.map((id) => players[id]).filter((p): p is Player => p !== undefined)
    }, [players, playerOrder])
}

/**
 * Hook para contar jogadores vivos
 */
export function useAliveCount(): number {
    const aliveIds = useAlivePlayerIds()
    return aliveIds.length
}

/**
 * @deprecated Use useTargetablePlayers() de '@/hooks/useTargetablePlayers'
 * Hook para obter o oponente do turno atual (apenas 2 jogadores)
 */
export function useOpponent(): Player {
    const currentTurn = useGameStore((state) => state.currentTurn)
    const players = useGameStore((state) => state.players)
    
    return useMemo(() => {
        const fallbackIds = Object.keys(players) as PlayerId[]
        const playerOrder = useGameFlowStore.getState().playerOrder
        const allPlayerIds = (playerOrder.length > 0 ? playerOrder : fallbackIds)
            .filter((id) => players[id] !== undefined)
        const alivePlayerIds = allPlayerIds.filter((id) => players[id]?.lives > 0)
        const targetable = getTargetablePlayers(currentTurn, allPlayerIds, alivePlayerIds)
        const opponentId = targetable[0] ?? allPlayerIds[0]
        return players[opponentId]
    }, [currentTurn, players])
}

/**
 * Hook para verificar se e turno do jogador humano
 */
export function useIsHumanTurn(): boolean {
    return useGameStore((state) => {
        const currentPlayer = state.players[state.currentTurn]
        return currentPlayer ? !currentPlayer.isAI : false
    })
}

/**
 * Hook para verificar se jogador especifico esta vivo
 */
export function useIsPlayerAlive(playerId: PlayerId): boolean {
    const player = useGameStore((state) => state.players[playerId])
    return player ? player.lives > 0 : false
}

/**
 * @deprecated Use usePlayersArray() para suporte dinâmico a N players
 * Hook legado para obter jogadores por posição (assume 2 jogadores)
 * Retorna primeiro e segundo jogador baseado em playerOrder
 */
export function usePlayers() {
    const players = useGameStore((state) => state.players)
    const playerOrder = usePlayerOrder()
    
    // Retorna primeiro e segundo jogador baseado em playerOrder (não em chaves hardcoded)
    const player1 = playerOrder[0] ? players[playerOrder[0]] : undefined
    const player2 = playerOrder[1] ? players[playerOrder[1]] : undefined
    
    return { player1, player2 }
}

/**
 * Hook para obter estatisticas do jogo
 */
export function useGameStats() {
    const getGameStats = useGameStore((state) => state.getGameStats)
    return getGameStats()
}

/**
 * Hook composto para estado completo do jogo (usar com cuidado - causa mais re-renders)
 */
export function useGameSnapshot() {
    const phase = useGamePhase()
    const currentTurn = useCurrentTurn()
    const round = useRound()
    const winner = useWinner()
    const pillPool = usePillPool()
    const typeCounts = useTypeCounts()
    const players = usePlayersArray()
    const alivePlayers = useAlivePlayers()
    const isHumanTurn = useIsHumanTurn()

    return {
        phase,
        currentTurn,
        round,
        winner,
        pillPool,
        typeCounts,
        players,
        alivePlayers,
        isHumanTurn,
    }
}
