import type { InventoryItem, ItemType, Pill, Player } from '@/types'
import { ITEM_CATALOG } from './itemCatalog'

/**
 * Logica da IA para selecao de pilulas e uso de itens
 */

// ============================================
// Constantes
// ============================================

/** Chance base da IA usar um item (35%) */
const AI_ITEM_USE_CHANCE = 0.35

/** Prioridade de itens por tipo (maior = mais prioritario) */
const ITEM_PRIORITY: Record<ItemType, number> = {
  shield: 10,
  pocket_pill: 9,
  scanner: 7,
  handcuffs: 6,
  force_feed: 5,
  inverter: 4,
  double: 3,
  discard: 2,
  shuffle: 1,
}

// ============================================
// Selecao de Pilulas
// ============================================

/**
 * Seleciona uma pilula aleatoria do pool disponivel
 * @param pillPool Array de pilulas disponiveis (nao reveladas)
 * @returns ID da pilula selecionada ou null se pool vazio
 */
export function selectRandomPill(pillPool: Pill[]): string | null {
  // Filtra apenas pilulas nao reveladas
  const availablePills = pillPool.filter((pill) => !pill.isRevealed)

  if (availablePills.length === 0) {
    return null
  }

  // Seleciona indice aleatorio
  const randomIndex = Math.floor(Math.random() * availablePills.length)
  return availablePills[randomIndex].id
}

/**
 * Retorna um delay aleatorio para simular "pensamento" da IA
 * @returns Delay em milissegundos (entre 1000ms e 3000ms)
 */
export function getAIThinkingDelay(): number {
  const minDelay = 1000 // 1 segundo
  const maxDelay = 3000 // 3 segundos
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay
}

// ============================================
// Decisao de Uso de Itens
// ============================================

/**
 * Decide se a IA deve usar um item neste turno
 * @param player Jogador IA
 * @returns true se deve usar item
 */
export function shouldAIUseItem(player: Player): boolean {
  // Sem itens, nao pode usar
  if (player.inventory.items.length === 0) {
    return false
  }

  // Rola chance base
  return Math.random() < AI_ITEM_USE_CHANCE
}

/**
 * Seleciona qual item a IA deve usar com base em heuristicas
 * @param player Jogador IA
 * @param pillPool Pool de pilulas na mesa
 * @returns Item selecionado ou null
 */
export function selectAIItem(
  player: Player,
  pillPool: Pill[]
): InventoryItem | null {
  const items = player.inventory.items

  if (items.length === 0) return null

  // Calcula scores para cada item baseado em contexto
  const scoredItems = items.map((item) => ({
    item,
    score: calculateItemScore(item.type, player, pillPool),
  }))

  // Ordena por score (maior primeiro)
  scoredItems.sort((a, b) => b.score - a.score)

  // Retorna item com maior score (se score > 0)
  const best = scoredItems[0]
  return best.score > 0 ? best.item : null
}

/**
 * Calcula score de um item baseado no contexto atual
 */
function calculateItemScore(
  itemType: ItemType,
  player: Player,
  pillPool: Pill[]
): number {
  const basePriority = ITEM_PRIORITY[itemType]
  let contextBonus = 0

  const resistancePercent = player.resistance / player.maxResistance
  const isLowLife = player.lives <= 1
  const isLowResistance = resistancePercent < 0.5
  const hasManyPills = pillPool.length >= 4

  switch (itemType) {
    case 'shield':
      // Shield e muito valioso se vida baixa
      if (isLowLife) contextBonus = 20
      break

    case 'pocket_pill':
      // Pocket Pill e util se resistencia baixa
      if (isLowResistance) contextBonus = 15
      break

    case 'scanner':
      // Scanner e mais util com muitas pilulas
      if (hasManyPills) contextBonus = 10
      break

    case 'handcuffs':
      // Handcuffs sempre e util
      contextBonus = 5
      break

    case 'force_feed':
      // Force Feed e bom se tem poucas pilulas (mais chance de FATAL)
      if (pillPool.length <= 3) contextBonus = 8
      break

    case 'discard':
      // Discard e util para remover pilula suspeita
      contextBonus = 3
      break

    default:
      contextBonus = 0
  }

  return basePriority + contextBonus
}

/**
 * Seleciona alvo automatico para o item da IA
 * @param itemType Tipo do item
 * @param pillPool Pool de pilulas
 * @param opponentId ID do oponente
 * @returns ID do alvo ou undefined se nao precisa de alvo
 */
export function selectAIItemTarget(
  itemType: ItemType,
  pillPool: Pill[],
  opponentId: string
): string | undefined {
  const itemDef = ITEM_CATALOG[itemType]

  switch (itemDef.targetType) {
    case 'self':
    case 'table':
      // Nao precisa de alvo
      return undefined

    case 'opponent':
      // Alvo e o oponente
      return opponentId

    case 'pill':
    case 'pill_to_opponent':
      // Seleciona pilula aleatoria
      return selectRandomPill(pillPool) ?? undefined

    default:
      return undefined
  }
}

/**
 * Verifica se o item requer selecao de alvo
 */
export function itemRequiresTarget(itemType: ItemType): boolean {
  const itemDef = ITEM_CATALOG[itemType]
  return itemDef.targetType !== 'self' && itemDef.targetType !== 'table'
}

