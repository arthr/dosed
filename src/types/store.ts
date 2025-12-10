import type { LucideIcon } from 'lucide-react'
import type { ItemType } from './item'
import type { Player, PlayerId } from './player'

/**
 * Tipos de Boosts (efeitos imediatos aplicados ao iniciar proxima rodada)
 */
export type BoostType =
  | 'life_up'         // +1 vida
  | 'full_resistance' // Resistencia MAX
  | 'reveal_start'    // Inicia rodada com N pills reveladas

/**
 * Tipos de itens na loja
 */
export type StoreItemType = 'power_up' | 'boost'

/**
 * Item vendido na Pill Store
 */
export interface StoreItem {
  /** ID unico do item na loja */
  id: string
  /** Tipo do item (power_up ou boost) */
  type: StoreItemType
  /** Nome de exibicao */
  name: string
  /** Descricao do efeito */
  description: string
  /** Custo em Pill Coins */
  cost: number
  /** Icone Lucide */
  icon: LucideIcon
  /** Para power_up: qual ItemType adicionar ao inventario */
  itemType?: ItemType
  /** Para boost: qual efeito aplicar */
  boostType?: BoostType
  /** Condicao para estar disponivel (opcional) */
  isAvailable?: (player: Player) => boolean
}

/**
 * Item no carrinho de compras
 */
export interface CartItem {
  /** ID do item da loja */
  storeItemId: string
  /** Custo do item */
  cost: number
}

/**
 * Estado da Pill Store (apenas durante fase shopping)
 * Nota: wantsStore fica no Player, nao aqui
 */
export interface StoreState {
  /** Jogadores que confirmaram compras */
  confirmed: Record<PlayerId, boolean>
  /** Timestamp de inicio do timer */
  timerStartedAt: number | null
  /** Duracao atual do timer (ms) */
  timerDuration: number
  /** Boosts comprados para aplicar na proxima rodada */
  pendingBoosts: Record<PlayerId, BoostType[]>
  /** Carrinho de compras de cada jogador (itens adicionados mas nao confirmados) */
  cart: Record<PlayerId, CartItem[]>
}

/**
 * Configuracao da loja
 */
export interface StoreConfig {
  /** Itens disponiveis na loja */
  items: StoreItem[]
  /** Custo base de power-ups */
  powerUpBaseCost: number
  /** Tempo para fazer compras (ms) */
  shoppingTime: number
  /** Multiplicador de reducao do timer quando oponente confirma */
  reduceMultiplier: number
}

