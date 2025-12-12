import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type {
    Player,
    PlayerConfig,
    PlayerId,
    PlayerEffectResult,
    InventoryItem,
    ItemType,
} from '@/types'
import {
    createPlayerFromConfig,
    getAlivePlayers,
    countAlivePlayers,
    isPlayerAlive,
} from '@/utils/playerManager'
import { applyDamage, applyHeal } from '@/utils/gameLogic'

/**
 * Configuracao estendida do jogador com userId opcional
 */
interface PlayerSetupConfig extends PlayerConfig {
    /** ID do usuario autenticado (null para guest/bot) */
    userId?: string | null
}

/**
 * Estado dos jogadores
 * Gerencia vidas, resistencia, inventario e status de cada jogador
 *
 * @see ADR-001-store-decomposition.md
 */
interface PlayerState {
    /** Todos os jogadores na partida */
    players: Record<PlayerId, Player>
}

/**
 * Actions do store de jogadores
 */
interface PlayerActions {
    /**
     * Inicializa jogadores para a partida
     * @param configs - Configuracoes dos jogadores
     */
    initializePlayers: (configs: PlayerSetupConfig[]) => void

    /**
     * Obtem um jogador pelo ID
     * @param playerId - ID do jogador
     */
    getPlayer: (playerId: PlayerId) => Player | undefined

    /**
     * Aplica dano a um jogador
     * @param playerId - ID do jogador
     * @param amount - Quantidade de dano
     * @returns Resultado com novo estado e flags
     */
    applyDamageToPlayer: (playerId: PlayerId, amount: number) => PlayerEffectResult | null

    /**
     * Aplica cura a um jogador
     * @param playerId - ID do jogador
     * @param amount - Quantidade de cura
     * @returns Resultado com novo estado e flags
     */
    applyHealToPlayer: (playerId: PlayerId, amount: number) => PlayerEffectResult | null

    /**
     * Faz jogador perder 1 vida e reseta resistencia
     * @param playerId - ID do jogador
     * @returns true se jogador foi eliminado
     */
    loseLife: (playerId: PlayerId) => boolean

    /**
     * Adiciona vidas ao jogador (cap em maxLives)
     * @param playerId - ID do jogador
     * @param amount - Quantidade de vidas a ganhar
     * @returns Quantidade efetivamente ganha
     */
    gainLife: (playerId: PlayerId, amount: number) => number

    /**
     * Reseta resistencia ao maximo
     * @param playerId - ID do jogador
     */
    resetResistance: (playerId: PlayerId) => void

    /**
     * Define resistencia para um valor especifico
     * @param playerId - ID do jogador
     * @param value - Novo valor de resistencia
     */
    setResistance: (playerId: PlayerId, value: number) => void

    /**
     * Adiciona item ao inventario do jogador
     * @param playerId - ID do jogador
     * @param itemType - Tipo do item
     * @param itemId - ID opcional (para sync multiplayer)
     * @returns ID do item adicionado ou null se falhou
     */
    addItemToInventory: (playerId: PlayerId, itemType: ItemType, itemId?: string) => string | null

    /**
     * Remove item do inventario do jogador
     * @param playerId - ID do jogador
     * @param itemId - ID do item a remover
     */
    removeItemFromInventory: (playerId: PlayerId, itemId: string) => void

    /**
     * Limpa inventario do jogador
     * @param playerId - ID do jogador
     */
    clearInventory: (playerId: PlayerId) => void

    /**
     * Adiciona pillCoins ao jogador
     * @param playerId - ID do jogador
     * @param amount - Quantidade a adicionar
     */
    addPillCoins: (playerId: PlayerId, amount: number) => void

    /**
     * Remove pillCoins do jogador
     * @param playerId - ID do jogador
     * @param amount - Quantidade a remover
     * @returns true se tinha saldo suficiente
     */
    spendPillCoins: (playerId: PlayerId, amount: number) => boolean

    /**
     * Toggle wantsStore flag
     * @param playerId - ID do jogador
     */
    toggleWantsStore: (playerId: PlayerId) => void

