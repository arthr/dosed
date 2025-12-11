import { create } from 'zustand'
import type { PlayerEffect, PlayerEffectType, PlayerId } from '@/types'

/**
 * Estado dos efeitos de jogadores
 * Separado do Player para melhor escalabilidade e testabilidade
 * Suporta N jogadores (2 a MAX_ROOM_PLAYERS)
 *
 * @see ADR-001-store-decomposition.md
 */
interface EffectsState {
    /** Efeitos ativos por jogador (dinamico, inicializado por initializeForPlayers) */
    activeEffects: Record<PlayerId, PlayerEffect[]>
}

/**
 * Actions do store de efeitos
 */
interface EffectsActions {
    /**
     * Inicializa o store para N jogadores
     * Deve ser chamado no inicio da partida
     */
    initializeForPlayers: (playerIds: PlayerId[]) => void

    /**
     * Aplica um efeito a um jogador
     * Nao adiciona duplicatas do mesmo tipo
     */
    applyEffect: (playerId: PlayerId, effect: PlayerEffect) => void

    /**
     * Remove um tipo especifico de efeito do jogador
     */
    removeEffect: (playerId: PlayerId, effectType: PlayerEffectType) => void

    /**
     * Remove todos os efeitos de um tipo especifico de TODOS os jogadores
     * Usado no resetRound para remover shields
     */
    removeEffectFromAll: (effectType: PlayerEffectType) => void

    /**
     * Decrementa roundsRemaining de todos os efeitos do jogador
     * Remove efeitos que chegam a 0
     * NOTA: Shield NAO e decrementado (dura a rodada inteira)
     */
    decrementEffects: (playerId: PlayerId) => void

    /**
     * Verifica se jogador tem um efeito ativo
     */
    hasEffect: (playerId: PlayerId, effectType: PlayerEffectType) => boolean

    /**
     * Obtem todos os efeitos de um jogador
     */
    getEffects: (playerId: PlayerId) => PlayerEffect[]

    /**
     * Obtem um efeito especifico de um jogador
     */
    getEffect: (playerId: PlayerId, effectType: PlayerEffectType) => PlayerEffect | undefined

    /**
     * Limpa todos os efeitos de um jogador
     */
    clearEffects: (playerId: PlayerId) => void

    /**
     * Reseta o store para estado inicial (vazio)
     */
    reset: () => void
}

type EffectsStore = EffectsState & EffectsActions

/**
 * Estado inicial - vazio, sera populado por initializeForPlayers
 */
const initialState: EffectsState = {
    activeEffects: {},
}

/**
 * Helper para obter efeitos de um jogador com fallback para array vazio
 */
function getPlayerEffects(state: EffectsState, playerId: PlayerId): PlayerEffect[] {
    return state.activeEffects[playerId] ?? []
}

/**
 * Zustand Store para gerenciamento de efeitos de jogadores
 *
 * Efeitos suportados:
 * - shield: Imunidade a dano por 1 rodada
 * - handcuffed: Perde proximo turno
 */
export const useEffectsStore = create<EffectsStore>((set, get) => ({
    ...initialState,

    initializeForPlayers: (playerIds) => {
        const activeEffects: Record<PlayerId, PlayerEffect[]> = {}
        playerIds.forEach((id) => {
            activeEffects[id] = []
        })
        set({ activeEffects })
    },

    applyEffect: (playerId, effect) => {
        const state = get()
        const playerEffects = getPlayerEffects(state, playerId)

        // Evita duplicatas do mesmo tipo
        const hasEffect = playerEffects.some((e) => e.type === effect.type)
        if (hasEffect) return

        set({
            activeEffects: {
                ...state.activeEffects,
                [playerId]: [...playerEffects, effect],
            },
        })
    },

    removeEffect: (playerId, effectType) => {
        const state = get()
        const playerEffects = getPlayerEffects(state, playerId)

        set({
            activeEffects: {
                ...state.activeEffects,
                [playerId]: playerEffects.filter((e) => e.type !== effectType),
            },
        })
    },

    removeEffectFromAll: (effectType) => {
        const state = get()
        const updatedEffects: Record<PlayerId, PlayerEffect[]> = {}

        // Itera sobre TODOS os jogadores dinamicamente
        Object.keys(state.activeEffects).forEach((playerId) => {
            updatedEffects[playerId] = state.activeEffects[playerId].filter(
                (e) => e.type !== effectType
            )
        })

        set({ activeEffects: updatedEffects })
    },

    decrementEffects: (playerId) => {
        const state = get()
        const playerEffects = getPlayerEffects(state, playerId)

        const updatedEffects = playerEffects
            .map((effect) => {
                // Shield dura a rodada inteira, nao decrementa por turno
                if (effect.type === 'shield') {
                    return effect
                }
                return {
                    ...effect,
                    roundsRemaining: effect.roundsRemaining - 1,
                }
            })
            .filter((effect) => effect.roundsRemaining > 0)

        set({
            activeEffects: {
                ...state.activeEffects,
                [playerId]: updatedEffects,
            },
        })
    },

    hasEffect: (playerId, effectType) => {
        const state = get()
        return getPlayerEffects(state, playerId).some((e) => e.type === effectType)
    },

    getEffects: (playerId) => {
        return getPlayerEffects(get(), playerId)
    },

    getEffect: (playerId, effectType) => {
        return getPlayerEffects(get(), playerId).find((e) => e.type === effectType)
    },

    clearEffects: (playerId) => {
        const state = get()

        set({
            activeEffects: {
                ...state.activeEffects,
                [playerId]: [],
            },
        })
    },

    reset: () => {
        set(initialState)
    },
}))

// ============ HOOKS HELPERS ============

/**
 * Hook para obter efeitos de um jogador especifico
 */
export const usePlayerEffects = (playerId: PlayerId) =>
    useEffectsStore((state) => state.activeEffects[playerId] ?? [])

/**
 * Hook para verificar se jogador tem shield
 */
export const useHasShield = (playerId: PlayerId) =>
    useEffectsStore((state) =>
        (state.activeEffects[playerId] ?? []).some((e) => e.type === 'shield')
    )

/**
 * Hook para verificar se jogador esta algemado
 */
export const useIsHandcuffed = (playerId: PlayerId) =>
    useEffectsStore((state) =>
        (state.activeEffects[playerId] ?? []).some((e) => e.type === 'handcuffed')
    )

/**
 * Hook para obter efeito de shield (se existir)
 */
export const useShieldEffect = (playerId: PlayerId) =>
    useEffectsStore((state) =>
        (state.activeEffects[playerId] ?? []).find((e) => e.type === 'shield')
    )

/**
 * Hook para obter efeito de handcuffs (se existir)
 */
export const useHandcuffedEffect = (playerId: PlayerId) =>
    useEffectsStore((state) =>
        (state.activeEffects[playerId] ?? []).find((e) => e.type === 'handcuffed')
    )
