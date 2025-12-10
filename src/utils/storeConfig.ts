import { Heart, Shield, Scan, Syringe, Eye, Bomb } from 'lucide-react'
import type { StoreConfig, StoreItem } from '@/types'
import { GAME_LIMITS } from './constants'

/** Limite de itens no inventario (definido em gameLogic.createPlayer) */
const MAX_INVENTORY_ITEMS = 5

/**
 * Itens disponiveis na Pill Store
 */
export const STORE_ITEMS: StoreItem[] = [
  // ============ BOOSTS (efeitos imediatos na proxima rodada) ============

  {
    id: 'life_up',
    type: 'boost',
    name: '1-Up',
    description: '+1 vida',
    cost: 3,
    icon: Heart,
    boostType: 'life_up',
    isAvailable: (player) => player.lives < GAME_LIMITS.MAX_LIVES,
  },
  {
    id: 'full_resistance',
    type: 'boost',
    name: 'Reboot',
    description: 'Resistencia MAX',
    cost: 2,
    icon: Shield,
    boostType: 'full_resistance',
    isAvailable: (player) => player.resistance < player.maxResistance,
  },
  {
    id: 'reveal_start',
    type: 'boost',
    name: 'Scanner-2X',
    description: 'Proxima rodada inicia com 2 pills reveladas',
    cost: 2,
    icon: Scan,
    boostType: 'reveal_start',
  },

  // ============ POWER-UPS (adiciona ao inventario) ============

  {
    id: 'power_scanner',
    type: 'power_up',
    name: 'Scanner',
    description: 'Adiciona Scanner ao inventario',
    cost: 2,
    icon: Eye,
    itemType: 'scanner',
    isAvailable: (player) => player.inventory.items.length < MAX_INVENTORY_ITEMS,
  },
  {
    id: 'power_shield',
    type: 'power_up',
    name: 'Shield',
    description: 'Adiciona Shield ao inventario',
    cost: 2,
    icon: Shield,
    itemType: 'shield',
    isAvailable: (player) => player.inventory.items.length < MAX_INVENTORY_ITEMS,
  },
  {
    id: 'power_pocket_pill',
    type: 'power_up',
    name: 'Pocket Pill',
    description: 'Adiciona Pocket Pill ao inventario',
    cost: 2,
    icon: Syringe,
    itemType: 'pocket_pill',
    isAvailable: (player) => player.inventory.items.length < MAX_INVENTORY_ITEMS,
  },
  {
    id: 'power_discard',
    type: 'power_up',
    name: 'Discard',
    description: 'Adiciona Discard ao inventario',
    cost: 2,
    icon: Bomb,
    itemType: 'discard',
    isAvailable: (player) => player.inventory.items.length < MAX_INVENTORY_ITEMS,
  },
]

/**
 * Configuracao padrao da Pill Store
 */
export const DEFAULT_STORE_CONFIG: StoreConfig = {
  items: STORE_ITEMS,
  powerUpBaseCost: 2,
  shoppingTime: 30000,      // 30 segundos para fazer compras
  reduceMultiplier: 0.5,    // Reduz timer pela metade quando oponente confirma
}

/**
 * Encontra um item da loja pelo ID
 */
export function getStoreItemById(itemId: string): StoreItem | undefined {
  return STORE_ITEMS.find((item) => item.id === itemId)
}

/**
 * Filtra itens disponiveis para um jogador
 */
export function getAvailableStoreItems(player: Parameters<NonNullable<StoreItem['isAvailable']>>[0]): StoreItem[] {
  return STORE_ITEMS.filter((item) => {
    // Se nao tem condicao, sempre disponivel
    if (!item.isAvailable) return true
    return item.isAvailable(player)
  })
}

