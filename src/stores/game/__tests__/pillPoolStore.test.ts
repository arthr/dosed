import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePillPoolStore } from '../pillPoolStore'
import type { Pill, PillType, PillShape } from '@/types'

// Mock das funcoes de geracao
vi.mock('@/utils/pillGenerator', () => ({
    generatePillPool: vi.fn((round: number) => {
        // Retorna pool mockado baseado na rodada
        const count = 4 + round
        const pills: Pill[] = []
        for (let i = 0; i < count; i++) {
            pills.push(createMockPill(`pill-${i}`, 'SAFE', 'round'))
        }
        return pills
    }),
    countPillTypes: vi.fn((pills: Pill[]) => {
        const counts: Record<PillType, number> = {
            SAFE: 0, DMG_LOW: 0, DMG_HIGH: 0, FATAL: 0, HEAL: 0, LIFE: 0
        }
        for (const pill of pills) {
            counts[pill.type]++
        }
        return counts
    }),
    revealPill: vi.fn((pill: Pill) => ({
        ...pill,
        isRevealed: true,
        visuals: { ...pill.visuals, label: pill.type }
    })),
}))

vi.mock('@/utils/shapeProgression', () => ({
    countPillShapes: vi.fn((pills: Pill[]) => {
        const counts: Record<string, number> = {}
        for (const pill of pills) {
            const shape = pill.visuals.shape
            counts[shape] = (counts[shape] || 0) + 1
        }
        return counts
    }),
}))

/**
 * Cria uma pilula mock para testes
 */
function createMockPill(
    id: string,
    type: PillType = 'SAFE',
    shape: PillShape = 'round'
): Pill {
    return {
        id,
        type,
        isRevealed: false,
        stats: { damage: 0, isFatal: false, heal: 0, livesRestore: 0 },
        visuals: { color: '#888', shape, label: '???' },
    }
}

