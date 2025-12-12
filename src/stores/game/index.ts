/**
 * Game Domain Stores
 *
 * Este modulo contem os stores de dominio do jogo:
 * - effectsStore    - Efeitos de jogador (shield, handcuffs)
 * - shopStore       - Pill Store, carrinho, boosts
 * - pillPoolStore   - Pool de pilulas, consumo, reveal
 * - itemUsageStore  - Selecao de alvo, confirmacao pre-jogo
 * - playerStore     - Jogadores, vidas, resistencia, inventario
 * - gameFlowStore   - Fases, turnos, rodadas, winner
 *
 * @see ADR-001-store-decomposition.md
 */

// ============ STORES MODULARES ============

export * from './effectsStore'
export * from './shopStore'
export * from './pillPoolStore'
export * from './itemUsageStore'

export * from './playerStore'
export * from './gameFlowStore'

// ============ RETROCOMPATIBILIDADE ============
// Re-exporta do store legado para migracao gradual
// TODO: Fase 5 - Remover apos validacao completa
// NOTE: Evitamos `export *` do store legado aqui porque ele conflita com hooks
// dos stores modulares (ex: useGamePhase/usePlayerOrder/usePillPool) e quebra o build.
