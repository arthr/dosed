import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { ConnectionStatus } from '@/types'
type EventHandler = (event: string, payload: Record<string, unknown>) => void
type StatusHandler = (status: ConnectionStatus) => void

class RealtimeService {
  private channel: RealtimeChannel | null = null
  private currentRoomId: string | null = null
  private eventHandlers: Set<EventHandler> = new Set()
  private statusHandlers: Set<StatusHandler> = new Set()
  private status: ConnectionStatus = isSupabaseConfigured ? 'disconnected' : 'not_configured'

  /**
   * Gera codigo de sala aleatorio (6 caracteres)
   */
  generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sem I, O, 0, 1 para evitar confusao
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * Verifica se o Supabase esta configurado
   */
  isConfigured(): boolean {
    return isSupabaseConfigured
  }

  /**
   * Cria uma nova sala (host)
   */
  async createRoom(): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Supabase not configured. Check .env.local')
    }
    const roomId = this.generateRoomCode()
    await this.joinChannel(roomId)
    return roomId
  }

  /**
   * Entra em uma sala existente (guest)
   */
  async joinRoom(roomId: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Supabase not configured. Check .env.local')
    }
    await this.joinChannel(roomId.toUpperCase())
  }

  /**
   * Conecta ao canal Supabase
   */
  private async joinChannel(roomId: string): Promise<void> {
    const supabase = getSupabase()
    
    // Desconecta de canal anterior se existir
    if (this.channel) {
      await this.leave()
    }

    this.setStatus('connecting')
    this.currentRoomId = roomId

    const channelName = `game:${roomId}`

    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    })

    // Escuta todos os eventos broadcast
    this.channel.on('broadcast', { event: '*' }, ({ event, payload }) => {
      this.notifyEvent(event, payload as Record<string, unknown>)
    })

    // Conecta ao canal
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.setStatus('error')
        reject(new Error('Timeout ao conectar'))
      }, 10000)

      this.channel!.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout)
          this.setStatus('connected')
          resolve()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeout)
          this.setStatus('error')
          reject(new Error(`Falha ao conectar: ${status}`))
        }
      })
    })
  }

  /**
   * Envia evento para a sala
   */
  async send(eventType: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.channel || this.status !== 'connected') {
      throw new Error('Nao conectado a nenhuma sala')
    }

    await this.channel.send({
      type: 'broadcast',
      event: eventType,
      payload: {
        ...payload,
        timestamp: Date.now(),
      },
    })
  }

  /**
   * Sai da sala atual
   */
  async leave(): Promise<void> {
    if (this.channel) {
      const supabase = getSupabase()
      await this.channel.unsubscribe()
      await supabase.removeChannel(this.channel)
      this.channel = null
      this.currentRoomId = null
      this.setStatus('disconnected')
    }
  }

  /**
   * Retorna ID da sala atual
   */
  getRoomId(): string | null {
    return this.currentRoomId
  }

  /**
   * Retorna status atual
   */
  getStatus(): ConnectionStatus {
    return this.status
  }

  /**
   * Registra handler para eventos
   */
  onEvent(handler: EventHandler): () => void {
    this.eventHandlers.add(handler)
    return () => this.eventHandlers.delete(handler)
  }

  /**
   * Registra handler para mudancas de status
   */
  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler)
    // Notifica status atual imediatamente
    handler(this.status)
    return () => this.statusHandlers.delete(handler)
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status
    this.statusHandlers.forEach((handler) => handler(status))
  }

  private notifyEvent(event: string, payload: Record<string, unknown>): void {
    this.eventHandlers.forEach((handler) => handler(event, payload))
  }
}

// Singleton exportado
export const realtimeService = new RealtimeService()