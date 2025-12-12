import { create } from 'zustand'

/**
 * Tipos de abas disponíveis no DevTool
 */
export type DevToolTab = 'game' | 'multiplayer' | 'stores' | 'actions' | 'logs'

/**
 * Tipos de logs
 */
export type DevToolLogType = 'game' | 'multiplayer' | 'store' | 'error' | 'info'

/**
 * Estrutura de um log
 */
export interface DevToolLog {
  id: string
  type: DevToolLogType
  message: string
  timestamp: number
  data?: unknown
}

/**
 * Posição do DevTool na tela
 */
export interface DevToolPosition {
  x: number
  y: number
}

/**
 * Estado do DevTool
 */
interface DevToolState {
  /** Se o DevTool está visível */
  isOpen: boolean
  /** Se o DevTool está minimizado */
  isMinimized: boolean
  /** Aba ativa atual */
  activeTab: DevToolTab
  /** Logs acumulados */
  logs: DevToolLog[]
  /** Posição na tela */
  position: DevToolPosition
}

/**
 * Actions do DevTool
 */
interface DevToolActions {
  /** Alterna visibilidade do DevTool */
  toggle: () => void
  /** Abre o DevTool */
  open: () => void
  /** Fecha o DevTool */
  close: () => void
  /** Alterna estado minimizado */
  toggleMinimize: () => void
  /** Define a aba ativa */
  setActiveTab: (tab: DevToolTab) => void
  /** Adiciona um log */
  addLog: (type: DevToolLogType, message: string, data?: unknown) => void
  /** Limpa todos os logs */
  clearLogs: () => void
  /** Atualiza posição do DevTool */
  setPosition: (position: DevToolPosition) => void
  /** Reseta posição para padrão */
  resetPosition: () => void
}

/**
 * Store do DevTool
 */
export type DevToolStore = DevToolState & DevToolActions

/**
 * Posição padrão (canto inferior direito)
 */
const DEFAULT_POSITION: DevToolPosition = {
  x: window.innerWidth - 420,
  y: window.innerHeight - 520,
}

/**
 * Estado inicial
 */
const initialState: DevToolState = {
  isOpen: false,
  isMinimized: false,
  activeTab: 'game',
  logs: [],
  position: DEFAULT_POSITION,
}

/**
 * Hook do DevTool Store
 * Gerencia estado e logs da ferramenta de desenvolvimento
 */
export const useDevToolStore = create<DevToolStore>((set) => ({
  ...initialState,

  toggle: () => {
    set((state) => ({ isOpen: !state.isOpen }))
  },

  open: () => {
    set({ isOpen: true, isMinimized: false })
  },

  close: () => {
    set({ isOpen: false })
  },

  toggleMinimize: () => {
    set((state) => ({ isMinimized: !state.isMinimized }))
  },

  setActiveTab: (tab: DevToolTab) => {
    set({ activeTab: tab })
  },

  addLog: (type: DevToolLogType, message: string, data?: unknown) => {
    const log: DevToolLog = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: Date.now(),
      data,
    }

    set((state) => ({
      logs: [...state.logs.slice(-99), log], // Mantém últimos 100 logs
    }))
  },

  clearLogs: () => {
    set({ logs: [] })
  },

  setPosition: (position: DevToolPosition) => {
    set({ position })
  },

  resetPosition: () => {
    set({ position: DEFAULT_POSITION })
  },
}))

