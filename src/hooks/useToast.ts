import { useCallback } from 'react'
import { useToastStore, type ToastData, type ToastType } from '@/stores/toastStore'
import type { ItemType, PlayerId } from '@/types'
import { ITEM_CATALOG } from '@/utils/itemCatalog'

/**
 * Hook para gerenciar toasts
 *
 * @example
 * const { toast, dismiss, clear } = useToast()
 *
 * // Exibir toast
 * toast({ type: 'damage', message: 'Voce sofreu dano!', value: 15, playerId: 'player1' })
 *
 * // Helpers tipados
 * toast.damage('Voce sofreu dano!', 15, 'player1')
 * toast.heal('Voce se curou!', 10, 'player1')
 * toast.item('scanner', 'player1', 'Pilula revelada!')
 */
export function useToast() {
  const show = useToastStore((s) => s.show)
  const dismiss = useToastStore((s) => s.dismiss)
  const clear = useToastStore((s) => s.clear)
  const toasts = useToastStore((s) => s.toasts)

  /**
   * Exibe um toast com dados completos
   */
  const toast = useCallback(
    (data: ToastData) => {
      show(data)
    },
    [show]
  )

  /**
   * Helper para toast de dano
   * @param playerId - ID do jogador que recebeu o dano
   */
  const damage = useCallback(
    (message: string, value?: number, playerId?: PlayerId) => {
      show({ type: 'damage', message, value, playerId })
    },
    [show]
  )

  /**
   * Helper para toast de cura
   * @param playerId - ID do jogador que recebeu a cura
   */
  const heal = useCallback(
    (message: string, value?: number, playerId?: PlayerId) => {
      show({ type: 'heal', message, value, playerId })
    },
    [show]
  )

  /**
   * Helper para toast de colapso
   * @param playerId - ID do jogador que colapsou
   */
  const collapse = useCallback(
    (message: string, playerId?: PlayerId) => {
      show({ type: 'collapse', message, playerId })
    },
    [show]
  )

  /**
   * Helper para toast seguro
   * @param playerId - ID do jogador que esta seguro
   */
  const safe = useCallback(
    (message: string, playerId?: PlayerId) => {
      show({ type: 'safe', message, playerId })
    },
    [show]
  )

  /**
   * Helper para toast fatal
   * @param playerId - ID do jogador que sofreu dano fatal
   */
  const fatal = useCallback(
    (message: string, value?: number, playerId?: PlayerId) => {
      show({ type: 'fatal', message, value, playerId })
    },
    [show]
  )

  /**
   * Helper para toast de item usado
   * @param itemType - Tipo do item usado
   * @param playerId - ID do jogador que usou o item
   * @param message - Mensagem opcional (default: descricao do item)
   */
  const item = useCallback(
    (itemType: ItemType, playerId?: PlayerId, message?: string) => {
      const itemDef = ITEM_CATALOG[itemType]
      show({
        type: 'item',
        message: message ?? itemDef.description,
        itemType,
        playerId,
      })
    },
    [show]
  )

  /**
   * Helper para toast informativo (sistema/multiplayer)
   * @param message - Mensagem informativa
   * @param duration - Duracao opcional (default: 3000ms)
   */
  const info = useCallback(
    (message: string, duration?: number) => {
      show({ type: 'info', message, duration })
    },
    [show]
  )

  // Adiciona helpers como propriedades da funcao toast
  const toastWithHelpers = Object.assign(toast, {
    damage,
    heal,
    collapse,
    safe,
    fatal,
    item,
    info,
  })

  return {
    toast: toastWithHelpers,
    toasts,
    dismiss,
    clear,
  }
}

/**
 * Selector para lista de toasts (uso em ToastManager)
 */
export function useToasts() {
  return useToastStore((s) => s.toasts)
}

/**
 * Selector para action de dismiss (uso em Toast individual)
 */
export function useToastDismiss() {
  return useToastStore((s) => s.dismiss)
}

// Re-export types
export type { ToastData, ToastType }

