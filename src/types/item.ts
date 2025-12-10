/**
 * Tipos do Sistema de Itens (Power-ups)
 */

/** Categorias de itens */
export type ItemCategory = 'intel' | 'sustain' | 'control' | 'chaos'

/** Tipos de item disponiveis */
export type ItemType =
  | 'scanner'
  | 'inverter'
  | 'double'
  | 'pocket_pill'
  | 'shield'
  | 'handcuffs'
  | 'force_feed'
  | 'shuffle'
  | 'discard'
  | 'shape_bomb'
  | 'shape_scanner'

/** Tipo de alvo que o item requer */
export type ItemTargetType =
  | 'self'            // Efeito no proprio jogador
  | 'pill'            // Seleciona uma pilula
  | 'opponent'        // Efeito no oponente
  | 'pill_to_opponent' // Seleciona pilula para forcar oponente
  | 'table'           // Efeito na mesa (todas as pilulas)
  | 'shape'           // Seleciona uma shape (forma)

// ============================================
// Interfaces
// ============================================

/** Definicao de um item no catalogo */
export interface ItemDefinition {
  /** Tipo unico do item */
  type: ItemType
  /** Categoria do item */
  category: ItemCategory
  /** Nome de exibicao */
  name: string
  /** Descricao do efeito */
  description: string
  /** Tipo de alvo requerido */
  targetType: ItemTargetType
  /** Nome do icone Lucide */
  icon: string
  /** Classe de cor Tailwind */
  color: string
}

/** Item no inventario do jogador */
export interface InventoryItem {
  /** ID unico da instancia do item */
  id: string
  /** Tipo do item */
  type: ItemType
}

/** Inventario do jogador */
export interface PlayerInventory {
  /** Itens no inventario */
  items: InventoryItem[]
  /** Limite maximo de itens */
  maxItems: number
}

/** Estado de selecao de alvo para uso de item */
export interface TargetSelectionState {
  /** Se esta em modo de selecao de alvo */
  active: boolean
  /** ID do item sendo usado */
  itemId: string | null
  /** Tipo do item sendo usado */
  itemType: ItemType | null
  /** Tipos de alvos validos */
  validTargets: 'pills' | 'opponent' | null
}

/** Resultado da aplicacao de um efeito de item */
export interface ItemEffectResult {
  /** Se o efeito foi aplicado com sucesso */
  success: boolean
  /** Mensagem de feedback */
  message: string
  /** Valor numerico do efeito (se aplicavel) */
  value?: number
}