    /**
     * Define wantsStore para todos os jogadores
     * @param value - Novo valor
     */
    setAllWantsStore: (value: boolean) => void

    /**
     * Atualiza campos arbitrarios de um jogador
     * @param playerId - ID do jogador
     * @param updates - Campos a atualizar
     */
    updatePlayer: (playerId: PlayerId, updates: Partial<Player>) => void

    /**
     * Obtem IDs de jogadores vivos
     */
    getAlivePlayerIds: () => PlayerId[]

    /**
     * Conta jogadores vivos
     */
    countAlive: () => number

    /**
     * Verifica se jogador esta vivo
     * @param playerId - ID do jogador
     */
    isAlive: (playerId: PlayerId) => boolean

    /**
     * Reseta store para estado inicial
     */
    reset: () => void
}

type PlayerStore = PlayerState & PlayerActions

/**
 * Estado inicial
 */
const initialState: PlayerState = {
    players: {},
}

/**
 * Zustand Store para gerenciamento de jogadores
 *
 * Responsabilidades:
 * - Estado de cada jogador (vidas, resistencia, inventario)
 * - Operacoes de dano/cura
 * - Gerenciamento de inventario
 * - PillCoins e wantsStore
 *
 * NAO gerencia:
 * - Efeitos ativos (effectsStore)
 * - Turnos e fases (gameFlowStore)
 * - Execucao de itens (gameStore/hooks)
 */
