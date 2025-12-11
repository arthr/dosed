import type { PlayerId } from './player'

/**
 * Modos de jogo suportados
 */
export type GameMode = 'single_player' | 'multiplayer'

/**
 * Status de uma sala multiplayer
 */
export type RoomStatus = 'waiting' | 'ready' | 'playing' | 'finished' | 'abandoned'

/**
 * Papel do jogador local na sala
 */
export type LocalRole = 'host' | 'guest'

/**
 * Status de conexao do jogador
 */
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'
  | 'not_configured'

/**
 * Estado de uma sala multiplayer
 */
export interface Room {
  /** ID unico da sala (6 caracteres alfanumericos) */
  id: string
  /** Timestamp de criacao */
  createdAt: number
  /** Status atual da sala */
  status: RoomStatus
  /** ID do host (quem criou) */
  hostId: string
  /** Nome do host */
  hostName: string
  /** ID do guest (quem entrou) - null se aguardando */
  guestId: string | null
  /** Nome do guest */
  guestName: string | null
}

/**
 * Status do rematch (jogar novamente)
 */
export type RematchStatus = 'idle' | 'waiting' | 'accepted' | 'declined'

/**
 * Estado de rematch apos fim de partida
 */
export interface RematchState {
  /** Status atual do rematch */
  status: RematchStatus
  /** ID do jogador que solicitou rematch primeiro */
  requestedBy: PlayerId | null
  /** Timestamp de expiracao do timeout (30s) */
  timeoutAt: number | null
}

/**
 * Contexto multiplayer local
 */
export interface MultiplayerContext {
  /** Modo de jogo atual */
  mode: GameMode
  /** Sala atual (null se single player ou nao conectado) */
  room: Room | null
  /** Papel do jogador local */
  localRole: LocalRole | null
  /** PlayerId do jogador local (player1 se host, player2 se guest) */
  localPlayerId: PlayerId | null
  /** Status da conexao WebSocket */
  connectionStatus: ConnectionStatus
  /** Erro atual (se houver) */
  error: string | null
}

