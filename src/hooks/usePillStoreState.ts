import { useGameStore } from '@/stores/gameStore'
import type { PlayerId } from '@/types'

/**
 * Hook para encapsular estado da Pill Store
 * 
 * Centraliza acesso ao gameStore para o componente PillStore.
 * 
 * @param playerId - ID do jogador que está comprando na loja
 * @returns Estado e actions da Pill Store para o jogador específico
 * 
 * @example
 * ```tsx
 * function PillStore({ playerId }: PillStoreProps) {
 *   const { player, storeState, addToCart } = usePillStoreState(playerId)
 *   // Componente desacoplado do store
 * }
 * ```
 */
export function usePillStoreState(playerId: PlayerId) {
  // Estado do jogador
  const player = useGameStore((s) => s.players[playerId])
  
  // Estado da loja
  const storeState = useGameStore((s) => s.storeState)
  
  // Actions da loja
  const addToCart = useGameStore((s) => s.addToCart)
  const removeFromCart = useGameStore((s) => s.removeFromCart)
  const confirmStorePurchases = useGameStore((s) => s.confirmStorePurchases)
  
  return {
    player,
    storeState,
    addToCart,
    removeFromCart,
    confirmStorePurchases,
  }
}

