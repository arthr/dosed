/**
 * Realtime Services
 *
 * Servicos relacionados a comunicacao em tempo real:
 * - realtimeService   - Conexao WebSocket via Supabase
 * - heartbeatService  - Sistema de heartbeat para detectar desconexao
 * - eventQueue        - Fila de eventos para cenarios offline
 *
 * @see ADR-001-store-decomposition.md
 */

// TODO: Fase 4 - Extrair heartbeatService e eventQueue
// export * from './heartbeatService'
// export * from './eventQueue'

// Retrocompatibilidade: re-exporta do servico legado
export * from '../realtimeService'

