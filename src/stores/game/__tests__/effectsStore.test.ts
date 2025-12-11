import { describe, it, expect, beforeEach } from 'vitest'
import { useEffectsStore } from '../effectsStore'

describe('effectsStore', () => {
    beforeEach(() => {
        // Reset store e inicializa para 2 jogadores (padrao)
        useEffectsStore.getState().reset()
        useEffectsStore.getState().initializeForPlayers(['player1', 'player2'])
    })

    describe('initializeForPlayers', () => {
        it('deve inicializar para 2 jogadores', () => {
            useEffectsStore.getState().reset()
            useEffectsStore.getState().initializeForPlayers(['player1', 'player2'])

            const state = useEffectsStore.getState()
            expect(state.activeEffects.player1).toEqual([])
            expect(state.activeEffects.player2).toEqual([])
        })

        it('deve inicializar para 4 jogadores', () => {
            useEffectsStore.getState().reset()
            useEffectsStore.getState().initializeForPlayers(['player1', 'player2', 'player3', 'player4'])

            const state = useEffectsStore.getState()
            expect(Object.keys(state.activeEffects)).toHaveLength(4)
            expect(state.activeEffects.player1).toEqual([])
            expect(state.activeEffects.player4).toEqual([])
        })

        it('deve substituir jogadores anteriores ao reinicializar', () => {
            useEffectsStore.getState().applyEffect('player1', { type: 'shield', roundsRemaining: 1 })
            useEffectsStore.getState().initializeForPlayers(['player3', 'player4'])

            const state = useEffectsStore.getState()
            expect(state.activeEffects.player1).toBeUndefined()
            expect(state.activeEffects.player3).toEqual([])
        })
    })

    describe('applyEffect', () => {
        it('deve adicionar efeito ao jogador', () => {
            useEffectsStore.getState().applyEffect('player1', {
                type: 'shield',
                roundsRemaining: 1,
            })

            const effects = useEffectsStore.getState().getEffects('player1')
            expect(effects).toHaveLength(1)
            expect(effects[0].type).toBe('shield')
            expect(effects[0].roundsRemaining).toBe(1)
        })

        it('nao deve adicionar duplicata do mesmo tipo de efeito', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'shield', roundsRemaining: 1 })
            store.applyEffect('player1', { type: 'shield', roundsRemaining: 2 })

            const effects = store.getEffects('player1')
            expect(effects).toHaveLength(1)
            // Deve manter o primeiro (roundsRemaining: 1)
            expect(effects[0].roundsRemaining).toBe(1)
        })

        it('deve permitir diferentes tipos de efeito no mesmo jogador', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'shield', roundsRemaining: 1 })
            store.applyEffect('player1', { type: 'handcuffed', roundsRemaining: 1 })

            const effects = store.getEffects('player1')
            expect(effects).toHaveLength(2)
            expect(effects.map((e) => e.type)).toContain('shield')
            expect(effects.map((e) => e.type)).toContain('handcuffed')
        })

        it('deve manter efeitos de outros jogadores separados', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'shield', roundsRemaining: 1 })
            store.applyEffect('player2', { type: 'handcuffed', roundsRemaining: 1 })

            expect(store.getEffects('player1')).toHaveLength(1)
            expect(store.getEffects('player2')).toHaveLength(1)
            expect(store.getEffects('player1')[0].type).toBe('shield')
            expect(store.getEffects('player2')[0].type).toBe('handcuffed')
        })

        it('deve funcionar com jogador nao inicializado (cria automaticamente)', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player99', { type: 'shield', roundsRemaining: 1 })

            expect(store.getEffects('player99')).toHaveLength(1)
        })
    })

    describe('removeEffect', () => {
        it('deve remover efeito especifico do jogador', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'shield', roundsRemaining: 1 })
            store.applyEffect('player1', { type: 'handcuffed', roundsRemaining: 1 })

            store.removeEffect('player1', 'shield')

            const effects = store.getEffects('player1')
            expect(effects).toHaveLength(1)
            expect(effects[0].type).toBe('handcuffed')
        })

        it('nao deve afetar outros jogadores ao remover efeito', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'shield', roundsRemaining: 1 })
            store.applyEffect('player2', { type: 'shield', roundsRemaining: 1 })

            store.removeEffect('player1', 'shield')

            expect(store.getEffects('player1')).toHaveLength(0)
            expect(store.getEffects('player2')).toHaveLength(1)
        })
    })

    describe('removeEffectFromAll', () => {
        it('deve remover tipo de efeito de todos os jogadores (2 jogadores)', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'shield', roundsRemaining: 1 })
            store.applyEffect('player2', { type: 'shield', roundsRemaining: 1 })
            store.applyEffect('player1', { type: 'handcuffed', roundsRemaining: 1 })

            store.removeEffectFromAll('shield')

            expect(store.getEffects('player1')).toHaveLength(1)
            expect(store.getEffects('player1')[0].type).toBe('handcuffed')
            expect(store.getEffects('player2')).toHaveLength(0)
        })

        it('deve remover tipo de efeito de todos os jogadores (4 jogadores)', () => {
            useEffectsStore.getState().initializeForPlayers(['player1', 'player2', 'player3', 'player4'])

            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'shield', roundsRemaining: 1 })
            store.applyEffect('player2', { type: 'shield', roundsRemaining: 1 })
            store.applyEffect('player3', { type: 'shield', roundsRemaining: 1 })
            store.applyEffect('player4', { type: 'shield', roundsRemaining: 1 })

            store.removeEffectFromAll('shield')

            expect(store.getEffects('player1')).toHaveLength(0)
            expect(store.getEffects('player2')).toHaveLength(0)
            expect(store.getEffects('player3')).toHaveLength(0)
            expect(store.getEffects('player4')).toHaveLength(0)
        })
    })

    describe('decrementEffects', () => {
        it('deve decrementar roundsRemaining de efeitos nao-shield', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'handcuffed', roundsRemaining: 2 })

            store.decrementEffects('player1')

            const effects = store.getEffects('player1')
            expect(effects).toHaveLength(1)
            expect(effects[0].roundsRemaining).toBe(1)
        })

        it('nao deve decrementar shield (dura rodada inteira)', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'shield', roundsRemaining: 1 })

            store.decrementEffects('player1')

            const effects = store.getEffects('player1')
            expect(effects).toHaveLength(1)
            expect(effects[0].roundsRemaining).toBe(1)
        })

        it('deve remover efeitos que chegam a 0', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'handcuffed', roundsRemaining: 1 })

            store.decrementEffects('player1')

            const effects = store.getEffects('player1')
            expect(effects).toHaveLength(0)
        })
    })

    describe('hasEffect', () => {
        it('deve retornar true se jogador tem o efeito', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'shield', roundsRemaining: 1 })

            expect(store.hasEffect('player1', 'shield')).toBe(true)
        })

        it('deve retornar false se jogador nao tem o efeito', () => {
            const store = useEffectsStore.getState()

            expect(store.hasEffect('player1', 'shield')).toBe(false)
        })

        it('deve retornar false se outro jogador tem o efeito', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player2', { type: 'shield', roundsRemaining: 1 })

            expect(store.hasEffect('player1', 'shield')).toBe(false)
        })

        it('deve retornar false para jogador nao inicializado', () => {
            const store = useEffectsStore.getState()
            expect(store.hasEffect('player99', 'shield')).toBe(false)
        })
    })

    describe('getEffects', () => {
        it('deve retornar todos os efeitos do jogador', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'shield', roundsRemaining: 1 })
            store.applyEffect('player1', { type: 'handcuffed', roundsRemaining: 2 })

            const effects = store.getEffects('player1')
            expect(effects).toHaveLength(2)
        })

        it('deve retornar array vazio se jogador nao tem efeitos', () => {
            const store = useEffectsStore.getState()

            expect(store.getEffects('player1')).toEqual([])
        })

        it('deve retornar array vazio para jogador nao inicializado', () => {
            const store = useEffectsStore.getState()
            expect(store.getEffects('player99')).toEqual([])
        })
    })

    describe('getEffect', () => {
        it('deve retornar efeito especifico se existir', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'shield', roundsRemaining: 3 })

            const effect = store.getEffect('player1', 'shield')
            expect(effect).toBeDefined()
            expect(effect?.type).toBe('shield')
            expect(effect?.roundsRemaining).toBe(3)
        })

        it('deve retornar undefined se efeito nao existir', () => {
            const store = useEffectsStore.getState()

            expect(store.getEffect('player1', 'shield')).toBeUndefined()
        })
    })

    describe('clearEffects', () => {
        it('deve remover todos os efeitos do jogador', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'shield', roundsRemaining: 1 })
            store.applyEffect('player1', { type: 'handcuffed', roundsRemaining: 1 })

            store.clearEffects('player1')

            expect(store.getEffects('player1')).toHaveLength(0)
        })

        it('nao deve afetar outros jogadores', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'shield', roundsRemaining: 1 })
            store.applyEffect('player2', { type: 'handcuffed', roundsRemaining: 1 })

            store.clearEffects('player1')

            expect(store.getEffects('player1')).toHaveLength(0)
            expect(store.getEffects('player2')).toHaveLength(1)
        })
    })

    describe('reset', () => {
        it('deve resetar para estado vazio', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'shield', roundsRemaining: 1 })
            store.applyEffect('player2', { type: 'handcuffed', roundsRemaining: 2 })

            store.reset()

            const state = useEffectsStore.getState()
            expect(state.activeEffects).toEqual({})
        })

        it('deve permitir reinicializacao apos reset', () => {
            const store = useEffectsStore.getState()
            store.applyEffect('player1', { type: 'shield', roundsRemaining: 1 })

            store.reset()
            store.initializeForPlayers(['player1', 'player2', 'player3'])

            const state = useEffectsStore.getState()
            expect(Object.keys(state.activeEffects)).toHaveLength(3)
            expect(store.getEffects('player1')).toEqual([])
        })
    })
})
