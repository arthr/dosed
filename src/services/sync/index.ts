/**
 * Sync Services
 *
 * Servicos relacionados a sincronizacao de estado multiplayer:
 * - syncService    - Orquestra sincronizacao (mediator pattern)
 * - eventEmitter   - Emissao de eventos com tipagem forte
 * - eventHandler   - Recepcao e aplicacao de eventos remotos
 *
 * @see ADR-001-store-decomposition.md
 */

// TODO: Fase 3 - Implementar servicos de sincronizacao
// export * from './syncService'
// export * from './eventEmitter'
// export * from './eventHandler'

// Placeholder exports para documentacao de API futura
export interface SyncServiceAPI {
  /**
   * Executa acao localmente e emite evento se em multiplayer
   * @param action - Funcao que executa a acao no store
   * @param eventType - Tipo do evento a emitir
   * @param payload - Dados do evento
   */
  execute<T>(
    action: () => T,
    eventType: string,
    payload?: Record<string, unknown>
  ): T

  /**
   * Aplica evento remoto nos stores apropriados
   * @param event - Evento recebido do outro jogador
   */
  applyRemote(event: unknown): void

  /**
   * Verifica se esta em modo multiplayer
   */
  isMultiplayer(): boolean
}

export interface EventEmitterAPI {
  /**
   * Emite evento para o outro jogador
   * @param type - Tipo do evento
   * @param payload - Dados do evento
   */
  emit(type: string, payload?: Record<string, unknown>): void
}

export interface EventHandlerAPI {
  /**
   * Registra handler para tipo de evento
   * @param type - Tipo do evento
   * @param handler - Funcao handler
   */
  on(type: string, handler: (payload: unknown) => void): () => void

  /**
   * Remove todos os handlers
   */
  clear(): void
}

