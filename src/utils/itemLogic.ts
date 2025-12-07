/**
 * Logica de Efeitos de Itens
 * Funcoes puras para aplicar efeitos de cada tipo de item
 */

import type { ItemEffectResult, ItemType } from '@/types/item'
import type { Pill } from '@/types/pill'
import type { Player } from '@/types/player'

// ============================================
// Funcao Principal
// ============================================

/**
 * Aplica o efeito de um item
 * @param itemType - Tipo do item sendo usado
 * @param user - Jogador que esta usando o item
 * @param target - Alvo do item (pilula, oponente, etc)
 * @returns Resultado da aplicacao do efeito
 */
export function applyItemEffect(
  itemType: ItemType,
  user: Player,
  target?: { pill?: Pill; opponent?: Player }
): ItemEffectResult {
  switch (itemType) {
    // Intel
    case 'scanner':
      return applyScanner(target?.pill)
    case 'inverter':
      return applyInverter(target?.pill)
    case 'double':
      return applyDouble(target?.pill)

    // Sustain
    case 'pocket_pill':
      return applyPocketPill(user)
    case 'shield':
      return applyShield(user)

    // Control
    case 'handcuffs':
      return applyHandcuffs(target?.opponent)
    case 'force_feed':
      return applyForceFeed(target?.pill, target?.opponent)

    // Chaos
    case 'shuffle':
      return applyShuffle()
    case 'discard':
      return applyDiscard(target?.pill)

    default:
      return {
        success: false,
        message: 'Item desconhecido',
      }
  }
}

// ============================================
// Intel Items
// ============================================

/**
 * Scanner: Revela o tipo de uma pilula
 */
function applyScanner(pill?: Pill): ItemEffectResult {
  if (!pill) {
    return { success: false, message: 'Nenhuma pilula selecionada' }
  }

  return {
    success: true,
    message: `Pilula revelada: ${pill.type}`,
  }
}

/**
 * Inverter: Inverte o efeito de uma pilula
 * - Dano vira cura
 * - Cura vira dano
 * - Safe e Fatal nao mudam
 */
function applyInverter(pill?: Pill): ItemEffectResult {
  if (!pill) {
    return { success: false, message: 'Nenhuma pilula selecionada' }
  }

  return {
    success: true,
    message: `Efeito da pilula invertido`,
  }
}

/**
 * Double: Dobra o efeito de uma pilula
 */
function applyDouble(pill?: Pill): ItemEffectResult {
  if (!pill) {
    return { success: false, message: 'Nenhuma pilula selecionada' }
  }

  return {
    success: true,
    message: `Efeito da pilula dobrado`,
  }
}

// ============================================
// Sustain Items
// ============================================

/** Valor de cura do Pocket Pill */
export const POCKET_PILL_HEAL = 2

/**
 * Pocket Pill: Cura resistencia do jogador
 */
function applyPocketPill(user: Player): ItemEffectResult {
  const currentResistance = user.resistance
  const maxResistance = user.maxResistance
  const actualHeal = Math.min(POCKET_PILL_HEAL, maxResistance - currentResistance)

  if (actualHeal <= 0) {
    return {
      success: false,
      message: 'Resistencia ja esta no maximo',
    }
  }

  return {
    success: true,
    message: `+${actualHeal} de resistencia`,
    value: actualHeal,
  }
}

/**
 * Shield: Ativa imunidade por 1 rodada
 */
function applyShield(user: Player): ItemEffectResult {
  // Verifica se ja tem shield ativo
  const hasShield = user.effects.some((e) => e.type === 'shield')
  if (hasShield) {
    return {
      success: false,
      message: 'Shield ja esta ativo',
    }
  }

  return {
    success: true,
    message: 'Shield ativado por 1 rodada',
    value: 1, // 1 rodada de duracao
  }
}

// ============================================
// Control Items
// ============================================

/**
 * Handcuffs: Faz oponente perder proximo turno
 */
function applyHandcuffs(opponent?: Player): ItemEffectResult {
  if (!opponent) {
    return { success: false, message: 'Nenhum oponente selecionado' }
  }

  // Verifica se oponente tem shield
  const hasShield = opponent.effects.some((e) => e.type === 'shield')
  if (hasShield) {
    return {
      success: false,
      message: 'Oponente esta protegido pelo Shield',
    }
  }

  return {
    success: true,
    message: `${opponent.name} perdera o proximo turno`,
  }
}

/**
 * Force Feed: Obriga oponente a consumir pilula escolhida
 */
function applyForceFeed(pill?: Pill, opponent?: Player): ItemEffectResult {
  if (!pill) {
    return { success: false, message: 'Nenhuma pilula selecionada' }
  }
  if (!opponent) {
    return { success: false, message: 'Nenhum oponente selecionado' }
  }

  // Verifica se oponente tem shield
  const hasShield = opponent.effects.some((e) => e.type === 'shield')
  if (hasShield) {
    return {
      success: false,
      message: 'Oponente esta protegido pelo Shield',
    }
  }

  return {
    success: true,
    message: `${opponent.name} foi forcado a consumir a pilula`,
  }
}

// ============================================
// Chaos Items
// ============================================

/**
 * Shuffle: Embaralha as pilulas da mesa
 */
function applyShuffle(): ItemEffectResult {
  return {
    success: true,
    message: 'Pilulas embaralhadas',
  }
}

/**
 * Discard: Remove uma pilula sem ativar efeito
 */
function applyDiscard(pill?: Pill): ItemEffectResult {
  if (!pill) {
    return { success: false, message: 'Nenhuma pilula selecionada' }
  }

  return {
    success: true,
    message: 'Pilula descartada',
  }
}

// ============================================
// Helpers
// ============================================

/**
 * Verifica se jogador tem efeito de shield ativo
 */
export function hasShieldActive(player: Player): boolean {
  return player.effects.some((e) => e.type === 'shield' && e.roundsRemaining > 0)
}

/**
 * Verifica se jogador esta algemado
 */
export function isHandcuffed(player: Player): boolean {
  return player.effects.some((e) => e.type === 'handcuffed' && e.roundsRemaining > 0)
}

/**
 * Calcula efeito invertido de uma pilula
 */
export function getInvertedEffect(originalValue: number): number {
  return -originalValue
}

/**
 * Calcula efeito dobrado de uma pilula
 */
export function getDoubledEffect(originalValue: number): number {
  return originalValue * 2
}

