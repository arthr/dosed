import type { Pill, PillType } from '@/types'
import { PillGrid } from './Pill'
import { TypeCounter } from './TypeCounter'

interface PillPoolProps {
  /** Lista de pilulas na mesa */
  pills: Pill[]
  /** Contagem de tipos para exibicao publica */
  typeCounts: Record<PillType, number>
  /** Callback ao selecionar uma pilula */
  onSelectPill: (pillId: string) => void
  /** Se a selecao esta desabilitada (ex: turno da IA) */
  disabled?: boolean
  /** ID da pilula selecionada (para highlight) */
  selectedPillId?: string | null
  /** Mensagem de instrucao */
  instructionMessage?: string
}

/**
 * Mesa de pilulas completa
 * Inclui: Titulo, contador de tipos, grid de pilulas e instrucoes
 */
export function PillPool({
  pills,
  typeCounts,
  onSelectPill,
  disabled = false,
  selectedPillId = null,
  instructionMessage,
}: PillPoolProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-center font-semibold text-foreground">
        Mesa de Pilulas
      </h3>

      {/* Contagem publica de tipos */}
      <TypeCounter counts={typeCounts} />

      {/* Grid de pilulas */}
      <PillGrid
        pills={pills}
        onSelectPill={onSelectPill}
        disabled={disabled}
        selectedPillId={selectedPillId}
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

