import { create } from 'zustand'
import type { Pill, PlayerId, Player, GameStats, ItemType } from '@/types'

/**
 * Tipos de overlay disponiveis
 */
export type OverlayType = 'pillReveal' | 'gameOver' | 'newRound' | 'itemEffect' | null

/**
 * Dados do overlay PillReveal
 */
export interface PillRevealData {
  pill: Pill
  isAITurn: boolean
}

/**
 * Dados do overlay GameOver
 */
export interface GameOverData {
  winner: PlayerId | null
  players: Record<PlayerId, Player>
  stats: GameStats
}

/**
 * Dados do overlay NewRound
 */
export interface NewRoundData {
  round: number
}

/**
 * Dados do overlay ItemEffect
 */
export interface ItemEffectData {
  itemType: ItemType
  targetInfo?: string
}

/**
 * Store de overlays bloqueantes
 */
interface OverlayStore {
  /** Overlay atualmente ativo */
  current: OverlayType

  /** Dados do PillReveal */
  pillRevealData: PillRevealData | null

  /** Dados do GameOver */
  gameOverData: GameOverData | null

  /** Dados do NewRound */
  newRoundData: NewRoundData | null

  /** Dados do ItemEffect */
  itemEffectData: ItemEffectData | null

  /**
   * Abre o overlay de revelacao de pilula
   */
  openPillReveal: (pill: Pill, isAITurn: boolean) => void

  /**
   * Abre o overlay de fim de jogo
   */
  openGameOver: (
    winner: PlayerId | null,
    players: Record<PlayerId, Player>,
    stats: GameStats
  ) => void

  /**
   * Abre o overlay de nova rodada
   */
  openNewRound: (round: number) => void

  /**
   * Abre o overlay de efeito de item
   */
  openItemEffect: (itemType: ItemType, targetInfo?: string) => void

  /**
   * Fecha o overlay atual
   */
  close: () => void
}

export const useOverlayStore = create<OverlayStore>((set) => ({
  current: null,
  pillRevealData: null,
  gameOverData: null,
  newRoundData: null,
  itemEffectData: null,

  openPillReveal: (pill, isAITurn) => {
    set({
      current: 'pillReveal',
      pillRevealData: { pill, isAITurn },
    })
  },

  openGameOver: (winner, players, stats) => {
    set({
      current: 'gameOver',
      gameOverData: { winner, players, stats },
    })
  },

  openNewRound: (round) => {
    set({
      current: 'newRound',
      newRoundData: { round },
    })
  },

  openItemEffect: (itemType, targetInfo) => {
    set({
      current: 'itemEffect',
      itemEffectData: { itemType, targetInfo },
    })
  },

  close: () => {
    set({
      current: null,
      pillRevealData: null,
      gameOverData: null,
      newRoundData: null,
      itemEffectData: null,
    })
  },
}))

