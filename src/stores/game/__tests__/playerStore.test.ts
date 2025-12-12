import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from '../playerStore'

describe('playerStore', () => {
    beforeEach(() => {
        usePlayerStore.getState().reset()
    })

    describe('estado inicial', () => {
        it('deve iniciar com players vazio', () => {
            const state = usePlayerStore.getState()
            expect(state.players).toEqual({})
        })
    })

    describe('initializePlayers', () => {
        it('deve inicializar 2 jogadores', () => {
            usePlayerStore.getState().initializePlayers([
                { name: 'Alice', lives: 3, resistance: 6, isAI: false },
                { name: 'Bob', lives: 3, resistance: 6, isAI: true },
            ])

            const state = usePlayerStore.getState()
            expect(Object.keys(state.players)).toHaveLength(2)
            expect(state.players.player1.name).toBe('Alice')
            expect(state.players.player2.name).toBe('Bob')
            expect(state.players.player2.isAI).toBe(true)
        })

        it('deve inicializar 4 jogadores', () => {
            usePlayerStore.getState().initializePlayers([
                { name: 'P1', lives: 3, resistance: 6, isAI: false },
                { name: 'P2', lives: 3, resistance: 6, isAI: false },
                { name: 'P3', lives: 3, resistance: 6, isAI: true },
                { name: 'P4', lives: 3, resistance: 6, isAI: true },
            ])

            const state = usePlayerStore.getState()
            expect(Object.keys(state.players)).toHaveLength(4)
        })

        it('deve definir userId quando fornecido', () => {
            usePlayerStore.getState().initializePlayers([
                { name: 'Alice', lives: 3, resistance: 6, isAI: false, userId: 'auth-uuid-123' },
                { name: 'Guest', lives: 3, resistance: 6, isAI: false },
            ])

            const state = usePlayerStore.getState()
            expect(state.players.player1.userId).toBe('auth-uuid-123')
            expect(state.players.player2.userId).toBeNull()
        })

        it('deve definir maxLives e maxResistance corretamente', () => {
            usePlayerStore.getState().initializePlayers([
                { name: 'Alice', lives: 5, resistance: 10, isAI: false },
            ])

            const player = usePlayerStore.getState().players.player1
            expect(player.maxLives).toBe(5)
            expect(player.maxResistance).toBe(10)
        })
    })

    describe('getPlayer', () => {
        beforeEach(() => {
            usePlayerStore.getState().initializePlayers([
                { name: 'Alice', lives: 3, resistance: 6, isAI: false },
            ])
        })

        it('deve retornar jogador existente', () => {
            const player = usePlayerStore.getState().getPlayer('player1')
            expect(player).not.toBeUndefined()
            expect(player?.name).toBe('Alice')
        })

        it('deve retornar undefined para jogador inexistente', () => {
            const player = usePlayerStore.getState().getPlayer('player99')
            expect(player).toBeUndefined()
        })
    })

    describe('applyDamageToPlayer', () => {
        beforeEach(() => {
            usePlayerStore.getState().initializePlayers([
                { name: 'Alice', lives: 3, resistance: 6, isAI: false },
            ])
        })

        it('deve aplicar dano a resistencia', () => {
            const result = usePlayerStore.getState().applyDamageToPlayer('player1', 2)

            expect(result).not.toBeNull()
            expect(result?.damageDealt).toBe(2)
            expect(usePlayerStore.getState().players.player1.resistance).toBe(4)
        })

        it('deve causar colapso e perder vida', () => {
            const result = usePlayerStore.getState().applyDamageToPlayer('player1', 10)

            expect(result?.collapsed).toBe(true)
            expect(result?.eliminated).toBe(false)
            const player = usePlayerStore.getState().players.player1
            expect(player.lives).toBe(2)
            expect(player.resistance).toBe(6) // resetado
        })

        it('deve eliminar jogador quando vidas acabam', () => {
            const store = usePlayerStore.getState()
            store.applyDamageToPlayer('player1', 10) // lives: 3 -> 2
            store.applyDamageToPlayer('player1', 10) // lives: 2 -> 1
            const result = store.applyDamageToPlayer('player1', 10) // lives: 1 -> 0

            expect(result?.eliminated).toBe(true)
            expect(usePlayerStore.getState().players.player1.lives).toBe(0)
        })

        it('deve retornar null para jogador inexistente', () => {
            const result = usePlayerStore.getState().applyDamageToPlayer('player99', 5)
            expect(result).toBeNull()
        })
    })

    describe('applyHealToPlayer', () => {
        beforeEach(() => {
            usePlayerStore.getState().initializePlayers([
                { name: 'Alice', lives: 3, resistance: 6, isAI: false },
            ])
            // Aplica dano primeiro
            usePlayerStore.getState().applyDamageToPlayer('player1', 4)
        })

        it('deve aplicar cura', () => {
            const result = usePlayerStore.getState().applyHealToPlayer('player1', 2)

            expect(result).not.toBeNull()
            expect(result?.healReceived).toBe(2)
            expect(usePlayerStore.getState().players.player1.resistance).toBe(4)
        })

        it('deve respeitar cap de maxResistance', () => {
            const result = usePlayerStore.getState().applyHealToPlayer('player1', 10)

            expect(result?.healReceived).toBe(4) // 6 - 2 = 4 de cura possivel
            expect(usePlayerStore.getState().players.player1.resistance).toBe(6)
        })

        it('deve retornar null para jogador inexistente', () => {
            const result = usePlayerStore.getState().applyHealToPlayer('player99', 5)
            expect(result).toBeNull()
        })
    })

    describe('loseLife', () => {
        beforeEach(() => {
            usePlayerStore.getState().initializePlayers([
                { name: 'Alice', lives: 2, resistance: 6, isAI: false },
            ])
        })

        it('deve perder vida e resetar resistencia', () => {
            const eliminated = usePlayerStore.getState().loseLife('player1')

            expect(eliminated).toBe(false)
            const player = usePlayerStore.getState().players.player1
            expect(player.lives).toBe(1)
            expect(player.resistance).toBe(6)
        })

        it('deve eliminar quando vida chega a 0', () => {
            const store = usePlayerStore.getState()
            store.loseLife('player1')
            const eliminated = store.loseLife('player1')

            expect(eliminated).toBe(true)
            expect(usePlayerStore.getState().players.player1.lives).toBe(0)
        })

        it('deve retornar false para jogador inexistente', () => {
            const eliminated = usePlayerStore.getState().loseLife('player99')
            expect(eliminated).toBe(false)
        })
    })

    describe('gainLife', () => {
        beforeEach(() => {
            usePlayerStore.getState().initializePlayers([
                { name: 'Alice', lives: 2, resistance: 6, isAI: false },
            ])
        })

        it('deve ganhar vida', () => {
            // Reduz vida primeiro
            usePlayerStore.getState().loseLife('player1')

            const gained = usePlayerStore.getState().gainLife('player1', 1)

            expect(gained).toBe(1)
            expect(usePlayerStore.getState().players.player1.lives).toBe(2)
        })

        it('deve respeitar cap de maxLives', () => {
            const gained = usePlayerStore.getState().gainLife('player1', 5)

            expect(gained).toBe(0) // ja esta no max
            expect(usePlayerStore.getState().players.player1.lives).toBe(2)
        })

        it('deve retornar 0 para jogador inexistente', () => {
            const gained = usePlayerStore.getState().gainLife('player99', 1)
            expect(gained).toBe(0)
        })
    })

    describe('resetResistance', () => {
        beforeEach(() => {
            usePlayerStore.getState().initializePlayers([
                { name: 'Alice', lives: 3, resistance: 6, isAI: false },
            ])
            usePlayerStore.getState().applyDamageToPlayer('player1', 4)
        })

        it('deve resetar resistencia ao maximo', () => {
            usePlayerStore.getState().resetResistance('player1')

            expect(usePlayerStore.getState().players.player1.resistance).toBe(6)
        })

        it('deve ignorar jogador inexistente', () => {
            usePlayerStore.getState().resetResistance('player99')
            // Nao deve lancar erro
        })
    })

    describe('setResistance', () => {
        beforeEach(() => {
            usePlayerStore.getState().initializePlayers([
                { name: 'Alice', lives: 3, resistance: 6, isAI: false },
            ])
        })

        it('deve definir resistencia para valor especifico', () => {
            usePlayerStore.getState().setResistance('player1', 3)
            expect(usePlayerStore.getState().players.player1.resistance).toBe(3)
        })

        it('deve respeitar cap em maxResistance', () => {
            usePlayerStore.getState().setResistance('player1', 100)
            expect(usePlayerStore.getState().players.player1.resistance).toBe(6)
        })

        it('deve nao permitir valores negativos', () => {
            usePlayerStore.getState().setResistance('player1', -5)
            expect(usePlayerStore.getState().players.player1.resistance).toBe(0)
        })
    })

    describe('inventory management', () => {
        beforeEach(() => {
            usePlayerStore.getState().initializePlayers([
                { name: 'Alice', lives: 3, resistance: 6, isAI: false },
            ])
        })

        describe('addItemToInventory', () => {
            it('deve adicionar item ao inventario', () => {
                const itemId = usePlayerStore.getState().addItemToInventory('player1', 'scanner')

                expect(itemId).not.toBeNull()
                const items = usePlayerStore.getState().players.player1.inventory.items
                expect(items).toHaveLength(1)
                expect(items[0].type).toBe('scanner')
            })

            it('deve usar itemId fornecido', () => {
                const itemId = usePlayerStore.getState().addItemToInventory('player1', 'scanner', 'custom-id')

                expect(itemId).toBe('custom-id')
                const items = usePlayerStore.getState().players.player1.inventory.items
                expect(items[0].id).toBe('custom-id')
            })

            it('deve respeitar limite de inventario', () => {
                const store = usePlayerStore.getState()

                // Adiciona 5 itens (limite padrao)
                for (let i = 0; i < 5; i++) {
                    store.addItemToInventory('player1', 'scanner')
                }

                // Sexto deve falhar
                const itemId = store.addItemToInventory('player1', 'scanner')
                expect(itemId).toBeNull()
                expect(usePlayerStore.getState().players.player1.inventory.items).toHaveLength(5)
            })

            it('deve retornar null para jogador inexistente', () => {
                const itemId = usePlayerStore.getState().addItemToInventory('player99', 'scanner')
                expect(itemId).toBeNull()
            })
        })

        describe('removeItemFromInventory', () => {
            it('deve remover item do inventario', () => {
                const store = usePlayerStore.getState()
                const itemId = store.addItemToInventory('player1', 'scanner')!

                store.removeItemFromInventory('player1', itemId)

                expect(usePlayerStore.getState().players.player1.inventory.items).toHaveLength(0)
            })

            it('deve ignorar item inexistente', () => {
                const store = usePlayerStore.getState()
                store.addItemToInventory('player1', 'scanner')

                store.removeItemFromInventory('player1', 'inexistente')

                expect(usePlayerStore.getState().players.player1.inventory.items).toHaveLength(1)
            })
        })

        describe('clearInventory', () => {
            it('deve limpar todo o inventario', () => {
                const store = usePlayerStore.getState()
                store.addItemToInventory('player1', 'scanner')
                store.addItemToInventory('player1', 'shield')
                store.addItemToInventory('player1', 'handcuffs')

                store.clearInventory('player1')

                expect(usePlayerStore.getState().players.player1.inventory.items).toHaveLength(0)
            })
        })
    })

    describe('pillCoins management', () => {
        beforeEach(() => {
            usePlayerStore.getState().initializePlayers([
                { name: 'Alice', lives: 3, resistance: 6, isAI: false },
            ])
        })

        describe('addPillCoins', () => {
            it('deve adicionar pillCoins', () => {
                usePlayerStore.getState().addPillCoins('player1', 5)
                expect(usePlayerStore.getState().players.player1.pillCoins).toBe(5)
            })

            it('deve acumular pillCoins', () => {
                const store = usePlayerStore.getState()
                store.addPillCoins('player1', 3)
                store.addPillCoins('player1', 2)
                expect(usePlayerStore.getState().players.player1.pillCoins).toBe(5)
            })
        })

        describe('spendPillCoins', () => {
            beforeEach(() => {
                usePlayerStore.getState().addPillCoins('player1', 10)
            })

            it('deve gastar pillCoins quando tem saldo', () => {
                const success = usePlayerStore.getState().spendPillCoins('player1', 4)

                expect(success).toBe(true)
                expect(usePlayerStore.getState().players.player1.pillCoins).toBe(6)
            })

            it('deve falhar quando nao tem saldo suficiente', () => {
                const success = usePlayerStore.getState().spendPillCoins('player1', 15)

                expect(success).toBe(false)
                expect(usePlayerStore.getState().players.player1.pillCoins).toBe(10)
            })

            it('deve retornar false para jogador inexistente', () => {
                const success = usePlayerStore.getState().spendPillCoins('player99', 5)
                expect(success).toBe(false)
            })
        })
    })

    describe('wantsStore', () => {
        beforeEach(() => {
            usePlayerStore.getState().initializePlayers([
                { name: 'Alice', lives: 3, resistance: 6, isAI: false },
                { name: 'Bob', lives: 3, resistance: 6, isAI: false },
            ])
        })

        describe('toggleWantsStore', () => {
            it('deve alternar wantsStore', () => {
                expect(usePlayerStore.getState().players.player1.wantsStore).toBe(false)

                usePlayerStore.getState().toggleWantsStore('player1')
                expect(usePlayerStore.getState().players.player1.wantsStore).toBe(true)

                usePlayerStore.getState().toggleWantsStore('player1')
                expect(usePlayerStore.getState().players.player1.wantsStore).toBe(false)
            })
        })

        describe('setAllWantsStore', () => {
            it('deve definir wantsStore para todos', () => {
                const store = usePlayerStore.getState()
                store.toggleWantsStore('player1')

                store.setAllWantsStore(false)

                expect(usePlayerStore.getState().players.player1.wantsStore).toBe(false)
                expect(usePlayerStore.getState().players.player2.wantsStore).toBe(false)
            })

            it('deve ativar para todos', () => {
                usePlayerStore.getState().setAllWantsStore(true)

                expect(usePlayerStore.getState().players.player1.wantsStore).toBe(true)
                expect(usePlayerStore.getState().players.player2.wantsStore).toBe(true)
            })
        })
    })

    describe('updatePlayer', () => {
        beforeEach(() => {
            usePlayerStore.getState().initializePlayers([
                { name: 'Alice', lives: 3, resistance: 6, isAI: false },
            ])
        })

        it('deve atualizar campos do jogador', () => {
            usePlayerStore.getState().updatePlayer('player1', {
                name: 'Alicia',
                pillCoins: 100,
            })

            const player = usePlayerStore.getState().players.player1
            expect(player.name).toBe('Alicia')
            expect(player.pillCoins).toBe(100)
        })

        it('deve ignorar jogador inexistente', () => {
            usePlayerStore.getState().updatePlayer('player99', { name: 'Test' })
            // Nao deve lancar erro
        })
    })

    describe('alive players helpers', () => {
        beforeEach(() => {
            usePlayerStore.getState().initializePlayers([
                { name: 'P1', lives: 3, resistance: 6, isAI: false },
                { name: 'P2', lives: 3, resistance: 6, isAI: false },
                { name: 'P3', lives: 3, resistance: 6, isAI: false },
                { name: 'P4', lives: 3, resistance: 6, isAI: false },
            ])
        })

        it('getAlivePlayerIds deve retornar todos quando vivos', () => {
            expect(usePlayerStore.getState().getAlivePlayerIds()).toEqual([
                'player1', 'player2', 'player3', 'player4'
            ])
        })

        it('getAlivePlayerIds deve excluir eliminados', () => {
            const store = usePlayerStore.getState()
            store.updatePlayer('player2', { lives: 0 })
            store.updatePlayer('player4', { lives: 0 })

            expect(store.getAlivePlayerIds()).toEqual(['player1', 'player3'])
        })

        it('countAlive deve contar corretamente', () => {
            const store = usePlayerStore.getState()
            expect(store.countAlive()).toBe(4)

            store.updatePlayer('player1', { lives: 0 })
            expect(store.countAlive()).toBe(3)
        })

        it('isAlive deve verificar corretamente', () => {
            const store = usePlayerStore.getState()
            expect(store.isAlive('player1')).toBe(true)

            store.updatePlayer('player1', { lives: 0 })
            expect(store.isAlive('player1')).toBe(false)
        })

        it('isAlive deve retornar false para inexistente', () => {
            expect(usePlayerStore.getState().isAlive('player99')).toBe(false)
        })
    })

    describe('reset', () => {
        it('deve resetar para estado inicial', () => {
            const store = usePlayerStore.getState()
            store.initializePlayers([
                { name: 'Alice', lives: 3, resistance: 6, isAI: false },
            ])
            store.addPillCoins('player1', 50)
            store.addItemToInventory('player1', 'scanner')

            store.reset()

            const state = usePlayerStore.getState()
            expect(state.players).toEqual({})
        })
    })

    describe('cenarios de jogo', () => {
        it('deve simular partida com 4 jogadores', () => {
            const store = usePlayerStore.getState()

            // Setup
            store.initializePlayers([
                { name: 'Alice', lives: 3, resistance: 6, isAI: false, userId: 'user-1' },
                { name: 'Bob', lives: 3, resistance: 6, isAI: false, userId: 'user-2' },
                { name: 'Bot1', lives: 3, resistance: 6, isAI: true },
                { name: 'Bot2', lives: 3, resistance: 6, isAI: true },
            ])

            expect(store.countAlive()).toBe(4)

            // Player1 toma dano
            store.applyDamageToPlayer('player1', 3)
            expect(store.getPlayer('player1')?.resistance).toBe(3)

            // Player2 ganha moedas e compra item
            store.addPillCoins('player2', 5)
            store.addItemToInventory('player2', 'shield')

            // Player3 e eliminado
            store.updatePlayer('player3', { lives: 0 })
            expect(store.countAlive()).toBe(3)
            expect(store.isAlive('player3')).toBe(false)

            // Verifica userId
            expect(store.getPlayer('player1')?.userId).toBe('user-1')
            expect(store.getPlayer('player3')?.userId).toBeNull()
        })
    })
})

