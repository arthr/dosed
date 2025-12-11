import { useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { getTargetablePlayers } from '@/utils/turnManager'
import { getAlivePlayers, getPlayerIds } from '@/utils/playerManager'
import type { PlayerId } from '@/types'

/**
 * Hook para obter jogadores que podem ser alvos de acoes
 * Substitui logica hardcoded de "oponente" para suportar N jogadores
 *
 * @returns Array de PlayerIds que podem ser alvos (exclui jogador atual e eliminados)
 *
 * @example
 * // Em jogo 1v1: retorna ['player2'] se player1 esta jogando
 * // Em jogo 4 players: retorna ['player2', 'player3', 'player4'] se player1 jogando
 * // Se player2 eliminado: retorna ['player3', 'player4']
 */
export function useTargetablePlayers(): PlayerId[] {
    const currentTurn = useGameStore((state) => state.currentTurn)
    const players = useGameStore((state) => state.players)

    return useMemo(() => {
        const allPlayerIds = getPlayerIds(players)
        const alivePlayerIds = getAlivePlayers(players)

        return getTargetablePlayers(currentTurn, allPlayerIds, alivePlayerIds)
    }, [currentTurn, players])
}

/**
 * Hook para obter o primeiro jogador alvo disponivel
 * Util para acoes que precisam de um alvo padrao
 *
 * @returns PlayerId do primeiro alvo ou null se nenhum disponivel
 *
 * @deprecated Prefira useTargetablePlayers() para logica N-player correta
 */
export function useFirstTargetablePlayer(): PlayerId | null {
    const targetable = useTargetablePlayers()
    return targetable[0] ?? null
}

/**
 * Hook para verificar se um jogador especifico pode ser alvo
 *
 * @param playerId - ID do jogador a verificar
 * @returns true se o jogador pode ser alvo
 */
export function useIsTargetable(playerId: PlayerId): boolean {
    const targetable = useTargetablePlayers()
    return targetable.includes(playerId)
}

/**
 * Hook para obter contagem de alvos disponiveis
 *
 * @returns Numero de jogadores que podem ser alvos
 */
export function useTargetableCount(): number {
    const targetable = useTargetablePlayers()
    return targetable.length
}

/**
 * @deprecated Use useTargetablePlayers() para N-player support
 * Mantido para retrocompatibilidade - retorna primeiro oponente
 */
export function useOpponentId(): PlayerId | null {
    return useFirstTargetablePlayer()
}

