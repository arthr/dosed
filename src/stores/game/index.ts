/**
 * Game Domain Stores
 *
 * Este modulo ira conter os stores de dominio do jogo:
 * - gameFlowStore   - Fases, turnos, rodadas, winner
 * - pillPoolStore   - Pool de pilulas, consumo, reveal
 * - playerStore     - Vidas, resistencia, maximos
 * - inventoryStore  - Itens, selecao, uso
 * - effectsStore    - Efeitos de jogador (shield, handcuffs)
 * - shopStore       - Pill Store, carrinho, boosts
 *
 * Por enquanto, re-exporta do gameStore legado para retrocompatibilidade.
 *
 * @see ADR-001-store-decomposition.md
 */

// TODO: Fase 2 - Extrair stores individuais e re-exportar aqui
// export * from './gameFlowStore'
// export * from './pillPoolStore'
// export * from './playerStore'
// export * from './inventoryStore'
// export * from './effectsStore'
// export * from './shopStore'

// Retrocompatibilidade: re-exporta do store legado
export * from '../gameStore'

