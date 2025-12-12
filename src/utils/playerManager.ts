import type { Player, PlayerConfig, PlayerId } from '@/types'

/**
 * Funcoes puras para gerenciamento de jogadores em partidas N-jogadores
 *
 * @see .specs/refactor-game-store/plan.md
 */

/**
 * Cria estado inicial de jogadores a partir de configs
 *
 * @param playerConfigs - Array de configuracoes de jogadores
 * @returns Record de players indexado por PlayerId
 *
 * @example
 * createInitialPlayersState([
 *   { name: 'Alice', lives: 3, resistance: 6, isAI: false },
 *   { name: 'Bob', lives: 3, resistance: 6, isAI: true },
 * ])
 * // => { player1: Player, player2: Player }
 */
export function createInitialPlayersState(
    playerConfigs: PlayerConfig[]
): Record<PlayerId, Player> {
    const players: Record<PlayerId, Player> = {}

    playerConfigs.forEach((config, index) => {
        const playerId = generatePlayerId(index)
        players[playerId] = createPlayerFromConfig(playerId, config)
    })

    return players
}

/**
 * Cria um Player a partir de PlayerConfig
 *
 * @param id - ID do jogador (session-based)
 * @param config - Configuracao do jogador
 * @param userId - ID do usuario autenticado (null para guest/bot)
 * @returns Player inicializado
 */
export function createPlayerFromConfig(
    id: PlayerId,
    config: PlayerConfig,
    userId: string | null = null
): Player {
    return {
        id,
        userId,
        name: config.name,
        lives: config.lives,
        maxLives: config.lives,
        resistance: config.resistance,
        maxResistance: config.resistance,
        isAI: config.isAI,
        inventory: {
            items: [],
            maxItems: 5,
        },
        effects: [],
        pillCoins: 0,
        wantsStore: false,
    }
}

/**
 * Valida se string e um PlayerId valido
 */
export function isValidPlayerId(id: string): id is PlayerId {
    return typeof id === 'string' && id.length > 0
}

/**
 * Gera PlayerId baseado em indice (player1, player2, ...)
 * @param index - Indice base 0
 */
export function generatePlayerId(index: number): PlayerId {
    return `player${index + 1}`
}

/**
 * Extrai lista de playerIds sem impor semântica de ordem.
 *
 * Regra de Ouro: este helper NÃO deve ordenar por PlayerId.
 *
 * @param players - Record de jogadores
 * @returns Array de PlayerIds na ordem natural das chaves (sem sort)
 *
 * @example
 * getPlayerIdsUnordered({ player2: ..., player1: ... })
 * // => ['player2', 'player1'] (depende da ordem de inserção)
 */
export function getPlayerIdsUnordered(
    players: Record<PlayerId, Player>
): PlayerId[] {
    return Object.keys(players) as PlayerId[]
}

/**
 * Extrai lista ordenada de playerIds de um Record de players
 *
 * @param players - Record de jogadores
 * @returns Array de PlayerIds em ordem (player1, player2, ...)
 *
 * @example
 * getPlayerIds({ player2: ..., player1: ... })
 * // => ['player1', 'player2']
 *
 * @deprecated NUNCA use isso como fonte de ordem de UI/turnos. Use `playerOrder`.
 */
export function getPlayerIds(
    players: Record<PlayerId, Player>
): PlayerId[] {
    return getPlayerIdsUnordered(players).sort((a, b) => {
        // Extrai numero do playerId (player1 -> 1, player2 -> 2)
        const numA = parseInt(a.replace('player', ''), 10) || 0
        const numB = parseInt(b.replace('player', ''), 10) || 0
        return numA - numB
    })
}

/**
 * Filtra e retorna apenas jogadores vivos (lives > 0)
 *
 * @param players - Record de jogadores
 * @returns Array de PlayerIds dos jogadores vivos
 *
 * @example
 * getAlivePlayers({
 *   player1: { lives: 2, ... },
 *   player2: { lives: 0, ... },
 *   player3: { lives: 1, ... },
 * })
 * // => ['player1', 'player3']
 */
export function getAlivePlayers(
    players: Record<PlayerId, Player>
): PlayerId[] {
    return getAlivePlayersUnordered(players)
}

/**
 * Filtra e retorna apenas jogadores vivos (lives > 0) sem impor ordem por PlayerId.
 *
 * @param players - Record de jogadores
 * @returns Array de PlayerIds dos jogadores vivos (ordem natural das chaves)
 */
export function getAlivePlayersUnordered(
    players: Record<PlayerId, Player>
): PlayerId[] {
    return getPlayerIdsUnordered(players).filter((id) => players[id].lives > 0)
}

/**
 * Conta jogadores vivos
 *
 * @param players - Record de jogadores
 * @returns Numero de jogadores com lives > 0
 */
export function countAlivePlayers(
    players: Record<PlayerId, Player>
): number {
    return getAlivePlayersUnordered(players).length
}

/**
 * Verifica se jogador esta vivo
 *
 * @param players - Record de jogadores
 * @param playerId - ID do jogador a verificar
 * @returns true se jogador existe e tem lives > 0
 */
export function isPlayerAlive(
    players: Record<PlayerId, Player>,
    playerId: PlayerId
): boolean {
    const player = players[playerId]
    return player !== undefined && player.lives > 0
}