describe('pillPoolStore', () => {
    beforeEach(() => {
        usePillPoolStore.getState().reset()
        vi.clearAllMocks()
    })

    describe('estado inicial', () => {
        it('deve iniciar com pool vazio', () => {
            const state = usePillPoolStore.getState()
            expect(state.pillPool).toEqual([])
            expect(state.revealedPills).toEqual([])
        })

        it('deve iniciar com contagens zeradas', () => {
            const state = usePillPoolStore.getState()
            expect(state.typeCounts.SAFE).toBe(0)
            expect(state.typeCounts.FATAL).toBe(0)
            expect(state.shapeCounts.round).toBe(0)
        })
    })

    describe('generatePool', () => {
        it('deve gerar pool para rodada 1', () => {
            usePillPoolStore.getState().generatePool(1)

            const state = usePillPoolStore.getState()
            expect(state.pillPool.length).toBeGreaterThan(0)
        })

        it('deve limpar revealedPills ao gerar novo pool', () => {
            const store = usePillPoolStore.getState()

            // Adiciona pilula revelada
            store.setPool([createMockPill('pill-1')])
            store.addRevealedPill('pill-1')
            expect(usePillPoolStore.getState().revealedPills).toHaveLength(1)

            // Gera novo pool
            store.generatePool(1)

            expect(usePillPoolStore.getState().revealedPills).toHaveLength(0)
        })
    })

    describe('setPool', () => {
        it('deve definir pool diretamente', () => {
            const pills = [
                createMockPill('p1', 'SAFE'),
                createMockPill('p2', 'DMG_LOW'),
                createMockPill('p3', 'FATAL'),
            ]

            usePillPoolStore.getState().setPool(pills)

            const state = usePillPoolStore.getState()
            expect(state.pillPool).toHaveLength(3)
            expect(state.pillPool[0].id).toBe('p1')
        })

        it('deve atualizar contagens ao definir pool', () => {
            const pills = [
                createMockPill('p1', 'SAFE'),
                createMockPill('p2', 'SAFE'),
                createMockPill('p3', 'FATAL'),
            ]

            usePillPoolStore.getState().setPool(pills)

            const state = usePillPoolStore.getState()
            expect(state.typeCounts.SAFE).toBe(2)
            expect(state.typeCounts.FATAL).toBe(1)
        })

        it('deve limpar revealedPills ao definir pool', () => {
            const store = usePillPoolStore.getState()
            store.setPool([createMockPill('old-pill')])
            store.addRevealedPill('old-pill')

            store.setPool([createMockPill('new-pill')])

            expect(usePillPoolStore.getState().revealedPills).toHaveLength(0)
        })
    })

    describe('consumePill', () => {
        beforeEach(() => {
            usePillPoolStore.getState().setPool([
                createMockPill('p1', 'SAFE', 'round'),
                createMockPill('p2', 'DMG_LOW', 'flower'),
                createMockPill('p3', 'FATAL', 'skull'),
            ])
        })

        it('deve remover pilula do pool e retornar', () => {
            const pill = usePillPoolStore.getState().consumePill('p2')

            expect(pill).not.toBeNull()
            expect(pill?.id).toBe('p2')
            expect(pill?.type).toBe('DMG_LOW')

            const state = usePillPoolStore.getState()
            expect(state.pillPool).toHaveLength(2)
            expect(state.pillPool.find(p => p.id === 'p2')).toBeUndefined()
        })

        it('deve atualizar typeCounts ao consumir', () => {
            usePillPoolStore.getState().consumePill('p1')

            const state = usePillPoolStore.getState()
            expect(state.typeCounts.SAFE).toBe(0)
        })

        it('deve atualizar shapeCounts ao consumir', () => {
            usePillPoolStore.getState().consumePill('p1')

            const state = usePillPoolStore.getState()
            expect(state.shapeCounts.round).toBe(0)
        })

        it('deve remover da revealedPills se estava revelada', () => {
            const store = usePillPoolStore.getState()
            store.addRevealedPill('p2')

            store.consumePill('p2')

            expect(usePillPoolStore.getState().revealedPills).not.toContain('p2')
        })

        it('deve retornar null para pilula inexistente', () => {
            const pill = usePillPoolStore.getState().consumePill('inexistente')

            expect(pill).toBeNull()
            expect(usePillPoolStore.getState().pillPool).toHaveLength(3)
        })

        it('deve permitir consumir todas as pilulas', () => {
            const store = usePillPoolStore.getState()
            store.consumePill('p1')
            store.consumePill('p2')
            store.consumePill('p3')

            expect(usePillPoolStore.getState().pillPool).toHaveLength(0)
            expect(usePillPoolStore.getState().isEmpty()).toBe(true)
        })
    })

    describe('revealPillById', () => {
        beforeEach(() => {
            usePillPoolStore.getState().setPool([
                createMockPill('p1', 'SAFE'),
                createMockPill('p2', 'FATAL'),
            ])
        })

        it('deve revelar pilula no pool', () => {
            usePillPoolStore.getState().revealPillById('p1')

            const state = usePillPoolStore.getState()
            const pill = state.pillPool.find(p => p.id === 'p1')
            expect(pill?.isRevealed).toBe(true)
        })

        it('deve ignorar pilula inexistente', () => {
            usePillPoolStore.getState().revealPillById('inexistente')

            // Nao deve lancar erro
            expect(usePillPoolStore.getState().pillPool).toHaveLength(2)
        })
    })

    describe('revealedPills (Scanner)', () => {
        beforeEach(() => {
            usePillPoolStore.getState().setPool([
                createMockPill('p1'),
                createMockPill('p2'),
                createMockPill('p3'),
            ])
        })

        it('deve adicionar pilula a lista de reveladas', () => {
            usePillPoolStore.getState().addRevealedPill('p1')

            expect(usePillPoolStore.getState().revealedPills).toContain('p1')
            expect(usePillPoolStore.getState().isPillRevealed('p1')).toBe(true)
        })

        it('deve evitar duplicatas na lista', () => {
            const store = usePillPoolStore.getState()
            store.addRevealedPill('p1')
            store.addRevealedPill('p1')

            expect(usePillPoolStore.getState().revealedPills).toHaveLength(1)
        })

        it('deve remover pilula da lista', () => {
            const store = usePillPoolStore.getState()
            store.addRevealedPill('p1')
            store.addRevealedPill('p2')

            store.removeRevealedPill('p1')

            expect(usePillPoolStore.getState().revealedPills).not.toContain('p1')
            expect(usePillPoolStore.getState().revealedPills).toContain('p2')
        })

        it('deve limpar todas as reveladas', () => {
            const store = usePillPoolStore.getState()
            store.addRevealedPill('p1')
            store.addRevealedPill('p2')
            store.addRevealedPill('p3')

            store.clearRevealedPills()

            expect(usePillPoolStore.getState().revealedPills).toHaveLength(0)
        })

        it('isPillRevealed deve retornar false para nao-revelada', () => {
            expect(usePillPoolStore.getState().isPillRevealed('p1')).toBe(false)
        })
    })

    describe('pill modifiers (Inverter/Double)', () => {
        beforeEach(() => {
            usePillPoolStore.getState().setPool([
                createMockPill('p1', 'DMG_LOW'),
                createMockPill('p2', 'HEAL'),
            ])
        })

        describe('invertPill', () => {
            it('deve marcar pilula como invertida', () => {
                usePillPoolStore.getState().invertPill('p1')

                const pill = usePillPoolStore.getState().getPill('p1')
                expect(pill?.inverted).toBe(true)
            })

            it('deve alternar estado de inversao', () => {
                const store = usePillPoolStore.getState()
                store.invertPill('p1')
                store.invertPill('p1')

                const pill = usePillPoolStore.getState().getPill('p1')
                expect(pill?.inverted).toBe(false)
            })

            it('deve ignorar pilula inexistente', () => {
                usePillPoolStore.getState().invertPill('inexistente')
                // Nao deve lancar erro
                expect(usePillPoolStore.getState().pillPool).toHaveLength(2)
            })
        })

        describe('doublePill', () => {
            it('deve marcar pilula como dobrada', () => {
                usePillPoolStore.getState().doublePill('p1')

                const pill = usePillPoolStore.getState().getPill('p1')
                expect(pill?.doubled).toBe(true)
            })

            it('deve ignorar pilula inexistente', () => {
                usePillPoolStore.getState().doublePill('inexistente')
                // Nao deve lancar erro
                expect(usePillPoolStore.getState().pillPool).toHaveLength(2)
            })
        })

        describe('clearPillModifiers', () => {
            it('deve limpar todos os modificadores', () => {
                const store = usePillPoolStore.getState()
                store.invertPill('p1')
                store.doublePill('p1')

                store.clearPillModifiers('p1')

                const pill = usePillPoolStore.getState().getPill('p1')
                expect(pill?.inverted).toBeUndefined()
                expect(pill?.doubled).toBeUndefined()
            })

            it('deve ignorar pilula inexistente', () => {
                usePillPoolStore.getState().clearPillModifiers('inexistente')
                // Nao deve lancar erro
            })
        })
    })

    describe('getPill', () => {
        beforeEach(() => {
            usePillPoolStore.getState().setPool([
                createMockPill('p1', 'SAFE'),
                createMockPill('p2', 'FATAL'),
            ])
        })

        it('deve retornar pilula pelo ID', () => {
            const pill = usePillPoolStore.getState().getPill('p1')

            expect(pill).not.toBeUndefined()
            expect(pill?.id).toBe('p1')
            expect(pill?.type).toBe('SAFE')
        })

        it('deve retornar undefined para ID inexistente', () => {
            const pill = usePillPoolStore.getState().getPill('inexistente')
            expect(pill).toBeUndefined()
        })
    })

    describe('getRemainingCount / isEmpty', () => {
        it('deve retornar 0 para pool vazio', () => {
            expect(usePillPoolStore.getState().getRemainingCount()).toBe(0)
            expect(usePillPoolStore.getState().isEmpty()).toBe(true)
        })

        it('deve retornar contagem correta', () => {
            usePillPoolStore.getState().setPool([
                createMockPill('p1'),
                createMockPill('p2'),
                createMockPill('p3'),
            ])

            expect(usePillPoolStore.getState().getRemainingCount()).toBe(3)
            expect(usePillPoolStore.getState().isEmpty()).toBe(false)
        })

        it('deve atualizar apos consumir', () => {
            usePillPoolStore.getState().setPool([
                createMockPill('p1'),
                createMockPill('p2'),
            ])

            usePillPoolStore.getState().consumePill('p1')

            expect(usePillPoolStore.getState().getRemainingCount()).toBe(1)
        })
    })

    describe('reset', () => {
        it('deve resetar para estado inicial', () => {
            const store = usePillPoolStore.getState()
            store.setPool([
                createMockPill('p1', 'SAFE'),
                createMockPill('p2', 'FATAL'),
            ])
            store.addRevealedPill('p1')
            store.invertPill('p2')

            store.reset()

            const state = usePillPoolStore.getState()
            expect(state.pillPool).toHaveLength(0)
            expect(state.revealedPills).toHaveLength(0)
            expect(state.typeCounts.SAFE).toBe(0)
        })
    })

    describe('cenarios de jogo', () => {
        it('deve simular rodada completa', () => {
            const store = usePillPoolStore.getState()

            // Gera pool
            store.setPool([
                createMockPill('p1', 'SAFE'),
                createMockPill('p2', 'DMG_LOW'),
                createMockPill('p3', 'FATAL'),
                createMockPill('p4', 'HEAL'),
            ])

            // Scanner revela uma pilula
            store.addRevealedPill('p3')
            expect(store.isPillRevealed('p3')).toBe(true)

            // Inverter modifica pilula
            store.invertPill('p2')
            expect(store.getPill('p2')?.inverted).toBe(true)

            // Jogador consome pilula revelada
            const consumed = store.consumePill('p3')
            expect(consumed?.type).toBe('FATAL')
            expect(usePillPoolStore.getState().revealedPills).not.toContain('p3')

            // Verifica estado final
            expect(usePillPoolStore.getState().getRemainingCount()).toBe(3)
        })

        it('deve funcionar com multiplayer sync', () => {
            // Host gera pool
            const hostPills = [
                createMockPill('sync-1', 'SAFE'),
                createMockPill('sync-2', 'DMG_HIGH'),
            ]

            // Guest recebe e aplica
            usePillPoolStore.getState().setPool(hostPills)

            const state = usePillPoolStore.getState()
            expect(state.pillPool).toHaveLength(2)
            expect(state.pillPool[0].id).toBe('sync-1')
        })
    })
})

