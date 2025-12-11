/**
 * Multiplayer Domain Stores
 *
 * Este modulo ira conter os stores de dominio multiplayer:
 * - connectionStore - Status WebSocket, reconnect
 * - roomStore       - Estado da sala, jogadores
 * - syncStore       - Fila de eventos, reconciliacao
 *
 * Por enquanto, re-exporta do multiplayerStore legado para retrocompatibilidade.
 *
 * @see ADR-001-store-decomposition.md
 */

// TODO: Fase 3 - Extrair stores individuais e re-exportar aqui
// export * from './connectionStore'
// export * from './roomStore'
// export * from './syncStore'

// Retrocompatibilidade: re-exporta do store legado
export * from '../multiplayerStore'

