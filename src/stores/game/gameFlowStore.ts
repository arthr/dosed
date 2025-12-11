import { create } from 'zustand'
import type {
    GamePhase,
    TurnPhase,
    DifficultyLevel,
    PlayerId,
    GameAction,
} from '@/types'
import type { GameMode } from '@/types/multiplayer'
import { getNextTurn, canGameContinue, getWinner } from '@/utils/turnManager'

/**
 * Estado do fluxo de jogo
 * Gerencia fases, turnos, rodadas e estado geral da partida
 *
 * @see ADR-001-store-decomposition.md
 */
interface GameFlowState {
    /** Fase atual do jogo */
    phase: GamePhase
    /** Fase atual do turno */
    turnPhase: TurnPhase
    /** Rodada atual */
    round: number
    /** Jogador com o turno atual */
    currentTurn: PlayerId
    /** Ordem dos jogadores */
    playerOrder: PlayerId[]
    /** Vencedor da partida (null se em andamento) */
    winner: PlayerId | null
    /** Nivel de dificuldade da IA */
    difficulty: DifficultyLevel
    /** Modo de jogo */
    mode: GameMode
    /** ID da sala multiplayer */
    roomId: string | null
    /** Historico de acoes */
    actionHistory: GameAction[]
}

/**
 * Actions do store de fluxo de jogo
 */
interface GameFlowActions {
    /**
     * Inicializa o fluxo de jogo com ordem de jogadores
     * @param playerOrder - Ordem dos jogadores
     * @param config - Configuracoes opcionais
     */
    initialize: (
        playerOrder: PlayerId[],
        config?: {
            difficulty?: DifficultyLevel
            mode?: GameMode
            roomId?: string | null
        }
    ) => void

    /**
     * Define a fase do jogo
     * @param phase - Nova fase
     */
    setPhase: (phase: GamePhase) => void

    /**
     * Define a fase do turno
     * @param turnPhase - Nova fase do turno
     */
    setTurnPhase: (turnPhase: TurnPhase) => void

    /**
     * Inicia o jogo (transiciona para playing)
     */
    startGame: () => void

    /**
     * Inicia fase de selecao de itens
     */
    startItemSelection: () => void

    /**
     * Inicia rodada (incrementa round se > 0)
     * @param startingPlayer - Jogador que inicia a rodada (opcional)
     */
    startRound: (startingPlayer?: PlayerId) => void

    /**
     * Avanca para o proximo turno
     * @param alivePlayers - Jogadores vivos (para pular eliminados)
     * @returns PlayerId do proximo jogador
     */
    nextTurn: (alivePlayers?: PlayerId[]) => PlayerId

    /**
     * Define o jogador atual manualmente
     * @param playerId - ID do jogador
     */
    setCurrentTurn: (playerId: PlayerId) => void

    /**
     * Termina o jogo com um vencedor
     * @param winnerId - ID do vencedor
     */
    endGame: (winnerId: PlayerId) => void

    /**
     * Verifica e define vencedor se apenas 1 jogador restante
     * @param alivePlayers - Jogadores vivos
     * @returns PlayerId do vencedor ou null
     */
    checkWinner: (alivePlayers: PlayerId[]) => PlayerId | null

    /**
     * Inicia fase de fim de rodada (roundEnding)
     */
    startRoundEnding: () => void

    /**
     * Inicia fase de compras (shopping)
     */
    startShopping: () => void

    /**
     * Adiciona acao ao historico
     * @param action - Acao a adicionar
     */
    addAction: (action: GameAction) => void

    /**
     * Obtem historico de acoes
     */
    getActionHistory: () => GameAction[]

    /**
     * Limpa historico de acoes
     */
    clearActionHistory: () => void

    /**
     * Verifica se jogo pode continuar
     * @param alivePlayers - Jogadores vivos
     */
    canContinue: (alivePlayers: PlayerId[]) => boolean

    /**
     * Obtem fase atual
     */
    getPhase: () => GamePhase

    /**
     * Obtem rodada atual
     */
    getRound: () => number

    /**
     * Verifica se esta em fase especifica
     * @param phase - Fase a verificar
     */
    isPhase: (phase: GamePhase) => boolean

    /**
     * Verifica se jogo terminou
     */
    isGameOver: () => boolean

    /**
     * Reseta store para estado inicial
     */
    reset: () => void
}

type GameFlowStore = GameFlowState & GameFlowActions

/**
 * Estado inicial
 */
const initialState: GameFlowState = {
    phase: 'setup',
    turnPhase: 'consume',
    round: 0,
    currentTurn: 'player1',
    playerOrder: [],
    winner: null,
    difficulty: 'normal',
    mode: 'single_player',
    roomId: null,
    actionHistory: [],
}

/**
 * Zustand Store para gerenciamento do fluxo de jogo
 *
 * Responsabilidades:
 * - Fases do jogo (setup, itemSelection, playing, etc)
 * - Turnos e rodadas
 * - Ordem dos jogadores
 * - Vencedor
 * - Historico de acoes
 *
 * NAO gerencia:
 * - Estado dos jogadores (playerStore)
 * - Pool de pilulas (pillPoolStore)
 * - Efeitos (effectsStore)
 * - Loja (shopStore)
 */
