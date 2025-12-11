import { create } from 'zustand'
import type { StoreState, CartItem, BoostType, PlayerId } from '@/types'
import { getStoreItemById } from '@/utils/storeConfig'

/**
 * Estado da Pill Store
 * Gerencia carrinho, confirmacoes e boosts pendentes
 *
 * @see ADR-001-store-decomposition.md
 */
interface ShopState {
  /** Estado da loja (null quando fora da fase shopping) */
  storeState: StoreState | null
}

/**
 * Actions do store de loja
 */
interface ShopActions {
  /**
   * Abre a loja com carrinhos vazios
   * @param timerDuration - Duracao do timer em ms
   */
  openShop: (timerDuration: number) => void

  /**
   * Fecha a loja e limpa estado
   */
  closeShop: () => void

  /**
   * Adiciona item ao carrinho do jogador
   * @returns true se adicionou, false se falhou (item nao-stackable ja existe)
   */
  addToCart: (playerId: PlayerId, storeItemId: string, cost: number) => boolean

  /**
   * Remove item do carrinho do jogador
   */
  removeFromCart: (playerId: PlayerId, storeItemId: string) => void

  /**
   * Limpa o carrinho do jogador (apos checkout)
   */
  clearCart: (playerId: PlayerId) => void

  /**
   * Marca jogador como confirmado
   */
  confirmPlayer: (playerId: PlayerId) => void

  /**
   * Verifica se jogador ja confirmou
   */
  isConfirmed: (playerId: PlayerId) => boolean

  /**
   * Adiciona boost pendente para aplicar na proxima rodada
   */
  addPendingBoost: (playerId: PlayerId, boostType: BoostType) => void

  /**
   * Obtem boosts pendentes de um jogador
   */
  getPendingBoosts: (playerId: PlayerId) => BoostType[]

  /**
   * Limpa boosts pendentes de todos os jogadores
   */
  clearPendingBoosts: () => void

  /**
   * Obtem carrinho de um jogador
   */
  getCart: (playerId: PlayerId) => CartItem[]

  /**
   * Calcula total do carrinho de um jogador
   */
  getCartTotal: (playerId: PlayerId) => number

  /**
   * Verifica se item nao-stackable ja esta no carrinho
   */
  hasNonStackableItem: (playerId: PlayerId, storeItemId: string) => boolean

  /**
   * Reseta o store para estado inicial
   */
  reset: () => void
}

type ShopStore = ShopState & ShopActions

/**
 * Estado inicial
 */
const initialState: ShopState = {
  storeState: null,
}

/**
 * Cria estado inicial da loja
 */
function createInitialStoreState(timerDuration: number): StoreState {
  return {
    confirmed: { player1: false, player2: false },
    timerStartedAt: Date.now(),
    timerDuration,
    pendingBoosts: { player1: [], player2: [] },
    cart: { player1: [], player2: [] },
  }
}

/**
 * Zustand Store para gerenciamento da Pill Store
 *
 * Responsabilidades:
 * - Carrinho de compras (add/remove)
 * - Estado de confirmacao
 * - Boosts pendentes para proxima rodada
 * - Timer da fase shopping
 *
 * NAO gerencia:
 * - pillCoins (fica no player via gameStore)
 * - wantsStore (fica no player via gameStore)
 * - Transicao de fase (gameStore decide)
 */
