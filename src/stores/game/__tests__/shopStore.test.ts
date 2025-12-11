import { describe, it, expect, beforeEach } from 'vitest'
import { useShopStore } from '../shopStore'

describe('shopStore', () => {
    beforeEach(() => {
        // Reset store antes de cada teste
        useShopStore.getState().reset()
    })

    describe('estado inicial', () => {
        it('deve iniciar com storeState null', () => {
            const state = useShopStore.getState()
            expect(state.storeState).toBeNull()
        })
    })

    describe('openShop / closeShop', () => {
        it('deve abrir loja com carrinhos vazios para 2 jogadores', () => {
            useShopStore.getState().openShop(30000, ['player1', 'player2'])

            const state = useShopStore.getState()
            expect(state.storeState).not.toBeNull()
            expect(state.storeState?.cart.player1).toEqual([])
            expect(state.storeState?.cart.player2).toEqual([])
            expect(state.storeState?.confirmed.player1).toBe(false)
            expect(state.storeState?.confirmed.player2).toBe(false)
            expect(state.storeState?.timerDuration).toBe(30000)
            expect(state.storeState?.timerStartedAt).toBeTypeOf('number')
        })

        it('deve abrir loja para 4 jogadores', () => {
            useShopStore.getState().openShop(30000, ['player1', 'player2', 'player3', 'player4'])

            const state = useShopStore.getState()
            expect(state.storeState).not.toBeNull()
            expect(Object.keys(state.storeState?.cart ?? {})).toHaveLength(4)
            expect(state.storeState?.cart.player1).toEqual([])
            expect(state.storeState?.cart.player4).toEqual([])
            expect(state.storeState?.confirmed.player3).toBe(false)
            expect(state.storeState?.pendingBoosts.player4).toEqual([])
        })

        it('deve fechar loja e limpar estado', () => {
            const store = useShopStore.getState()
            store.openShop(30000, ['player1', 'player2'])
            store.addToCart('player1', 'power_scanner', 2)
            store.closeShop()

            expect(useShopStore.getState().storeState).toBeNull()
        })
    })

    describe('addToCart', () => {
        beforeEach(() => {
            useShopStore.getState().openShop(30000, ['player1', 'player2'])
        })

        it('deve adicionar item ao carrinho', () => {
            const result = useShopStore.getState().addToCart('player1', 'power_scanner', 2)

            expect(result).toBe(true)
            const cart = useShopStore.getState().getCart('player1')
            expect(cart).toHaveLength(1)
            expect(cart[0].storeItemId).toBe('power_scanner')
            expect(cart[0].cost).toBe(2)
        })

        it('deve permitir itens stackable duplicados', () => {
            const store = useShopStore.getState()
            store.addToCart('player1', 'power_scanner', 2)
            const result = store.addToCart('player1', 'power_scanner', 2)

            expect(result).toBe(true)
            expect(useShopStore.getState().getCart('player1')).toHaveLength(2)
        })

        it('deve bloquear itens nao-stackable duplicados', () => {
            const store = useShopStore.getState()
            // life_up e nao-stackable (stackable: false no storeConfig)
            store.addToCart('player1', 'life_up', 3)
            const result = store.addToCart('player1', 'life_up', 3)

            expect(result).toBe(false)
            expect(useShopStore.getState().getCart('player1')).toHaveLength(1)
        })

        it('deve manter carrinhos separados por jogador', () => {
            const store = useShopStore.getState()
            store.addToCart('player1', 'power_scanner', 2)
            store.addToCart('player2', 'power_shield', 2)

            expect(useShopStore.getState().getCart('player1')).toHaveLength(1)
            expect(useShopStore.getState().getCart('player2')).toHaveLength(1)
            expect(useShopStore.getState().getCart('player1')[0].storeItemId).toBe('power_scanner')
            expect(useShopStore.getState().getCart('player2')[0].storeItemId).toBe('power_shield')
        })

        it('deve retornar false se loja fechada', () => {
            useShopStore.getState().closeShop()
            const result = useShopStore.getState().addToCart('player1', 'power_scanner', 2)

            expect(result).toBe(false)
        })

        it('deve funcionar com jogador nao inicializado (cria automaticamente)', () => {
            const store = useShopStore.getState()
            const result = store.addToCart('player99', 'power_scanner', 2)

            expect(result).toBe(true)
            expect(store.getCart('player99')).toHaveLength(1)
        })
    })

    describe('removeFromCart', () => {
        beforeEach(() => {
            useShopStore.getState().openShop(30000, ['player1', 'player2'])
        })

        it('deve remover item do carrinho', () => {
            const store = useShopStore.getState()
            store.addToCart('player1', 'power_scanner', 2)
            store.addToCart('player1', 'power_shield', 2)

            store.removeFromCart('player1', 'power_scanner')

            const cart = useShopStore.getState().getCart('player1')
            expect(cart).toHaveLength(1)
            expect(cart[0].storeItemId).toBe('power_shield')
        })

        it('deve remover apenas primeira ocorrencia de item stackable', () => {
            const store = useShopStore.getState()
            store.addToCart('player1', 'power_scanner', 2)
            store.addToCart('player1', 'power_scanner', 2)

            store.removeFromCart('player1', 'power_scanner')

            expect(useShopStore.getState().getCart('player1')).toHaveLength(1)
        })

        it('nao deve afetar outro jogador', () => {
            const store = useShopStore.getState()
            store.addToCart('player1', 'power_scanner', 2)
            store.addToCart('player2', 'power_scanner', 2)

            store.removeFromCart('player1', 'power_scanner')

            expect(useShopStore.getState().getCart('player1')).toHaveLength(0)
            expect(useShopStore.getState().getCart('player2')).toHaveLength(1)
        })

        it('deve ignorar se item nao existe no carrinho', () => {
            const store = useShopStore.getState()
            store.addToCart('player1', 'power_scanner', 2)

            // Nao deve lancar erro
            store.removeFromCart('player1', 'power_shield')

            expect(useShopStore.getState().getCart('player1')).toHaveLength(1)
        })
    })

    describe('clearCart', () => {
        it('deve limpar carrinho do jogador', () => {
            const store = useShopStore.getState()
            store.openShop(30000, ['player1', 'player2'])
            store.addToCart('player1', 'power_scanner', 2)
            store.addToCart('player1', 'power_shield', 2)

            store.clearCart('player1')

            expect(useShopStore.getState().getCart('player1')).toHaveLength(0)
        })

        it('nao deve afetar outro jogador', () => {
            const store = useShopStore.getState()
            store.openShop(30000, ['player1', 'player2'])
            store.addToCart('player1', 'power_scanner', 2)
            store.addToCart('player2', 'power_scanner', 2)

            store.clearCart('player1')

            expect(useShopStore.getState().getCart('player1')).toHaveLength(0)
            expect(useShopStore.getState().getCart('player2')).toHaveLength(1)
        })
    })

    describe('confirmPlayer', () => {
        beforeEach(() => {
            useShopStore.getState().openShop(30000, ['player1', 'player2'])
        })

        it('deve marcar jogador como confirmado', () => {
            useShopStore.getState().confirmPlayer('player1')

            expect(useShopStore.getState().isConfirmed('player1')).toBe(true)
            expect(useShopStore.getState().isConfirmed('player2')).toBe(false)
        })

        it('deve permitir confirmar todos os jogadores', () => {
            const store = useShopStore.getState()
            store.confirmPlayer('player1')
            store.confirmPlayer('player2')

            expect(useShopStore.getState().isConfirmed('player1')).toBe(true)
            expect(useShopStore.getState().isConfirmed('player2')).toBe(true)
        })

        it('deve funcionar com 4 jogadores', () => {
            useShopStore.getState().reset()
            useShopStore.getState().openShop(30000, ['player1', 'player2', 'player3', 'player4'])

            const store = useShopStore.getState()
            store.confirmPlayer('player1')
            store.confirmPlayer('player3')

            expect(store.isConfirmed('player1')).toBe(true)
            expect(store.isConfirmed('player2')).toBe(false)
            expect(store.isConfirmed('player3')).toBe(true)
            expect(store.isConfirmed('player4')).toBe(false)
        })
    })

    describe('isConfirmed', () => {
        it('deve retornar false se loja fechada', () => {
            expect(useShopStore.getState().isConfirmed('player1')).toBe(false)
        })

        it('deve retornar false se nao confirmou', () => {
            useShopStore.getState().openShop(30000, ['player1', 'player2'])
            expect(useShopStore.getState().isConfirmed('player1')).toBe(false)
        })

        it('deve retornar true se confirmou', () => {
            const store = useShopStore.getState()
            store.openShop(30000, ['player1', 'player2'])
            store.confirmPlayer('player1')

            expect(store.isConfirmed('player1')).toBe(true)
        })

        it('deve retornar false para jogador nao inicializado', () => {
            useShopStore.getState().openShop(30000, ['player1', 'player2'])
            expect(useShopStore.getState().isConfirmed('player99')).toBe(false)
        })
    })

    describe('pendingBoosts', () => {
        beforeEach(() => {
            useShopStore.getState().openShop(30000, ['player1', 'player2'])
        })

        it('deve adicionar boost pendente', () => {
            useShopStore.getState().addPendingBoost('player1', 'life_up')

            const boosts = useShopStore.getState().getPendingBoosts('player1')
            expect(boosts).toHaveLength(1)
            expect(boosts[0]).toBe('life_up')
        })

        it('deve permitir multiplos boosts', () => {
            const store = useShopStore.getState()
            store.addPendingBoost('player1', 'life_up')
            store.addPendingBoost('player1', 'full_resistance')

            const boosts = useShopStore.getState().getPendingBoosts('player1')
            expect(boosts).toHaveLength(2)
            expect(boosts).toContain('life_up')
            expect(boosts).toContain('full_resistance')
        })

        it('deve manter boosts separados por jogador', () => {
            const store = useShopStore.getState()
            store.addPendingBoost('player1', 'life_up')
            store.addPendingBoost('player2', 'full_resistance')

            expect(useShopStore.getState().getPendingBoosts('player1')).toEqual(['life_up'])
            expect(useShopStore.getState().getPendingBoosts('player2')).toEqual(['full_resistance'])
        })

        it('deve limpar boosts pendentes de todos (2 jogadores)', () => {
            const store = useShopStore.getState()
            store.addPendingBoost('player1', 'life_up')
            store.addPendingBoost('player2', 'full_resistance')

            store.clearPendingBoosts()

            expect(useShopStore.getState().getPendingBoosts('player1')).toHaveLength(0)
            expect(useShopStore.getState().getPendingBoosts('player2')).toHaveLength(0)
        })

        it('deve limpar boosts pendentes de todos (4 jogadores)', () => {
            useShopStore.getState().reset()
            useShopStore.getState().openShop(30000, ['player1', 'player2', 'player3', 'player4'])

            const store = useShopStore.getState()
            store.addPendingBoost('player1', 'life_up')
            store.addPendingBoost('player2', 'full_resistance')
            store.addPendingBoost('player3', 'life_up')
            store.addPendingBoost('player4', 'full_resistance')

            store.clearPendingBoosts()

            expect(store.getPendingBoosts('player1')).toHaveLength(0)
            expect(store.getPendingBoosts('player2')).toHaveLength(0)
            expect(store.getPendingBoosts('player3')).toHaveLength(0)
            expect(store.getPendingBoosts('player4')).toHaveLength(0)
        })

        it('deve retornar array vazio se loja fechada', () => {
            useShopStore.getState().closeShop()
            expect(useShopStore.getState().getPendingBoosts('player1')).toEqual([])
        })

        it('deve retornar array vazio para jogador nao inicializado', () => {
            expect(useShopStore.getState().getPendingBoosts('player99')).toEqual([])
        })
    })

    describe('getCartTotal', () => {
        beforeEach(() => {
            useShopStore.getState().openShop(30000, ['player1', 'player2'])
        })

        it('deve retornar 0 para carrinho vazio', () => {
            expect(useShopStore.getState().getCartTotal('player1')).toBe(0)
        })

        it('deve somar custos dos itens', () => {
            const store = useShopStore.getState()
            store.addToCart('player1', 'power_scanner', 2)
            store.addToCart('player1', 'life_up', 3)

            expect(useShopStore.getState().getCartTotal('player1')).toBe(5)
        })

        it('deve retornar 0 se loja fechada', () => {
            useShopStore.getState().closeShop()
            expect(useShopStore.getState().getCartTotal('player1')).toBe(0)
        })

        it('deve retornar 0 para jogador nao inicializado', () => {
            expect(useShopStore.getState().getCartTotal('player99')).toBe(0)
        })
    })

    describe('hasNonStackableItem', () => {
        beforeEach(() => {
            useShopStore.getState().openShop(30000, ['player1', 'player2'])
        })

        it('deve retornar false para item stackable', () => {
            const store = useShopStore.getState()
            store.addToCart('player1', 'power_scanner', 2)

            expect(store.hasNonStackableItem('player1', 'power_scanner')).toBe(false)
        })

        it('deve retornar true para item nao-stackable no carrinho', () => {
            const store = useShopStore.getState()
            store.addToCart('player1', 'life_up', 3)

            expect(store.hasNonStackableItem('player1', 'life_up')).toBe(true)
        })

        it('deve retornar false para item nao-stackable fora do carrinho', () => {
            expect(useShopStore.getState().hasNonStackableItem('player1', 'life_up')).toBe(false)
        })

        it('deve retornar false se loja fechada', () => {
            useShopStore.getState().closeShop()
            expect(useShopStore.getState().hasNonStackableItem('player1', 'life_up')).toBe(false)
        })
    })

    describe('reset', () => {
        it('deve resetar para estado inicial', () => {
            const store = useShopStore.getState()
            store.openShop(30000, ['player1', 'player2'])
            store.addToCart('player1', 'power_scanner', 2)
            store.confirmPlayer('player1')
            store.addPendingBoost('player2', 'life_up')

            store.reset()

            expect(useShopStore.getState().storeState).toBeNull()
        })
    })
})