export const useGameFlowStore = create<GameFlowStore>((set, get) => ({
    ...initialState,

    initialize: (playerOrder, config) => {
        set({
            phase: 'setup',
            turnPhase: 'consume',
            round: 0,
            currentTurn: playerOrder[0] ?? 'player1',
            playerOrder,
            winner: null,
            difficulty: config?.difficulty ?? 'normal',
            mode: config?.mode ?? 'single_player',
            roomId: config?.roomId ?? null,
            actionHistory: [],
        })
    },

    setPhase: (phase) => {
        set({ phase })
    },

    setTurnPhase: (turnPhase) => {
        set({ turnPhase })
    },

    startGame: () => {
        const state = get()

        const action: GameAction = {
            type: 'GAME_START',
            playerId: state.playerOrder[0] ?? 'player1',
            timestamp: Date.now(),
        }

        set({
            phase: 'playing',
            round: 1,
            turnPhase: 'consume',
            currentTurn: state.playerOrder[0] ?? 'player1',
            actionHistory: [...state.actionHistory, action],
        })
    },

    startItemSelection: () => {
        set({ phase: 'itemSelection' })
    },

    startRound: (startingPlayer) => {
        const state = get()
        const nextRound = state.round + 1

        const action: GameAction = {
            type: 'NEW_ROUND',
            playerId: startingPlayer ?? state.playerOrder[0] ?? 'player1',
            timestamp: Date.now(),
            payload: { round: nextRound },
        }

        set({
            phase: 'playing',
            round: nextRound,
            turnPhase: 'consume',
            currentTurn: startingPlayer ?? state.playerOrder[0] ?? state.currentTurn,
            actionHistory: [...state.actionHistory, action],
        })
    },

    nextTurn: (alivePlayers) => {
        const state = get()

        const nextPlayer = getNextTurn(
            state.currentTurn,
            state.playerOrder,
            alivePlayers
        )

        set({
            currentTurn: nextPlayer,
            turnPhase: 'consume',
        })

        return nextPlayer
    },

    setCurrentTurn: (playerId) => {
        set({ currentTurn: playerId })
    },

    endGame: (winnerId) => {
        const state = get()

        const action: GameAction = {
            type: 'GAME_END',
            playerId: winnerId,
            timestamp: Date.now(),
            payload: { winner: winnerId },
        }

        set({
            phase: 'ended',
            winner: winnerId,
            actionHistory: [...state.actionHistory, action],
        })
    },

    checkWinner: (alivePlayers) => {
        const winner = getWinner(alivePlayers)

        if (winner) {
            get().endGame(winner)
        }

        return winner
    },

    startRoundEnding: () => {
        set({ phase: 'roundEnding' })
    },

    startShopping: () => {
        set({ phase: 'shopping' })
    },

    addAction: (action) => {
        const state = get()
        set({
            actionHistory: [...state.actionHistory, action],
        })
    },

    getActionHistory: () => {
        return get().actionHistory
    },

    clearActionHistory: () => {
        set({ actionHistory: [] })
    },

    canContinue: (alivePlayers) => {
        return canGameContinue(alivePlayers)
    },

    getPhase: () => {
        return get().phase
    },

    getRound: () => {
        return get().round
    },

    isPhase: (phase) => {
        return get().phase === phase
    },

    isGameOver: () => {
        return get().phase === 'ended'
    },

    reset: () => {
        set(initialState)
    },
}))

// ============ HOOKS HELPERS ============

/**
 * Hook para obter fase atual
 */
export const useGamePhase = () =>
    useGameFlowStore((state) => state.phase)

/**
 * Hook para obter fase do turno
 */
export const useTurnPhase = () =>
    useGameFlowStore((state) => state.turnPhase)

/**
 * Hook para obter rodada atual
 */
export const useRound = () =>
    useGameFlowStore((state) => state.round)

/**
 * Hook para obter jogador atual
 */
export const useCurrentTurn = () =>
    useGameFlowStore((state) => state.currentTurn)

/**
 * Hook para obter ordem dos jogadores
 */
export const usePlayerOrder = () =>
    useGameFlowStore((state) => state.playerOrder)

/**
 * Hook para obter vencedor
 */
export const useWinner = () =>
    useGameFlowStore((state) => state.winner)

/**
 * Hook para verificar se jogo terminou
 */
export const useIsGameOver = () =>
    useGameFlowStore((state) => state.phase === 'ended')

/**
 * Hook para obter modo de jogo
 */
export const useGameMode = () =>
    useGameFlowStore((state) => state.mode)

/**
 * Hook para obter dificuldade
 */
export const useDifficulty = () =>
    useGameFlowStore((state) => state.difficulty)

/**
 * Hook para obter roomId
 */
export const useRoomId = () =>
    useGameFlowStore((state) => state.roomId)