export const useShopStore = create<ShopStore>((set, get) => ({
  ...initialState,

  openShop: (timerDuration) => {
    set({
      storeState: createInitialStoreState(timerDuration),
    })
  },

  closeShop: () => {
    set({ storeState: null })
  },

  addToCart: (playerId, storeItemId, cost) => {
    const state = get()
    if (!state.storeState) return false

    // Verifica se item e nao-stackable e ja existe
    const item = getStoreItemById(storeItemId)
    if (item && item.stackable === false) {
      const alreadyInCart = state.storeState.cart[playerId].some(
        (ci) => ci.storeItemId === storeItemId
      )
      if (alreadyInCart) return false
    }

    const newCartItem: CartItem = { storeItemId, cost }

    set({
      storeState: {
        ...state.storeState,
        cart: {
          ...state.storeState.cart,
          [playerId]: [...state.storeState.cart[playerId], newCartItem],
        },
      },
    })

    return true
  },

  removeFromCart: (playerId, storeItemId) => {
    const state = get()
    if (!state.storeState) return

    const cart = state.storeState.cart[playerId]
    // Remove primeira ocorrencia do item
    const indexToRemove = cart.findIndex((ci) => ci.storeItemId === storeItemId)
    if (indexToRemove === -1) return

    const newCart = [...cart]
    newCart.splice(indexToRemove, 1)

    set({
      storeState: {
        ...state.storeState,
        cart: {
          ...state.storeState.cart,
          [playerId]: newCart,
        },
      },
    })
  },

  clearCart: (playerId) => {
    const state = get()
    if (!state.storeState) return

    set({
      storeState: {
        ...state.storeState,
        cart: {
          ...state.storeState.cart,
          [playerId]: [],
        },
      },
    })
  },

  confirmPlayer: (playerId) => {
    const state = get()
    if (!state.storeState) return

    set({
      storeState: {
        ...state.storeState,
        confirmed: {
          ...state.storeState.confirmed,
          [playerId]: true,
        },
      },
    })
  },

  isConfirmed: (playerId) => {
    const state = get()
    if (!state.storeState) return false
    return state.storeState.confirmed[playerId]
  },

  addPendingBoost: (playerId, boostType) => {
    const state = get()
    if (!state.storeState) return

    set({
      storeState: {
        ...state.storeState,
        pendingBoosts: {
          ...state.storeState.pendingBoosts,
          [playerId]: [...state.storeState.pendingBoosts[playerId], boostType],
        },
      },
    })
  },

  getPendingBoosts: (playerId) => {
    const state = get()
    if (!state.storeState) return []
    return state.storeState.pendingBoosts[playerId]
  },

  clearPendingBoosts: () => {
    const state = get()
    if (!state.storeState) return

    set({
      storeState: {
        ...state.storeState,
        pendingBoosts: { player1: [], player2: [] },
      },
    })
  },

  getCart: (playerId) => {
    const state = get()
    if (!state.storeState) return []
    return state.storeState.cart[playerId]
  },

  getCartTotal: (playerId) => {
    const state = get()
    if (!state.storeState) return 0
    return state.storeState.cart[playerId].reduce((sum, ci) => sum + ci.cost, 0)
  },

  hasNonStackableItem: (playerId, storeItemId) => {
    const state = get()
    if (!state.storeState) return false

    const item = getStoreItemById(storeItemId)
    if (!item || item.stackable !== false) return false

    return state.storeState.cart[playerId].some(
      (ci) => ci.storeItemId === storeItemId
    )
  },

  reset: () => {
    set(initialState)
  },
}))

// ============ HOOKS HELPERS ============

/**
 * Hook para obter estado completo da loja
 */
export const useStoreState = () =>
  useShopStore((state) => state.storeState)

/**
 * Hook para verificar se loja esta aberta
 */
export const useIsShopOpen = () =>
  useShopStore((state) => state.storeState !== null)

/**
 * Hook para obter carrinho de um jogador
 */
export const usePlayerCart = (playerId: PlayerId) =>
  useShopStore((state) => state.storeState?.cart[playerId] ?? [])

/**
 * Hook para obter total do carrinho
 */
export const useCartTotal = (playerId: PlayerId) =>
  useShopStore((state) => {
    if (!state.storeState) return 0
    return state.storeState.cart[playerId].reduce((sum, ci) => sum + ci.cost, 0)
  })

/**
 * Hook para verificar se jogador confirmou
 */
export const useIsPlayerConfirmed = (playerId: PlayerId) =>
  useShopStore((state) => state.storeState?.confirmed[playerId] ?? false)

/**
 * Hook para obter boosts pendentes
 */
export const usePendingBoosts = (playerId: PlayerId) =>
  useShopStore((state) => state.storeState?.pendingBoosts[playerId] ?? [])

/**
 * Hook para obter timer info
 */
export const useShopTimer = () =>
  useShopStore((state) => ({
    startedAt: state.storeState?.timerStartedAt ?? null,
    duration: state.storeState?.timerDuration ?? 0,
  }))

