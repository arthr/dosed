import { describe, it, expect, beforeEach } from 'vitest'
import { useGameFlowStore } from '../gameFlowStore'

describe('gameFlowStore', () => {
    beforeEach(() => {
        useGameFlowStore.getState().reset()
    })

    describe('estado inicial', () => {
        it('deve iniciar com valores padrao', () => {
            const state = useGameFlowStore.getState()
            expect(state.phase).toBe('setup')
            expect(state.turnPhase).toBe('consume')
            expect(state.round).toBe(0)
            expect(state.currentTurn).toBe('player1')
            expect(state.playerOrder).toEqual([])
            expect(state.winner).toBeNull()
            expect(state.mode).toBe('single_player')
            expect(state.difficulty).toBe('normal')
            expect(state.roomId).toBeNull()
        })
    })

    describe('initialize', () => {
        it('deve inicializar com 2 jogadores', () => {
            useGameFlowStore.getState().initialize(['player1', 'player2'])

            const state = useGameFlowStore.getState()
            expect(state.playerOrder).toEqual(['player1', 'player2'])
            expect(state.currentTurn).toBe('player1')
            expect(state.phase).toBe('setup')
        })

        it('deve inicializar com 4 jogadores', () => {
            useGameFlowStore.getState().initialize([
                'player1', 'player2', 'player3', 'player4'
            ])

            const state = useGameFlowStore.getState()
            expect(state.playerOrder).toHaveLength(4)
            expect(state.currentTurn).toBe('player1')
        })

        it('deve aceitar configuracoes opcionais', () => {
            useGameFlowStore.getState().initialize(['player1', 'player2'], {
                difficulty: 'hard',
                mode: 'multiplayer',
                roomId: 'room-123',
            })

            const state = useGameFlowStore.getState()
            expect(state.difficulty).toBe('hard')
            expect(state.mode).toBe('multiplayer')
            expect(state.roomId).toBe('room-123')
        })

        it('deve limpar historico de acoes', () => {
            const store = useGameFlowStore.getState()
            store.addAction({
                type: 'GAME_START',
                playerId: 'player1',
                timestamp: Date.now(),
            })

            store.initialize(['player1', 'player2'])

            expect(useGameFlowStore.getState().actionHistory).toHaveLength(0)
        })
    })

    describe('setPhase / setTurnPhase', () => {
        it('deve mudar fase do jogo', () => {
            useGameFlowStore.getState().setPhase('playing')
            expect(useGameFlowStore.getState().phase).toBe('playing')
        })

        it('deve mudar fase do turno', () => {
            useGameFlowStore.getState().setTurnPhase('items')
            expect(useGameFlowStore.getState().turnPhase).toBe('items')
        })
    })

    describe('startGame', () => {
        beforeEach(() => {
            useGameFlowStore.getState().initialize(['player1', 'player2', 'player3'])
        })

        it('deve iniciar jogo com fase playing', () => {
            useGameFlowStore.getState().startGame()

            const state = useGameFlowStore.getState()
            expect(state.phase).toBe('playing')
            expect(state.round).toBe(1)
            expect(state.currentTurn).toBe('player1')
        })

        it('deve adicionar acao GAME_START ao historico', () => {
            useGameFlowStore.getState().startGame()

            const history = useGameFlowStore.getState().actionHistory
            expect(history).toHaveLength(1)
            expect(history[0].type).toBe('GAME_START')
        })
    })

    describe('startItemSelection', () => {
        it('deve mudar para fase itemSelection', () => {
            useGameFlowStore.getState().startItemSelection()
            expect(useGameFlowStore.getState().phase).toBe('itemSelection')
        })
    })

    describe('startRound', () => {
        beforeEach(() => {
            useGameFlowStore.getState().initialize(['player1', 'player2'])
        })

        it('deve incrementar rodada', () => {
            useGameFlowStore.getState().startRound()
            expect(useGameFlowStore.getState().round).toBe(1)

            useGameFlowStore.getState().startRound()
            expect(useGameFlowStore.getState().round).toBe(2)
        })

        it('deve definir jogador inicial da rodada', () => {
            useGameFlowStore.getState().startRound('player2')
            expect(useGameFlowStore.getState().currentTurn).toBe('player2')
        })

        it('deve mudar para fase playing', () => {
            useGameFlowStore.getState().startRound()
            expect(useGameFlowStore.getState().phase).toBe('playing')
        })

        it('deve adicionar acao NEW_ROUND ao historico', () => {
            useGameFlowStore.getState().startRound()

            const history = useGameFlowStore.getState().actionHistory
            expect(history).toHaveLength(1)
            expect(history[0].type).toBe('NEW_ROUND')
            expect(history[0].payload?.round).toBe(1)
        })
    })

    describe('nextTurn', () => {
        beforeEach(() => {
            useGameFlowStore.getState().initialize([
                'player1', 'player2', 'player3', 'player4'
            ])
        })

        it('deve avancar para proximo jogador', () => {
            const next = useGameFlowStore.getState().nextTurn()
            expect(next).toBe('player2')
            expect(useGameFlowStore.getState().currentTurn).toBe('player2')
        })

        it('deve rotacionar circularmente', () => {
            const store = useGameFlowStore.getState()
            store.setCurrentTurn('player4')

            const next = store.nextTurn()
            expect(next).toBe('player1')
        })

        it('deve pular jogadores eliminados', () => {
            const store = useGameFlowStore.getState()

            // player2 e player3 eliminados
            const next = store.nextTurn(['player1', 'player4'])
            expect(next).toBe('player4')
        })

        it('deve resetar turnPhase para consume', () => {
            const store = useGameFlowStore.getState()
            store.setTurnPhase('resolution')

            store.nextTurn()
            expect(useGameFlowStore.getState().turnPhase).toBe('consume')
        })
    })

    describe('setCurrentTurn', () => {
        it('deve definir jogador atual', () => {
            useGameFlowStore.getState().setCurrentTurn('player3')
            expect(useGameFlowStore.getState().currentTurn).toBe('player3')
        })
    })

    describe('endGame', () => {
        beforeEach(() => {
            useGameFlowStore.getState().initialize(['player1', 'player2'])
            useGameFlowStore.getState().startGame()
        })

        it('deve definir vencedor', () => {
            useGameFlowStore.getState().endGame('player1')

            const state = useGameFlowStore.getState()
            expect(state.winner).toBe('player1')
            expect(state.phase).toBe('ended')
        })

        it('deve adicionar acao GAME_END ao historico', () => {
            useGameFlowStore.getState().endGame('player2')

            const history = useGameFlowStore.getState().actionHistory
            const endAction = history.find(a => a.type === 'GAME_END')
            expect(endAction).not.toBeUndefined()
            expect(endAction?.payload?.winner).toBe('player2')
        })
    })

    describe('checkWinner', () => {
        beforeEach(() => {
            useGameFlowStore.getState().initialize(['player1', 'player2', 'player3'])
            useGameFlowStore.getState().startGame()
        })

        it('deve retornar null se mais de 1 jogador vivo', () => {
            const winner = useGameFlowStore.getState().checkWinner([
                'player1', 'player2'
            ])
            expect(winner).toBeNull()
            expect(useGameFlowStore.getState().phase).toBe('playing')
        })

        it('deve definir vencedor se apenas 1 jogador vivo', () => {
            const winner = useGameFlowStore.getState().checkWinner(['player3'])

            expect(winner).toBe('player3')
            expect(useGameFlowStore.getState().winner).toBe('player3')
            expect(useGameFlowStore.getState().phase).toBe('ended')
        })
    })

    describe('startRoundEnding / startShopping', () => {
        it('deve mudar para fase roundEnding', () => {
            useGameFlowStore.getState().startRoundEnding()
            expect(useGameFlowStore.getState().phase).toBe('roundEnding')
        })

        it('deve mudar para fase shopping', () => {
            useGameFlowStore.getState().startShopping()
            expect(useGameFlowStore.getState().phase).toBe('shopping')
        })
    })

    describe('action history', () => {
        it('deve adicionar acoes ao historico', () => {
            const store = useGameFlowStore.getState()

            store.addAction({
                type: 'CONSUME_PILL',
                playerId: 'player1',
                timestamp: Date.now(),
            })

            store.addAction({
                type: 'COLLAPSE',
                playerId: 'player2',
                timestamp: Date.now(),
            })

            expect(store.getActionHistory()).toHaveLength(2)
        })

        it('deve limpar historico', () => {
            const store = useGameFlowStore.getState()
            store.addAction({
                type: 'GAME_START',
                playerId: 'player1',
                timestamp: Date.now(),
            })

            store.clearActionHistory()

            expect(store.getActionHistory()).toHaveLength(0)
        })
    })

    describe('helpers', () => {
        beforeEach(() => {
            useGameFlowStore.getState().initialize(['player1', 'player2'])
        })

        describe('canContinue', () => {
            it('deve retornar true se 2+ jogadores vivos', () => {
                expect(useGameFlowStore.getState().canContinue([
                    'player1', 'player2'
                ])).toBe(true)
            })

            it('deve retornar false se menos de 2 jogadores vivos', () => {
                expect(useGameFlowStore.getState().canContinue(['player1'])).toBe(false)
            })
        })

        describe('getPhase / getRound', () => {
            it('deve retornar fase atual', () => {
                expect(useGameFlowStore.getState().getPhase()).toBe('setup')
            })

            it('deve retornar rodada atual', () => {
                useGameFlowStore.getState().startGame()
                expect(useGameFlowStore.getState().getRound()).toBe(1)
            })
        })

        describe('isPhase', () => {
            it('deve verificar fase corretamente', () => {
                expect(useGameFlowStore.getState().isPhase('setup')).toBe(true)
                expect(useGameFlowStore.getState().isPhase('playing')).toBe(false)
            })
        })

        describe('isGameOver', () => {
            it('deve retornar false se jogo em andamento', () => {
                useGameFlowStore.getState().startGame()
                expect(useGameFlowStore.getState().isGameOver()).toBe(false)
            })

            it('deve retornar true se jogo terminou', () => {
                useGameFlowStore.getState().startGame()
                useGameFlowStore.getState().endGame('player1')
                expect(useGameFlowStore.getState().isGameOver()).toBe(true)
            })
        })
    })

    describe('reset', () => {
        it('deve resetar para estado inicial', () => {
            const store = useGameFlowStore.getState()
            store.initialize(['player1', 'player2', 'player3'], {
                difficulty: 'hard',
                mode: 'multiplayer',
            })
            store.startGame()
            store.nextTurn()
            store.endGame('player2')

            store.reset()

            const state = useGameFlowStore.getState()
            expect(state.phase).toBe('setup')
            expect(state.round).toBe(0)
            expect(state.playerOrder).toEqual([])
            expect(state.winner).toBeNull()
            expect(state.mode).toBe('single_player')
            expect(state.actionHistory).toHaveLength(0)
        })
    })

    describe('cenarios de jogo', () => {
        it('deve simular fluxo completo de partida', () => {
            const store = useGameFlowStore.getState()

            // Setup
            store.initialize(['player1', 'player2', 'player3', 'player4'], {
                difficulty: 'normal',
                mode: 'single_player',
            })
            expect(store.getPhase()).toBe('setup')

            // Selecao de itens
            store.startItemSelection()
            expect(store.isPhase('itemSelection')).toBe(true)

            // Inicia jogo
            store.startGame()
            expect(store.getRound()).toBe(1)
            expect(store.getPhase()).toBe('playing')

            // Turnos da rodada 1
            expect(store.nextTurn()).toBe('player2')
            expect(store.nextTurn()).toBe('player3')
            expect(store.nextTurn()).toBe('player4')
            expect(store.nextTurn()).toBe('player1')

            // Fim da rodada
            store.startRoundEnding()
            expect(store.isPhase('roundEnding')).toBe(true)

            // Compras
            store.startShopping()
            expect(store.isPhase('shopping')).toBe(true)

            // Rodada 2
            store.startRound()
            expect(store.getRound()).toBe(2)

            // Eliminacoes simuladas - player2 e player3 mortos
            const alivePlayers = ['player1', 'player4']

            // Turnos pulam jogadores eliminados
            store.setCurrentTurn('player1')
            expect(store.nextTurn(alivePlayers)).toBe('player4')
            expect(store.nextTurn(alivePlayers)).toBe('player1')

            // player4 morre - player1 vence
            const winner = store.checkWinner(['player1'])
            expect(winner).toBe('player1')
            expect(store.isGameOver()).toBe(true)

            // Verifica historico
            const history = store.getActionHistory()
            expect(history.length).toBeGreaterThan(0)
            expect(history.some(a => a.type === 'GAME_START')).toBe(true)
            expect(history.some(a => a.type === 'GAME_END')).toBe(true)
        })

        it('deve funcionar com multiplayer', () => {
            useGameFlowStore.getState().initialize(['player1', 'player2'], {
                mode: 'multiplayer',
                roomId: 'room-abc-123',
            })

            const state = useGameFlowStore.getState()
            expect(state.mode).toBe('multiplayer')
            expect(state.roomId).toBe('room-abc-123')
        })
    })
})

