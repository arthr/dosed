import { create } from 'zustand'
import type { Pill, PillShape, PillType } from '@/types'
import {
    generatePillPool,
    countPillTypes,
    revealPill,
} from '@/utils/pillGenerator'
import { countPillShapes } from '@/utils/shapeProgression'

/**
 * Estado do pool de pilulas
 * Gerencia as pilulas disponiveis na mesa e suas contagens
 *
 * @see ADR-001-store-decomposition.md
 */
interface PillPoolState {
    /** Array de pilulas disponiveis na mesa */
    pillPool: Pill[]
    /** Contagem publica de tipos de pilulas (sem revelar quais sao) */
    typeCounts: Record<PillType, number>
    /** Contagem de shapes das pilulas */
    shapeCounts: Record<PillShape, number>
    /** IDs de pilulas que foram reveladas (via Scanner) */
    revealedPills: string[]
}

/**
 * Actions do store de pilulas
 */
interface PillPoolActions {
    /**
     * Gera um novo pool de pilulas para a rodada
     * @param round - Numero da rodada (afeta quantidade e tipos)
     */
    generatePool: (round: number) => void

    /**
     * Define o pool diretamente (para sync multiplayer)
     * @param pills - Array de pilulas
     */
    setPool: (pills: Pill[]) => void

    /**
     * Consome (remove) uma pilula do pool
     * @param pillId - ID da pilula a consumir
     * @returns A pilula consumida ou null se nao encontrada
     */
    consumePill: (pillId: string) => Pill | null

    /**
     * Revela uma pilula sem consumi-la
     * @param pillId - ID da pilula a revelar
     */
    revealPillById: (pillId: string) => void

    /**
     * Adiciona pilula a lista de reveladas (Scanner)
     */
    addRevealedPill: (pillId: string) => void

    /**
     * Remove pilula da lista de reveladas
     */
    removeRevealedPill: (pillId: string) => void

    /**
     * Limpa todas as pilulas reveladas
     */
    clearRevealedPills: () => void

    /**
     * Marca pilula como invertida (dano vira cura, cura vira dano)
     * @param pillId - ID da pilula
     */
    invertPill: (pillId: string) => void

    /**
     * Marca pilula como dobrada (efeito x2)
     * @param pillId - ID da pilula
     */
    doublePill: (pillId: string) => void

    /**
     * Remove todos os modificadores de uma pilula
     * @param pillId - ID da pilula
     */
    clearPillModifiers: (pillId: string) => void

    /**
     * Obtem uma pilula pelo ID
     * @param pillId - ID da pilula
     * @returns A pilula ou undefined se nao encontrada
     */
    getPill: (pillId: string) => Pill | undefined

    /**
     * Verifica se pilula esta na lista de reveladas
     * @param pillId - ID da pilula
     */
    isPillRevealed: (pillId: string) => boolean

    /**
     * Obtem quantidade de pilulas restantes
     */
    getRemainingCount: () => number

    /**
     * Verifica se pool esta vazio
     */
    isEmpty: () => boolean

    /**
     * Reseta o store para estado inicial
     */
    reset: () => void
}

type PillPoolStore = PillPoolState & PillPoolActions

/**
 * Contagens iniciais zeradas de tipos
 */
const INITIAL_TYPE_COUNTS: Record<PillType, number> = {
    SAFE: 0,
    DMG_LOW: 0,
    DMG_HIGH: 0,
    FATAL: 0,
    HEAL: 0,
    LIFE: 0,
}

/**
 * Contagens iniciais zeradas de shapes
 */
const INITIAL_SHAPE_COUNTS: Record<PillShape, number> = {
    capsule: 0,
    round: 0,
    triangle: 0,
    oval: 0,
    cross: 0,
    heart: 0,
    flower: 0,
    star: 0,
    pumpkin: 0,
    coin: 0,
    bear: 0,
    gem: 0,
    skull: 0,
    domino: 0,
    pineapple: 0,
    fruit: 0,
}

/**
 * Estado inicial
 */
const initialState: PillPoolState = {
    pillPool: [],
    typeCounts: { ...INITIAL_TYPE_COUNTS },
    shapeCounts: { ...INITIAL_SHAPE_COUNTS },
    revealedPills: [],
}

/**
 * Zustand Store para gerenciamento do pool de pilulas
 *
 * Responsabilidades:
 * - Pool de pilulas da mesa
 * - Contagens de tipos e shapes
 * - Revelacao de pilulas (Scanner)
 * - Modificadores (Inverter, Double)
 *
 * NAO gerencia:
 * - Aplicacao de efeitos no jogador (gameStore/playerStore)
 * - Transicao de fases (gameFlowStore)
 * - Quests de shapes (questStore)
 */
