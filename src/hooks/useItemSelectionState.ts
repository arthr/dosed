import { useGameStore } from '@/stores/gameStore'
import type { PlayerId } from '@/types'

/**
 * Hook para encapsular estado de confirmação da seleção de itens
 * 
 * Centraliza acesso ao gameStore para status de confirmação de ambos os jogadores
 * na tela de seleção de itens pré-jogo.
 * 
 * @param myPlayerId - ID do jogador local
 * @param opponentId - ID do oponente
 * @returns Status de confirmação de ambos os jogadores
 * 
 * @example
 * ```tsx
 * function ItemSelectionScreen() {
 *   const { myConfirmed, opponentConfirmed } = useItemSelectionState('player1', 'player2')
 *   // Componente desacoplado do store
 * }
 * ```
 */
export function useItemSelectionState(
  myPlayerId: PlayerId,
  opponentId: PlayerId
) {
  const myConfirmed = useGameStore((s) => s.itemSelectionConfirmed[myPlayerId])
  const opponentConfirmed = useGameStore((s) => s.itemSelectionConfirmed[opponentId])
  
  return {
    myConfirmed,
    opponentConfirmed,
  }
}

