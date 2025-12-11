import { describe, it, expect } from 'vitest'
import {
    getNextTurn,
    getTargetablePlayers,
    canGameContinue,
    getWinner,
} from '../turnManager'

describe('turnManager', () => {
    describe('getNextTurn', () => {
        it('deve retornar proximo jogador na ordem', () => {
            const result = getNextTurn('player1', ['player1', 'player2', 'player3'])
            expect(result).toBe('player2')
        })

        it('deve fazer rotacao circular (volta ao inicio)', () => {
            const result = getNextTurn('player3', ['player1', 'player2', 'player3'])
            expect(result).toBe('player1')
        })

        it('deve funcionar com 2 jogadores', () => {
            expect(getNextTurn('player1', ['player1', 'player2'])).toBe('player2')
            expect(getNextTurn('player2', ['player1', 'player2'])).toBe('player1')
        })

        it('deve pular jogador eliminado', () => {
            const playerOrder = ['player1', 'player2', 'player3']
            const alivePlayers = ['player1', 'player3'] // player2 eliminado
            
            const result = getNextTurn('player1', playerOrder, alivePlayers)
            expect(result).toBe('player3')
        })

        it('deve fazer rotacao circular pulando eliminados', () => {
            const playerOrder = ['player1', 'player2', 'player3', 'player4']
            const alivePlayers = ['player1', 'player4'] // player2 e player3 eliminados
            
            const result = getNextTurn('player1', playerOrder, alivePlayers)
            expect(result).toBe('player4')
        })

        it('deve retornar primeiro jogador ativo se atual foi eliminado', () => {
            const playerOrder = ['player1', 'player2', 'player3']
            const alivePlayers = ['player2', 'player3'] // player1 eliminado
            
            const result = getNextTurn('player1', playerOrder, alivePlayers)
            expect(result).toBe('player2')
        })

        it('deve retornar o mesmo jogador se for o unico ativo', () => {
            const playerOrder = ['player1', 'player2', 'player3']
            const alivePlayers = ['player2'] // apenas player2 vivo
            
            const result = getNextTurn('player2', playerOrder, alivePlayers)
            expect(result).toBe('player2')
        })

        it('deve lancar erro se playerOrder vazio', () => {
            expect(() => getNextTurn('player1', [])).toThrow('playerOrder cannot be empty')
        })

        it('deve lancar erro se nenhum jogador ativo', () => {
            const playerOrder = ['player1', 'player2']
            const alivePlayers: string[] = []
            
            expect(() => getNextTurn('player1', playerOrder, alivePlayers)).toThrow('No active players remaining')
        })
    })

    describe('getTargetablePlayers', () => {
        it('deve excluir jogador atual', () => {
            const result = getTargetablePlayers('player1', ['player1', 'player2', 'player3'])
            expect(result).toEqual(['player2', 'player3'])
        })

        it('deve retornar array vazio se jogador atual for o unico', () => {
            const result = getTargetablePlayers('player1', ['player1'])
            expect(result).toEqual([])
        })

        it('deve filtrar jogadores eliminados', () => {
            const allPlayers = ['player1', 'player2', 'player3']
            const alivePlayers = ['player1', 'player3']
            
            const result = getTargetablePlayers('player1', allPlayers, alivePlayers)
            expect(result).toEqual(['player3'])
        })

        it('deve retornar array vazio se todos outros eliminados', () => {
            const allPlayers = ['player1', 'player2', 'player3']
            const alivePlayers = ['player1']
            
            const result = getTargetablePlayers('player1', allPlayers, alivePlayers)
            expect(result).toEqual([])
        })

        it('deve funcionar com 4 jogadores', () => {
            const result = getTargetablePlayers('player2', ['player1', 'player2', 'player3', 'player4'])
            expect(result).toEqual(['player1', 'player3', 'player4'])
        })
    })

    describe('canGameContinue', () => {
        it('deve retornar true com 2+ jogadores vivos', () => {
            expect(canGameContinue(['player1', 'player2'])).toBe(true)
            expect(canGameContinue(['player1', 'player2', 'player3'])).toBe(true)
        })

        it('deve retornar false com menos de 2 jogadores', () => {
            expect(canGameContinue(['player1'])).toBe(false)
            expect(canGameContinue([])).toBe(false)
        })

        it('deve respeitar minPlayers customizado', () => {
            expect(canGameContinue(['player1', 'player2'], 3)).toBe(false)
            expect(canGameContinue(['player1', 'player2', 'player3'], 3)).toBe(true)
        })
    })

    describe('getWinner', () => {
        it('deve retornar null se mais de 1 jogador vivo', () => {
            expect(getWinner(['player1', 'player2'])).toBeNull()
            expect(getWinner(['player1', 'player2', 'player3'])).toBeNull()
        })

        it('deve retornar vencedor se apenas 1 jogador vivo', () => {
            expect(getWinner(['player2'])).toBe('player2')
            expect(getWinner(['player3'])).toBe('player3')
        })

        it('deve retornar null se nenhum jogador vivo', () => {
            expect(getWinner([])).toBeNull()
        })
    })
})

