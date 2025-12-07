import type { Player } from '@/types'

interface TurnIndicatorProps {
  /** Jogador do turno atual */
  currentPlayer: Player
  /** Numero da rodada */
  round: number
  /** Se o turno e do jogador humano (para mensagem contextual) */
  isHumanTurn?: boolean
}

/**
 * Indicador de turno e rodada
 * Exibe de quem e o turno atual e instrucoes contextuais
 */
export function TurnIndicator({
  currentPlayer,
  round,
  isHumanTurn = true,
}: TurnIndicatorProps) {
  return (
    <div className="text-center space-y-1">
      <span className="text-sm text-muted-foreground">
        Rodada {round}
      </span>
      <h3 className="text-lg font-semibold text-foreground">
        Turno de {currentPlayer.name}
      </h3>
      {!isHumanTurn && currentPlayer.isAI && (
        <p className="text-xs text-muted-foreground animate-pulse">
          A IA esta pensando...
        </p>
      )}
    </div>
  )
}

