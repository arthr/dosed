import { useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { getAlivePlayers, getPlayerIds } from '@/utils/playerManager'
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
    return useMemo(() => getPlayerIds(players), [players])
}

/**
 * Hook para obter IDs de jogadores vivos
 * @returns Array de PlayerIds com lives > 0
 */
export function useAlivePlayerIds(): PlayerId[] {
    const players = useGameStore((state) => state.players)
    return useMemo(() => getAlivePlayers(players), [players])
}

/**
 * Hook para obter todos os jogadores como array
 * @returns Array de Players ordenado por ID
 */
export function usePlayersArray(): Player[] {
    const players = useGameStore((state) => state.players)
    return useMemo(() => {
        const ids = getPlayerIds(players)
        return ids.map((id) => players[id])
    }, [players])
}

/**
 * Hook para obter jogadores vivos como array
 * @returns Array de Players vivos
 */
export function useAlivePlayers(): Player[] {
    const players = useGameStore((state) => state.players)
    return useMemo(() => {
        const aliveIds = getAlivePlayers(players)
        return aliveIds.map((id) => players[id])
    }, [players])
}

/**
 * Hook para contar jogadores vivos
 */
export function useAliveCount(): number {
    const players = useGameStore((state) => state.players)
    return useMemo(() => getAlivePlayers(players).length, [players])
}

/**
 * @deprecated Use useTargetablePlayers() de '@/hooks/useTargetablePlayers'
 * Hook para obter o oponente do turno atual (apenas 2 jogadores)
 */
export function useOpponent(): Player {
    return useGameStore((state) => {
        const opponentId: PlayerId =
            state.currentTurn === 'player1' ? 'player2' : 'player1'
        return state.players[opponentId]
    })
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
 * @deprecated Use usePlayersArray() para N-player support
 * Hook para obter ambos os jogadores (retrocompatibilidade 2 players)
 */
export function usePlayers() {
    const player1 = useGameStore((state) => state.players.player1)
    const player2 = useGameStore((state) => state.players.player2)
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
