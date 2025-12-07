import type { Pill, Player, PlayerEffectResult, PlayerEffectType } from '@/types'

/** Opcoes para aplicacao de efeito de pilula */
interface ApplyPillOptions {
  /** Se o jogador tem Shield ativo (imunidade a dano) */
  hasShield?: boolean
}

/**
 * Aplica o efeito de uma pilula ao jogador
 * Funcao pura que retorna novo estado sem mutar o original
 *
 * Considera modificadores de item:
 * - inverted: dano vira cura, cura vira dano
 * - doubled: dobra o valor do efeito
 * - hasShield: imunidade a dano (cura continua funcionando)
 *
 * @param pill - Pilula consumida
 * @param player - Jogador que consumiu
 * @param options - Opcoes adicionais (shield, etc)
 * @returns Resultado com novo estado do player e flags de evento
 */
export function applyPillEffect(
  pill: Pill,
  player: Player,
  options?: ApplyPillOptions
): PlayerEffectResult {
  const { stats, inverted, doubled } = pill
  const hasShield = options?.hasShield ?? false

  // Calcula valores base considerando modificadores
  let baseDamage = stats.damage
  let baseHeal = stats.heal

  // Se invertido: dano vira cura, cura vira dano
  if (inverted) {
    const temp = baseDamage
    baseDamage = baseHeal
    baseHeal = temp
  }

  // Se dobrado: multiplica por 2
  if (doubled) {
    baseDamage = baseDamage * 2
    baseHeal = baseHeal * 2
  }

  // Shield bloqueia dano
  if (hasShield) {
    baseDamage = 0
  }

  let newResistance = player.resistance
  let damageDealt = 0
  let healReceived = 0

  // Aplica dano se houver
  if (baseDamage > 0) {
    damageDealt = baseDamage
    newResistance = player.resistance - baseDamage
  }

  // Aplica cura se houver (com cap no maximo)
  if (baseHeal > 0) {
    healReceived = Math.min(baseHeal, player.maxResistance - player.resistance)
    newResistance = Math.min(player.resistance + baseHeal, player.maxResistance)
  }

  // Verifica colapso (resistencia <= 0)
  const collapsed = newResistance <= 0

  // Se colapso, processa perda de vida
  let newLives = player.lives
  let finalResistance = newResistance

  if (collapsed) {
    newLives = player.lives - 1
    // Reset da resistencia ao maximo (ou valor penalizado)
    finalResistance = player.maxResistance
  }

  // Verifica eliminacao
  const eliminated = newLives <= 0

  const newPlayer: Player = {
    ...player,
    lives: Math.max(0, newLives),
    resistance: eliminated ? 0 : Math.max(0, finalResistance),
  }

  return {
    player: newPlayer,
    collapsed,
    eliminated,
    damageDealt,
    healReceived,
  }
}

/**
 * Verifica se o jogador esta em estado de colapso (resistencia <= 0)
 */
export function checkCollapse(player: Player): boolean {
  return player.resistance <= 0
}

/**
 * Processa o colapso de um jogador
 * - Reduz 1 vida
 * - Reseta resistencia ao maximo
 *
 * @param player - Jogador em colapso
 * @returns Novo estado do jogador
 */
export function processCollapse(player: Player): Player {
  const newLives = player.lives - 1

  if (newLives <= 0) {
    // Jogador eliminado
    return {
      ...player,
      lives: 0,
      resistance: 0,
    }
  }

  // Reset da resistencia
  return {
    ...player,
    lives: newLives,
    resistance: player.maxResistance,
  }
}

/**
 * Verifica se o jogador foi eliminado (vidas <= 0)
 */
export function checkGameOver(player: Player): boolean {
  return player.lives <= 0
}

/**
 * Aplica dano direto ao jogador (sem pilula)
 * Util para efeitos de itens ou eventos especiais
 */
export function applyDamage(player: Player, amount: number): PlayerEffectResult {
  const newResistance = player.resistance - amount
  const collapsed = newResistance <= 0

  let newLives = player.lives
  let finalResistance = newResistance

  if (collapsed) {
    newLives = player.lives - 1
    finalResistance = newLives > 0 ? player.maxResistance : 0
  }

  const eliminated = newLives <= 0

  return {
    player: {
      ...player,
      lives: Math.max(0, newLives),
      resistance: Math.max(0, finalResistance),
    },
    collapsed,
    eliminated,
    damageDealt: amount,
    healReceived: 0,
  }
}

/**
 * Aplica cura ao jogador (com cap no maximo)
 */
export function applyHeal(player: Player, amount: number): PlayerEffectResult {
  const actualHeal = Math.min(amount, player.maxResistance - player.resistance)
  const newResistance = Math.min(player.resistance + amount, player.maxResistance)

  return {
    player: {
      ...player,
      resistance: newResistance,
    },
    collapsed: false,
    eliminated: false,
    damageDealt: 0,
    healReceived: actualHeal,
  }
}

/**
 * Cria um jogador com configuracao inicial
 */
export function createPlayer(
  id: 'player1' | 'player2',
  name: string,
  lives: number,
  resistance: number,
  isAI: boolean = false
): Player {
  return {
    id,
    name,
    lives,
    maxLives: lives,
    resistance,
    maxResistance: resistance,
    isAI,
    inventory: {
      items: [],
      maxItems: 5,
    },
    effects: [],
  }
}

/**
 * Calcula a porcentagem de resistencia atual
 */
export function getResistancePercentage(player: Player): number {
  if (player.maxResistance === 0) return 0
  return (player.resistance / player.maxResistance) * 100
}

/**
 * Verifica se o jogador pode consumir pilula (esta vivo)
 */
export function canConsumePill(player: Player): boolean {
  return player.lives > 0
}

/**
 * Verifica se o jogador tem um efeito especifico ativo
 */
export function hasPlayerEffect(player: Player, effectType: PlayerEffectType): boolean {
  return player.effects.some((e) => e.type === effectType)
}