export const usePlayerStore = create<PlayerStore>((set, get) => ({
    ...initialState,

    initializePlayers: (configs) => {
        const players: Record<PlayerId, Player> = {}

        configs.forEach((config, index) => {
            const playerId = `player${index + 1}`
            players[playerId] = createPlayerFromConfig(playerId, config, config.userId ?? null)
        })

        set({ players })
    },

    getPlayer: (playerId) => {
        return get().players[playerId]
    },

    applyDamageToPlayer: (playerId, amount) => {
        const state = get()
        const player = state.players[playerId]
        if (!player) return null

        const result = applyDamage(player, amount)

        set({
            players: {
                ...state.players,
                [playerId]: result.player,
            },
        })

        return result
    },

    applyHealToPlayer: (playerId, amount) => {
        const state = get()
        const player = state.players[playerId]
        if (!player) return null

        const result = applyHeal(player, amount)

        set({
            players: {
                ...state.players,
                [playerId]: result.player,
            },
        })

        return result
    },

    loseLife: (playerId) => {
        const state = get()
        const player = state.players[playerId]
        if (!player) return false

        const newLives = player.lives - 1
        const eliminated = newLives <= 0

        set({
            players: {
                ...state.players,
                [playerId]: {
                    ...player,
                    lives: Math.max(0, newLives),
                    resistance: eliminated ? 0 : player.maxResistance,
                },
            },
        })

        return eliminated
    },

    gainLife: (playerId, amount) => {
        const state = get()
        const player = state.players[playerId]
        if (!player) return 0

        const maxGain = player.maxLives - player.lives
        const actualGain = Math.min(amount, maxGain)

        if (actualGain <= 0) return 0

        set({
            players: {
                ...state.players,
                [playerId]: {
                    ...player,
                    lives: player.lives + actualGain,
                },
            },
        })

        return actualGain
    },

    resetResistance: (playerId) => {
        const state = get()
        const player = state.players[playerId]
        if (!player) return

        set({
            players: {
                ...state.players,
                [playerId]: {
                    ...player,
                    resistance: player.maxResistance,
                },
            },
        })
    },

    setResistance: (playerId, value) => {
        const state = get()
        const player = state.players[playerId]
        if (!player) return

        set({
            players: {
                ...state.players,
                [playerId]: {
                    ...player,
                    resistance: Math.max(0, Math.min(value, player.maxResistance)),
                },
            },
        })
    },

    addItemToInventory: (playerId, itemType, itemId) => {
        const state = get()
        const player = state.players[playerId]
        if (!player) return null

        // Verifica limite
        if (player.inventory.items.length >= player.inventory.maxItems) {
            return null
        }

        const newItemId = itemId ?? uuidv4()
        const newItem: InventoryItem = {
            id: newItemId,
            type: itemType,
        }

        set({
            players: {
                ...state.players,
                [playerId]: {
                    ...player,
                    inventory: {
                        ...player.inventory,
                        items: [...player.inventory.items, newItem],
                    },
                },
            },
        })

        return newItemId
    },

    removeItemFromInventory: (playerId, itemId) => {
        const state = get()
        const player = state.players[playerId]
        if (!player) return

        set({
            players: {
                ...state.players,
                [playerId]: {
                    ...player,
                    inventory: {
                        ...player.inventory,
                        items: player.inventory.items.filter((item) => item.id !== itemId),
                    },
                },
            },
        })
    },

    clearInventory: (playerId) => {
        const state = get()
        const player = state.players[playerId]
        if (!player) return

        set({
            players: {
                ...state.players,
                [playerId]: {
                    ...player,
                    inventory: {
                        ...player.inventory,
                        items: [],
                    },
                },
            },
        })
    },

    addPillCoins: (playerId, amount) => {
        const state = get()
        const player = state.players[playerId]
        if (!player) return

        set({
            players: {
                ...state.players,
                [playerId]: {
                    ...player,
                    pillCoins: player.pillCoins + amount,
                },
            },
        })
    },

    spendPillCoins: (playerId, amount) => {
        const state = get()
        const player = state.players[playerId]
        if (!player || player.pillCoins < amount) return false

        set({
            players: {
                ...state.players,
                [playerId]: {
                    ...player,
                    pillCoins: player.pillCoins - amount,
                },
            },
        })

        return true
    },

    toggleWantsStore: (playerId) => {
        const state = get()
        const player = state.players[playerId]
        if (!player) return

        set({
            players: {
                ...state.players,
                [playerId]: {
                    ...player,
                    wantsStore: !player.wantsStore,
                },
            },
        })
    },

    setAllWantsStore: (value) => {
        const state = get()
        const updatedPlayers: Record<PlayerId, Player> = {}

        Object.entries(state.players).forEach(([id, player]) => {
            updatedPlayers[id] = { ...player, wantsStore: value }
        })

        set({ players: updatedPlayers })
    },

    updatePlayer: (playerId, updates) => {
        const state = get()
        const player = state.players[playerId]
        if (!player) return

        set({
            players: {
                ...state.players,
                [playerId]: {
                    ...player,
                    ...updates,
                },
            },
        })
    },

    getAlivePlayerIds: () => {
        return getAlivePlayers(get().players)
    },

    countAlive: () => {
        return countAlivePlayers(get().players)
    },

    isAlive: (playerId) => {
        return isPlayerAlive(get().players, playerId)
    },

    reset: () => {
        set(initialState)
    },
}))

// ============ HOOKS HELPERS ============

/**
 * Hook para obter todos os jogadores
 */
export const usePlayers = () =>
    usePlayerStore((state) => state.players)

/**
 * Hook para obter um jogador especifico
 */
export const usePlayer = (playerId: PlayerId) =>
    usePlayerStore((state) => state.players[playerId])

/**
 * Hook para obter IDs de jogadores vivos
 */
export const useAlivePlayerIds = () =>
    usePlayerStore((state) => getAlivePlayers(state.players))

/**
 * Hook para obter contagem de jogadores vivos
 */
export const useAliveCount = () =>
    usePlayerStore((state) => countAlivePlayers(state.players))

/**
 * Hook para obter inventario de um jogador
 */
export const usePlayerInventory = (playerId: PlayerId) =>
    usePlayerStore((state) => state.players[playerId]?.inventory)

/**
 * Hook para obter pillCoins de um jogador
 */
export const usePlayerPillCoins = (playerId: PlayerId) =>
    usePlayerStore((state) => state.players[playerId]?.pillCoins ?? 0)

/**
 * Hook para verificar se jogador quer ir a loja
 */
export const usePlayerWantsStore = (playerId: PlayerId) =>
    usePlayerStore((state) => state.players[playerId]?.wantsStore ?? false)

