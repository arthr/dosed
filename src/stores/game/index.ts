/**
 * Game Domain Stores
 *
 * Este modulo contem os stores de dominio do jogo:
 * - effectsStore    - Efeitos de jogador (shield, handcuffs) [EXTRAIDO]
 * - shopStore       - Pill Store, carrinho, boosts [EXTRAIDO]
 * - gameFlowStore   - Fases, turnos, rodadas, winner (TODO)
 * - pillPoolStore   - Pool de pilulas, consumo, reveal (TODO)
 * - playerStore     - Vidas, resistencia, maximos (TODO)
 * - inventoryStore  - Itens, selecao, uso (TODO)
 *
 * @see ADR-001-store-decomposition.md
 */

// Stores extraidos
export * from './effectsStore'
export * from './shopStore'

// TODO: Fase 2 - Extrair stores restantes
// export * from './gameFlowStore'
// export * from './pillPoolStore'
// export * from './playerStore'
// export * from './inventoryStore'

// Retrocompatibilidade: re-exporta do store legado
export * from '../gameStore'

