import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/8bit/card'
import { Button } from '@/components/ui/8bit/button'
import {
  type ShapeProgressionConfig,
  type ShapeRule,
  getShapeChances,
  distributeShapes,
  SHAPE_PROGRESSION,
  ALL_SHAPES,
} from '@/utils/shapeProgression'
import type { PillShape } from '@/types'
import { SHAPE_LABELS } from '@/utils/constants'
import { Separator } from '../ui/8bit/separator'
import { ScrollArea } from '../ui/8bit/scroll-area'
import { ShapeIcon } from '../game/ShapeIcon'

// ============================================
// Sub-componentes
// ============================================

/**
 * Slider customizado com label inline
 */
interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  unit?: string
  width?: string
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
  width = 'w-full',
}: SliderProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-muted-foreground w-16 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${width} h-2 bg-muted appearance-none cursor-pointer accent-primary`}
      />
      <span className="text-sm font-mono font-normal text-foreground w-10 text-right">
        {value}
        {unit}
      </span>
    </div>
  )
}

/**
 * Card de controle para uma shape
 */
interface ShapeControlsProps {
  shape: PillShape
  rule: ShapeRule
  onChange: (rule: ShapeRule) => void
}

function ShapeControls({ shape, rule, onChange }: ShapeControlsProps) {
  const label = SHAPE_LABELS[shape]

  return (
    <div className="p-3 border-2 border-border bg-background/50 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShapeIcon shape={shape} size="sm" />
        <span className="text-xs font-normal truncate">{label}</span>
      </div>

      {/* Controls */}
      <div className="space-y-1">
        <Slider
          label="Unlock"
          value={rule.unlockRound}
          min={1}
          max={15}
          onChange={(v) => onChange({ ...rule, unlockRound: v })}
          width="w-full"
        />
        <Slider
          label="Start"
          value={rule.startPct}
          min={0}
          max={60}
          onChange={(v) => onChange({ ...rule, startPct: v })}
          unit="%"
          width="w-full"
        />
        <Slider
          label="End"
          value={rule.endPct}
          min={0}
          max={20}
          onChange={(v) => onChange({ ...rule, endPct: v })}
          unit="%"
          width="w-full"
        />
      </div>
    </div>
  )
}

/**
 * Visualizacao compacta de uma rodada
 */
interface RoundCardProps {
  round: number
  config: ShapeProgressionConfig
  pillCount: number
  isHighlighted?: boolean
}

function RoundCard({ round, config, pillCount, isHighlighted }: RoundCardProps) {
  const distribution = distributeShapes(pillCount, round, config)

  // Filtra apenas shapes com quantidade > 0
  const activeShapes = ALL_SHAPES.filter((s) => distribution[s] > 0)

  return (
    <div
      className={`h-full p-3 border-2 transition-colors ${isHighlighted
        ? 'border-primary bg-primary/10'
        : 'border-border bg-background/30 hover:border-muted-foreground'
        }`}
    >
      {/* Header */}
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs font-normal">R{round}</span>
        <span className="text-[9px] tracking-tighter text-muted-foreground font-mono">
          {activeShapes.length} shapes
        </span>
      </div>

      {/* Grid de shapes */}
      <div className="flex flex-wrap gap-1 mb-2">
        {activeShapes.slice(0, 8).map((shape) => (
          <div key={shape} className="relative" title={`${SHAPE_LABELS[shape]}: ${distribution[shape]}`}>
            <ShapeIcon shape={shape} size="sm" />
            <span className="absolute -bottom-1 -right-1 text-[8px] font-mono bg-background/80 px-0.5 rounded">
              {distribution[shape]}
            </span>
          </div>
        ))}
        {activeShapes.length > 8 && (
          <span className="text-[9px] text-muted-foreground">+{activeShapes.length - 8}</span>
        )}
      </div>

      {/* Total */}
      <div className="text-[9px] text-muted-foreground">
        Total: {Object.values(distribution).reduce((a, b) => a + b, 0)}
      </div>
    </div>
  )
}

/**
 * Tabela detalhada de uma rodada
 */
interface RoundDetailProps {
  round: number
  config: ShapeProgressionConfig
  pillCount: number
}

function RoundDetail({ round, config, pillCount }: RoundDetailProps) {
  const chances = getShapeChances(round, config)
  const distribution = distributeShapes(pillCount, round, config)

  // Ordena por quantidade (decrescente)
  const sortedShapes = [...ALL_SHAPES].sort((a, b) => distribution[b] - distribution[a])
  const activeShapes = sortedShapes.filter((s) => distribution[s] > 0)
  const lockedShapes = sortedShapes.filter((s) => distribution[s] === 0)

  return (
    <div className="p-4 border-2 border-primary bg-primary/5 min-w-[280px]">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <span className="text-md font-normal">Round {round}</span>
        <span className="text-md text-muted-foreground font-mono">
          {activeShapes.length}/{ALL_SHAPES.length} shapes
        </span>
      </div>

      {/* Grid visual de shapes */}
      <div className="flex flex-wrap gap-2 mb-4 p-2 bg-background/30 border border-border">
        {activeShapes.map((shape) => (
          <div key={shape} className="relative" title={SHAPE_LABELS[shape]}>
            <ShapeIcon shape={shape} size="md" />
            <span className="absolute -bottom-1 -right-1 text-[10px] font-mono font-bold bg-primary text-primary-foreground px-1 rounded">
              {distribution[shape]}
            </span>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <ScrollArea className="h-[200px]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1 font-normal">Shape</th>
              <th className="text-right py-1 font-normal">Unlock</th>
              <th className="text-right py-1 font-normal">Chance</th>
              <th className="text-right py-1 font-normal">Qtd</th>
            </tr>
          </thead>
          <tbody>
            {activeShapes.map((shape) => {
              const rule = config.rules[shape]
              const chance = chances[shape]
              const qty = distribution[shape]

              return (
                <tr key={shape} className="border-b border-border/50">
                  <td className="py-1">
                    <div className="flex items-center gap-2">
                      <ShapeIcon shape={shape} size="sm" />
                      <span className="font-normal text-[10px]">{SHAPE_LABELS[shape]}</span>
                    </div>
                  </td>
                  <td className="text-right py-1 font-mono font-normal">R{rule.unlockRound}</td>
                  <td className="text-right py-1 font-mono font-normal">{chance.toFixed(1)}%</td>
                  <td className="text-right py-1 font-mono font-normal text-sm">{qty}</td>
                </tr>
              )
            })}
            {lockedShapes.length > 0 && (
              <>
                <tr>
                  <td colSpan={4} className="py-2 text-[9px] text-muted-foreground uppercase">
                    Bloqueadas
                  </td>
                </tr>
                {lockedShapes.map((shape) => {
                  const rule = config.rules[shape]
                  return (
                    <tr key={shape} className="border-b border-border/30 opacity-40">
                      <td className="py-1">
                        <div className="flex items-center gap-2">
                          <ShapeIcon shape={shape} size="sm" />
                          <span className="font-normal text-[10px]">{SHAPE_LABELS[shape]}</span>
                        </div>
                      </td>
                      <td className="text-right py-1 font-mono font-normal">R{rule.unlockRound}</td>
                      <td className="text-right py-1 font-mono font-normal">-</td>
                      <td className="text-right py-1 font-mono font-normal">-</td>
                    </tr>
                  )
                })}
              </>
            )}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  )
}

// ============================================
// Componente Principal
// ============================================

export function ShapeDistributionSimulator() {
  // Estado da configuracao
  const [config, setConfig] = useState<ShapeProgressionConfig>(() => ({
    maxRound: SHAPE_PROGRESSION.maxRound,
    rules: { ...SHAPE_PROGRESSION.rules },
  }))

  const [pillCount, setPillCount] = useState<number>(6)
  const [selectedRound, setSelectedRound] = useState<number>(5)

  // Handlers
  const updateRule = (shape: PillShape, rule: ShapeRule) => {
    setConfig((prev) => ({
      ...prev,
      rules: { ...prev.rules, [shape]: rule },
    }))
  }

  const resetToDefault = () => {
    setConfig({
      maxRound: SHAPE_PROGRESSION.maxRound,
      rules: { ...SHAPE_PROGRESSION.rules },
    })
  }

  // Codigo gerado
  const generatedCode = useMemo(() => {
    const rulesStr = ALL_SHAPES
      .map((shape) => {
        const r = config.rules[shape]
        return `    ${shape.padEnd(10)}: { unlockRound: ${String(r.unlockRound).padStart(2)}, startPct: ${String(r.startPct).padStart(2)}, endPct: ${String(r.endPct).padStart(2)} },`
      })
      .join('\n')

    return `export const SHAPE_PROGRESSION: ShapeProgressionConfig = {
  maxRound: ${config.maxRound},
  rules: {
${rulesStr}
  },
}`
  }, [config])

  const rounds = Array.from({ length: 15 }, (_, i) => i + 1)

  return (
    <Card className="p-6">
      <div>
        <h2 className="text-2xl font-normal mb-2">Simulador de Shapes</h2>
        <p className="text-muted-foreground">
          Ajuste os parametros e veja em tempo real como as shapes serao distribuidas por rodada.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Controles Globais */}
        <div className="space-y-4 col-span-1">
          {/* Config geral */}
          <div>
            <h3 className="text-sm font-normal uppercase text-muted-foreground mb-3 tracking-wider">
              Configuracao
            </h3>
            <div className="p-4 border-2 border-border bg-background/50 space-y-3">
              <Slider
                label="Max Rnd"
                value={config.maxRound}
                min={5}
                max={30}
                onChange={(v) => setConfig((p) => ({ ...p, maxRound: v }))}
              />
              <Slider
                label="Pills"
                value={pillCount}
                min={4}
                max={12}
                onChange={setPillCount}
              />
            </div>
          </div>

          {/* Acoes */}
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={resetToDefault} className="w-full">
              Reset Padrao
            </Button>
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(generatedCode)}
              className="w-full"
            >
              Copiar Codigo
            </Button>
          </div>

          {/* Codigo */}
          <div>
            <h3 className="text-sm font-normal uppercase text-muted-foreground mb-3 tracking-wider">
              Codigo Gerado
            </h3>
            <ScrollArea className="h-48 border-2 border-border bg-black/50" scrollbars="both">
              <pre className="p-2 text-[7px] font-mono text-green-400 whitespace-pre">
                {generatedCode}
              </pre>
            </ScrollArea>
          </div>
        </div>

        {/* Controles por Shape */}
        <div className="space-y-4 col-span-3">
          <h3 className="text-sm font-normal uppercase text-muted-foreground mb-3 tracking-wider">
            Shapes (16)
          </h3>
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-4 gap-2 pr-4">
              {ALL_SHAPES.map((shape) => (
                <ShapeControls
                  key={shape}
                  shape={shape}
                  rule={config.rules[shape]}
                  onChange={(rule) => updateRule(shape, rule)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Detalhe da rodada */}
        <div className="col-span-1">
          <h3 className="text-sm font-normal uppercase text-muted-foreground mb-3 tracking-wider">
            Detalhe Round {selectedRound}
          </h3>
          <RoundDetail round={selectedRound} config={config} pillCount={pillCount} />
        </div>
      </div>

      <Separator />

      {/* Visualizacao */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-sm font-normal uppercase text-muted-foreground tracking-wider">
          Visualizacao por Rodada
        </h3>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground">Rnd:</span>
          <input
            type="text"
            value={selectedRound}
            readOnly
            className="w-14 py-1 bg-background border-2 border-border text-center font-mono"
          />
        </div>
      </div>

      {/* Grid de rodadas */}
      <div className="grid grid-cols-5 gap-2">
        {rounds.map((round) => (
          <button
            key={round}
            onClick={() => setSelectedRound(round)}
            className="text-left"
          >
            <RoundCard
              round={round}
              config={config}
              pillCount={pillCount}
              isHighlighted={round === selectedRound}
            />
          </button>
        ))}
      </div>
    </Card>
  )
}

