import { describe, it, expect } from 'vitest'
import {
    createInitialPlayersState,
    createPlayerFromConfig,
    generatePlayerId,
    isValidPlayerId,
    getPlayerIds,
    getAlivePlayers,
    countAlivePlayers,
    isPlayerAlive,
} from '../playerManager'
import type { Player, PlayerConfig } from '@/types'

describe('playerManager', () => {
    describe('generatePlayerId', () => {
        it('deve gerar player1 para indice 0', () => {
            expect(generatePlayerId(0)).toBe('player1')
        })

        it('deve gerar player2 para indice 1', () => {
            expect(generatePlayerId(1)).toBe('player2')
        })

        it('deve gerar playerN para indice N-1', () => {
            expect(generatePlayerId(3)).toBe('player4')
            expect(generatePlayerId(9)).toBe('player10')
        })
    })

    describe('isValidPlayerId', () => {
        it('deve retornar true para strings validas', () => {
            expect(isValidPlayerId('player1')).toBe(true)
            expect(isValidPlayerId('player2')).toBe(true)
            expect(isValidPlayerId('any-string')).toBe(true)
        })

        it('deve retornar false para string vazia', () => {
            expect(isValidPlayerId('')).toBe(false)
        })
    })

    describe('createPlayerFromConfig', () => {
        const config: PlayerConfig = {
            name: 'Alice',
            lives: 3,
            resistance: 6,
            isAI: false,
        }

        it('deve criar player com dados do config', () => {
            const player = createPlayerFromConfig('player1', config)

            expect(player.id).toBe('player1')
            expect(player.name).toBe('Alice')
            expect(player.lives).toBe(3)
            expect(player.resistance).toBe(6)
            expect(player.isAI).toBe(false)
        })

        it('deve definir maxLives igual a lives inicial', () => {
            const player = createPlayerFromConfig('player1', config)
            expect(player.maxLives).toBe(config.lives)
        })

        it('deve definir maxResistance igual a resistance inicial', () => {
            const player = createPlayerFromConfig('player1', config)
            expect(player.maxResistance).toBe(config.resistance)
        })

        it('deve inicializar inventario vazio com maxItems 5', () => {
            const player = createPlayerFromConfig('player1', config)
            expect(player.inventory.items).toEqual([])
            expect(player.inventory.maxItems).toBe(5)
        })

        it('deve inicializar effects vazio', () => {
            const player = createPlayerFromConfig('player1', config)
            expect(player.effects).toEqual([])
        })

        it('deve inicializar pillCoins em 0', () => {
            const player = createPlayerFromConfig('player1', config)
            expect(player.pillCoins).toBe(0)
        })

        it('deve inicializar wantsStore em false', () => {
            const player = createPlayerFromConfig('player1', config)
            expect(player.wantsStore).toBe(false)
        })
    })

    describe('createInitialPlayersState', () => {
        it('deve criar state com 2 jogadores', () => {
            const configs: PlayerConfig[] = [
                { name: 'Alice', lives: 3, resistance: 6, isAI: false },
                { name: 'Bob', lives: 3, resistance: 6, isAI: true },
            ]

            const state = createInitialPlayersState(configs)

            expect(Object.keys(state)).toHaveLength(2)
            expect(state.player1.name).toBe('Alice')
            expect(state.player2.name).toBe('Bob')
        })

        it('deve criar state com 4 jogadores', () => {
            const configs: PlayerConfig[] = [
                { name: 'P1', lives: 3, resistance: 6, isAI: false },
                { name: 'P2', lives: 3, resistance: 6, isAI: false },
                { name: 'P3', lives: 3, resistance: 6, isAI: true },
                { name: 'P4', lives: 3, resistance: 6, isAI: true },
            ]

            const state = createInitialPlayersState(configs)

            expect(Object.keys(state)).toHaveLength(4)
            expect(state.player1.name).toBe('P1')
            expect(state.player4.name).toBe('P4')
        })

        it('deve retornar objeto vazio para array vazio', () => {
            const state = createInitialPlayersState([])
            expect(state).toEqual({})
        })
    })

    describe('getPlayerIds', () => {
        const createMockPlayers = (ids: string[]): Record<string, Player> => {
            const players: Record<string, Player> = {}
            ids.forEach((id) => {
                players[id] = {
                    id,
                    name: id,
                    lives: 3,
                    maxLives: 3,
                    resistance: 6,
                    maxResistance: 6,
                    isAI: false,
                    inventory: { items: [], maxItems: 5 },
                    effects: [],
                    pillCoins: 0,
                    wantsStore: false,
                }
            })
            return players
        }

        it('deve retornar array ordenado de IDs', () => {
            const players = createMockPlayers(['player2', 'player1', 'player3'])
            const ids = getPlayerIds(players)
            expect(ids).toEqual(['player1', 'player2', 'player3'])
        })

        it('deve ordenar corretamente com numeros > 9', () => {
            const players = createMockPlayers(['player10', 'player2', 'player1'])
            const ids = getPlayerIds(players)
            expect(ids).toEqual(['player1', 'player2', 'player10'])
        })

        it('deve retornar array vazio para objeto vazio', () => {
            const ids = getPlayerIds({})
            expect(ids).toEqual([])
        })
    })

    describe('getAlivePlayers', () => {
        const createPlayersWithLives = (livesMap: Record<string, number>): Record<string, Player> => {
            const players: Record<string, Player> = {}
            Object.entries(livesMap).forEach(([id, lives]) => {
                players[id] = {
                    id,
                    name: id,
                    lives,
                    maxLives: 3,
                    resistance: 6,
                    maxResistance: 6,
                    isAI: false,
                    inventory: { items: [], maxItems: 5 },
                    effects: [],
                    pillCoins: 0,
                    wantsStore: false,
                }
            })
            return players
        }

        it('deve retornar apenas jogadores com lives > 0', () => {
            const players = createPlayersWithLives({
                player1: 2,
                player2: 0,
                player3: 1,
            })

            const alive = getAlivePlayers(players)
            expect(alive).toEqual(['player1', 'player3'])
        })

        it('deve retornar array vazio se todos eliminados', () => {
            const players = createPlayersWithLives({
                player1: 0,
                player2: 0,
            })

            const alive = getAlivePlayers(players)
            expect(alive).toEqual([])
        })

        it('deve retornar todos se nenhum eliminado', () => {
            const players = createPlayersWithLives({
                player1: 3,
                player2: 2,
                player3: 1,
            })

            const alive = getAlivePlayers(players)
            expect(alive).toEqual(['player1', 'player2', 'player3'])
        })
    })

    describe('countAlivePlayers', () => {
        const createPlayersWithLives = (livesMap: Record<string, number>): Record<string, Player> => {
            const players: Record<string, Player> = {}
            Object.entries(livesMap).forEach(([id, lives]) => {
                players[id] = {
                    id,
                    name: id,
                    lives,
                    maxLives: 3,
                    resistance: 6,
                    maxResistance: 6,
                    isAI: false,
                    inventory: { items: [], maxItems: 5 },
                    effects: [],
                    pillCoins: 0,
                    wantsStore: false,
                }
            })
            return players
        }

        it('deve contar jogadores vivos corretamente', () => {
            const players = createPlayersWithLives({
                player1: 2,
                player2: 0,
                player3: 1,
            })

            expect(countAlivePlayers(players)).toBe(2)
        })

        it('deve retornar 0 se todos eliminados', () => {
            const players = createPlayersWithLives({
                player1: 0,
                player2: 0,
            })

            expect(countAlivePlayers(players)).toBe(0)
        })
    })

    describe('isPlayerAlive', () => {
        const createPlayersWithLives = (livesMap: Record<string, number>): Record<string, Player> => {
            const players: Record<string, Player> = {}
            Object.entries(livesMap).forEach(([id, lives]) => {
                players[id] = {
                    id,
                    name: id,
                    lives,
                    maxLives: 3,
                    resistance: 6,
                    maxResistance: 6,
                    isAI: false,
                    inventory: { items: [], maxItems: 5 },
                    effects: [],
                    pillCoins: 0,
                    wantsStore: false,
                }
            })
            return players
        }

        it('deve retornar true para jogador vivo', () => {
            const players = createPlayersWithLives({ player1: 2 })
            expect(isPlayerAlive(players, 'player1')).toBe(true)
        })

        it('deve retornar false para jogador eliminado', () => {
            const players = createPlayersWithLives({ player1: 0 })
            expect(isPlayerAlive(players, 'player1')).toBe(false)
        })

        it('deve retornar false para jogador inexistente', () => {
            const players = createPlayersWithLives({ player1: 2 })
            expect(isPlayerAlive(players, 'player99')).toBe(false)
        })
    })
})