export const usePillPoolStore = create<PillPoolStore>((set, get) => ({
    ...initialState,

    generatePool: (round) => {
        const pillPool = generatePillPool(round)
        const typeCounts = countPillTypes(pillPool)
        const shapeCounts = countPillShapes(pillPool)

        set({
            pillPool,
            typeCounts,
            shapeCounts,
            revealedPills: [],
        })
    },

    setPool: (pills) => {
        const typeCounts = countPillTypes(pills)
        const shapeCounts = countPillShapes(pills)

        set({
            pillPool: pills,
            typeCounts,
            shapeCounts,
            revealedPills: [],
        })
    },

    consumePill: (pillId) => {
        const state = get()
        const pillIndex = state.pillPool.findIndex((p) => p.id === pillId)

        if (pillIndex === -1) return null

        const pill = state.pillPool[pillIndex]
        const newPillPool = state.pillPool.filter((p) => p.id !== pillId)

        // Atualiza contagens
        const newTypeCounts = { ...state.typeCounts }
        newTypeCounts[pill.type] = Math.max(0, newTypeCounts[pill.type] - 1)

        const newShapeCounts = { ...state.shapeCounts }
        newShapeCounts[pill.visuals.shape] = Math.max(0, newShapeCounts[pill.visuals.shape] - 1)

        // Remove da lista de reveladas se estava la
        const newRevealedPills = state.revealedPills.filter((id) => id !== pillId)

        set({
            pillPool: newPillPool,
            typeCounts: newTypeCounts,
            shapeCounts: newShapeCounts,
            revealedPills: newRevealedPills,
        })

        return pill
    },

    revealPillById: (pillId) => {
        const state = get()
        const pillIndex = state.pillPool.findIndex((p) => p.id === pillId)

        if (pillIndex === -1) return

        const newPillPool = [...state.pillPool]
        newPillPool[pillIndex] = revealPill(newPillPool[pillIndex])

        set({ pillPool: newPillPool })
    },

    addRevealedPill: (pillId) => {
        const state = get()

        // Evita duplicatas
        if (state.revealedPills.includes(pillId)) return

        set({
            revealedPills: [...state.revealedPills, pillId],
        })
    },

    removeRevealedPill: (pillId) => {
        const state = get()

        set({
            revealedPills: state.revealedPills.filter((id) => id !== pillId),
        })
    },

    clearRevealedPills: () => {
        set({ revealedPills: [] })
    },

    invertPill: (pillId) => {
        const state = get()
        const pillIndex = state.pillPool.findIndex((p) => p.id === pillId)

        if (pillIndex === -1) return

        const newPillPool = [...state.pillPool]
        newPillPool[pillIndex] = {
            ...newPillPool[pillIndex],
            inverted: !newPillPool[pillIndex].inverted,
        }

        set({ pillPool: newPillPool })
    },

    doublePill: (pillId) => {
        const state = get()
        const pillIndex = state.pillPool.findIndex((p) => p.id === pillId)

        if (pillIndex === -1) return

        const newPillPool = [...state.pillPool]
        newPillPool[pillIndex] = {
            ...newPillPool[pillIndex],
            doubled: true,
        }

        set({ pillPool: newPillPool })
    },

    clearPillModifiers: (pillId) => {
        const state = get()
        const pillIndex = state.pillPool.findIndex((p) => p.id === pillId)

        if (pillIndex === -1) return

        const newPillPool = [...state.pillPool]
        newPillPool[pillIndex] = {
            ...newPillPool[pillIndex],
            inverted: undefined,
            doubled: undefined,
        }

        set({ pillPool: newPillPool })
    },

    getPill: (pillId) => {
        const state = get()
        return state.pillPool.find((p) => p.id === pillId)
    },

    isPillRevealed: (pillId) => {
        const state = get()
        return state.revealedPills.includes(pillId)
    },

    getRemainingCount: () => {
        return get().pillPool.length
    },

    isEmpty: () => {
        return get().pillPool.length === 0
    },

    reset: () => {
        set(initialState)
    },
}))

// ============ HOOKS HELPERS ============

/**
 * Hook para obter pool de pilulas
 */
export const usePillPool = () =>
    usePillPoolStore((state) => state.pillPool)

/**
 * Hook para obter contagem de tipos
 */
export const useTypeCounts = () =>
    usePillPoolStore((state) => state.typeCounts)

/**
 * Hook para obter contagem de shapes
 */
export const useShapeCounts = () =>
    usePillPoolStore((state) => state.shapeCounts)

/**
 * Hook para obter pilulas reveladas
 */
export const useRevealedPills = () =>
    usePillPoolStore((state) => state.revealedPills)

/**
 * Hook para obter quantidade restante
 */
export const useRemainingPillCount = () =>
    usePillPoolStore((state) => state.pillPool.length)

/**
 * Hook para verificar se pool esta vazio
 */
export const useIsPillPoolEmpty = () =>
    usePillPoolStore((state) => state.pillPool.length === 0)

