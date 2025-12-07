import type { Pill, PillType } from '@/types'
import { PillGrid } from './Pill'
import { TypeCounter } from './TypeCounter'

interface PillPoolProps {
  /** Lista de pilulas na mesa */
  pills: Pill[]
  /** Contagem de tipos para exibicao publica */
  typeCounts: Record<PillType, number>
  /** Numero da rodada */
  round?: number
  /** Callback ao selecionar uma pilula */
  onSelectPill: (pillId: string) => void
  /** Se a selecao esta desabilitada (ex: turno da IA) */
  disabled?: boolean
  /** ID da pilula selecionada (para highlight) */
  selectedPillId?: string | null
  /** Mensagem de instrucao */
  instructionMessage?: string
  /** Se esta em modo de selecao de alvo (item sendo usado) */
  isTargetSelectionMode?: boolean
  /** IDs de pilulas reveladas temporariamente (Scanner) */
  scannedPillIds?: string[]
}

/**
 * Mesa de pilulas completa
 * Inclui: Titulo, contador de tipos, grid de pilulas e instrucoes
 */
export function PillPool({
  pills,
  typeCounts,
  round,
  onSelectPill,
  disabled = false,
  selectedPillId = null,
  instructionMessage,
  isTargetSelectionMode = false,
  scannedPillIds = [],
}: PillPoolProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-center text-foreground text-xs">
        Mesa de Pílulas
      </h3>

      {/* Contagem publica de tipos */}
      <TypeCounter counts={typeCounts} />

      {/* Grid de pilulas */}
      <PillGrid
        key={round?.toString() || 'empty'}
        pills={pills}
        onSelectPill={onSelectPill}
        disabled={disabled}
        selectedPillId={selectedPillId}
        isTargetSelectionMode={isTargetSelectionMode}
        scannedPillIds={scannedPillIds}
      />

      {/* Instrucao */}
      {instructionMessage && (
        <p className="text-center text-xs text-muted-foreground">
          {instructionMessage}
        </p>
      )}
    </div>
  )
}

