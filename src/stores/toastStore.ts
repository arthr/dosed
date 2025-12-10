import { create } from 'zustand'
import type { ItemType, PillType, PlayerId } from '@/types'

/**
 * Tipos de toast disponiveis
 */
export type ToastType = 'damage' | 'heal' | 'collapse' | 'safe' | 'fatal' | 'item' | 'quest' | 'info'

/**
 * Estrutura de um toast
 */
export interface Toast {
  id: string
  type: ToastType
  message: string
  pillType?: PillType
  itemType?: ItemType
  value?: number
  duration: number
  /** ID do jogador associado ao toast (para posicionamento contextual) */
  playerId?: PlayerId
}

/**
 * Dados para criar um toast (sem id, gerado automaticamente)
 */
export type ToastData = Omit<Toast, 'id' | 'duration'> & { duration?: number }

/**
 * Store de toasts
 */
interface ToastStore {
  /** Lista de toasts ativos */
  toasts: Toast[]

  /**
   * Exibe um novo toast
   */
  show: (data: ToastData) => void

  /**
   * Remove um toast pelo id
   */
  dismiss: (id: string) => void

  /**
   * Remove todos os toasts
   */
  clear: () => void
}

const DEFAULT_DURATION = 1500

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  show: (data) => {
    const toast: Toast = {
      ...data,
      id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      duration: data.duration ?? DEFAULT_DURATION,
    }

    set((state) => ({
      toasts: [...state.toasts, toast],
    }))
  },

  dismiss: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  clear: () => {
    set({ toasts: [] })
  },
}))

