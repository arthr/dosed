/**
 * Catalogo de Itens do Jogo
 * Define todos os itens disponiveis e suas propriedades
 */

import type { ItemCategory, ItemDefinition, ItemType } from '@/types/item'

// ============================================
// Cores por Categoria
// ============================================

export const CATEGORY_COLORS: Record<ItemCategory, string> = {
  intel: 'blue-400',
  sustain: 'emerald-400',
  control: 'yellow-400',
  chaos: 'purple-400',
}

export const CATEGORY_TEXT_COLORS: Record<ItemCategory, string> = {
  intel: 'text-blue-400',
  sustain: 'text-emerald-400',
  control: 'text-yellow-400',
  chaos: 'text-purple-400',
}

export const CATEGORY_BG_COLORS: Record<ItemCategory, string> = {
  intel: 'bg-blue-500/20',
  sustain: 'bg-emerald-500/20',
  control: 'bg-yellow-500/20',
  chaos: 'bg-purple-500/20',
}

export const CATEGORY_HEX_COLORS: Record<ItemCategory, string> = {
  intel: '#60a5fa',     // blue-400
  sustain: '#34d399',   // emerald-400
  control: '#facc15',   // yellow-400
  chaos: '#c084fc',     // purple-400
}

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  intel: 'Intel',
  sustain: 'Sustain',
  control: 'Control',
  chaos: 'Chaos',
}

// ============================================
// Catalogo Completo de Itens
// ============================================

export const ITEM_CATALOG: Record<ItemType, ItemDefinition> = {
  // === INTEL (Informacao) ===
  scanner: {
    type: 'scanner',
    category: 'intel',
    name: 'Scanner',
    description: 'Revela o tipo de 1 pilula',
    targetType: 'pill',
    icon: 'Search',
    color: 'text-blue-400',
  },
  inverter: {
    type: 'inverter',
    category: 'intel',
    name: 'Inverter',
    description: 'Inverte o efeito de 1 pilula',
    targetType: 'pill',
    icon: 'RefreshCw',
    color: 'text-blue-400',
  },
  double: {
    type: 'double',
    category: 'intel',
    name: 'Double',
    description: 'Dobra o efeito de 1 pilula',
    targetType: 'pill',
    icon: 'CopyPlus',
    color: 'text-blue-400',
  },

  // === SUSTAIN (Sobrevivencia) ===
  pocket_pill: {
    type: 'pocket_pill',
    category: 'sustain',
    name: 'Pocket Pill',
    description: 'Cura +2 de resistencia',
    targetType: 'self',
    icon: 'Pill',
    color: 'text-emerald-400',
  },
  shield: {
    type: 'shield',
    category: 'sustain',
    name: 'Shield',
    description: 'Imunidade a efeitos por 1 rodada',
    targetType: 'self',
    icon: 'Shield',
    color: 'text-emerald-400',
  },

  // === CONTROL (Controle) ===
  handcuffs: {
    type: 'handcuffs',
    category: 'control',
    name: 'Handcuff',
    description: 'Oponente perde o proximo turno',
    targetType: 'opponent',
    icon: 'Lock',
    color: 'text-yellow-400',
  },
  force_feed: {
    type: 'force_feed',
    category: 'control',
    name: 'Force Feed',
    description: 'Obriga oponente a comer pilula escolhida',
    targetType: 'pill_to_opponent',
    icon: 'Utensils',
    color: 'text-yellow-400',
  },

  // === CHAOS (Manipulacao) ===
  shuffle: {
    type: 'shuffle',
    category: 'chaos',
    name: 'Shuffle',
    description: 'Embaralha as pilulas da mesa',
    targetType: 'table',
    icon: 'Shuffle',
    color: 'text-purple-400',
  },
  discard: {
    type: 'discard',
    category: 'chaos',
    name: 'Discard',
    description: 'Remove 1 pilula sem ativar efeito',
    targetType: 'pill',
    icon: 'Trash2',
    color: 'text-purple-400',
  },
}

// ============================================
// Agrupamento por Categoria
// ============================================

export const ITEMS_BY_CATEGORY: Record<ItemCategory, ItemType[]> = {
  intel: ['scanner', 'inverter', 'double'],
  sustain: ['pocket_pill', 'shield'],
  control: ['handcuffs', 'force_feed'],
  chaos: ['shuffle', 'discard'],
}

// ============================================
// Helpers
// ============================================

/** Retorna a definicao de um item pelo tipo */
export function getItemDefinition(type: ItemType): ItemDefinition {
  return ITEM_CATALOG[type]
}

/** Retorna todos os itens de uma categoria */
export function getItemsByCategory(category: ItemCategory): ItemDefinition[] {
  return ITEMS_BY_CATEGORY[category].map((type) => ITEM_CATALOG[type])
}

/** Retorna todas as categorias disponiveis */
export function getAllCategories(): ItemCategory[] {
  return ['intel', 'sustain', 'control', 'chaos']
}

/** Retorna todos os tipos de item */
export function getAllItemTypes(): ItemType[] {
  return Object.keys(ITEM_CATALOG) as ItemType[]
}

