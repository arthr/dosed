import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/8bit/card'
import { Button } from '@/components/ui/8bit/button'
import pillIcon from '@/assets/pill.svg'
import {
    type ProgressionConfig,
    type PoolScalingConfig,
    type PillRule,
    getPillChances,
    distributePillTypes,
    getPillCount,
    PROGRESSION,
    POOL_SCALING,
} from '@/utils/pillProgression'
import type { PillType } from '@/types'
import { PILL_HEX_COLORS, PILL_LABELS } from '@/utils/constants'
import { Separator } from '../ui/8bit/separator'
import { ScrollArea } from '../ui/8bit/scroll-area'

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
 * Card de controle para um tipo de pilula
 */
interface PillTypeControlsProps {
    type: PillType
    rule: PillRule
    onChange: (rule: PillRule) => void
}

function PillTypeControls({ type, rule, onChange }: PillTypeControlsProps) {
    const color = PILL_HEX_COLORS[type]
    const label = PILL_LABELS[type]

    return (
        <div className="p-4 border-2 border-border bg-background/50 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
                <div
                    className="w-5 h-5 border border-foreground/30"
                    style={{ backgroundColor: color }}
                />
                <span className="text-sm font-normal">{label}</span>
                <span className="text-xs text-muted-foreground font-mono">({type})</span>
            </div>

            {/* Controls */}
            <div className="space-y-2">
                <Slider
                    label="Unlock"
                    value={rule.unlockRound}
                    min={1}
                    max={20}
                    onChange={(v) => onChange({ ...rule, unlockRound: v })}
                    width="w-full"
                />
                <Slider
                    label="Start"
                    value={rule.startPct}
                    min={0}
                    max={50}
                    onChange={(v) => onChange({ ...rule, startPct: v })}
                    unit="%"
                    width="w-full"
                />
                <Slider
                    label="End"
                    value={rule.endPct}
                    min={0}
                    max={50}
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
    config: ProgressionConfig
    poolConfig: PoolScalingConfig
    isHighlighted?: boolean
}

function RoundCard({ round, config, poolConfig, isHighlighted }: RoundCardProps) {
    const count = getPillCount(round, poolConfig)
    const distribution = distributePillTypes(count, round, config)

    const pillTypes: PillType[] = ['SAFE', 'DMG_LOW', 'DMG_HIGH', 'HEAL', 'FATAL', 'LIFE']

    // Filtra apenas tipos com quantidade > 0
    const activeTypes = pillTypes.filter((t) => distribution[t] > 0)

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
                <span className="text-[9px] tracking-tighter text-muted-foreground font-mono flex items-center gap-1">
                    <img src={pillIcon} alt="pills" className="w-3 h-3" />
                    {count}
                </span>
            </div>

            {/* Barra visual */}
            <div className="flex h-8 mb-3 border border-foreground/20 overflow-hidden">
                {pillTypes.map((type) => {
                    const qty = distribution[type]
                    if (qty === 0) return null
                    const pct = (qty / count) * 100
                    return (
                        <div
                            key={type}
                            className="flex items-center justify-center text-sm font-normal text-white border-r border-background/30 last:border-r-0"
                            style={{
                                backgroundColor: PILL_HEX_COLORS[type],
                                width: `${pct}%`,
                                minWidth: '24px',
                                textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                            }}
                            title={`${PILL_LABELS[type]}: ${qty}`}
                        >
                            {qty}
                        </div>
                    )
                })}
            </div>

            {/* Legenda compacta */}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
                {activeTypes.map((type) => (
                    <div key={type} className="flex items-center gap-1">
                        <div
                            className="w-3 h-3 border border-foreground/30"
                            style={{ backgroundColor: PILL_HEX_COLORS[type] }}
                        />
                        <span className="text-xs font-mono">
                            {distribution[type]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

/**
 * Tabela detalhada de uma rodada
 */
interface RoundDetailProps {
    round: number
    config: ProgressionConfig
    poolConfig: PoolScalingConfig
}

function RoundDetail({ round, config, poolConfig }: RoundDetailProps) {
    const count = getPillCount(round, poolConfig)
    const chances = getPillChances(round, config)
    const distribution = distributePillTypes(count, round, config)

    const pillTypes: PillType[] = ['SAFE', 'DMG_LOW', 'DMG_HIGH', 'HEAL', 'FATAL', 'LIFE']

    return (
        <div className="p-4 border-2 border-primary bg-primary/5">
            <div className="flex items-baseline justify-between gap-3 mb-3">
                <span className="text-md font-normal">Round {round}</span>
                <span className="text-md text-muted-foreground font-mono flex items-center gap-1">
                    <img src={pillIcon} alt="pills" className="size-4" />
                    {count}
                </span>
            </div>

            {/* Barra grande */}
            <div className="flex h-10 mb-3 border-2 border-foreground/30 overflow-hidden">
                {pillTypes.map((type) => {
                    const qty = distribution[type]
                    if (qty === 0) return null
                    const pct = (qty / count) * 100
                    return (
                        <div
                            key={type}
                            className="flex items-center justify-center text-md font-normal text-white"
                            style={{
                                backgroundColor: PILL_HEX_COLORS[type],
                                width: `${pct}%`,
                                minWidth: '40px',
                                textShadow: '2px 2px 0 rgba(0,0,0,0.5)',
                            }}
                        >
                            {qty}
                        </div>
                    )
                })}
            </div>

            {/* Tabela */}
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-border">
                        <th className="text-left py-2 font-normal">Tipo</th>
                        <th className="text-right py-2 font-normal">Unlock</th>
                        <th className="text-right py-2 font-normal">Chance</th>
                        <th className="text-right py-2 font-normal">Qtd</th>
                    </tr>
                </thead>
                <tbody>
                    {pillTypes.map((type) => {
                        const rule = config.rules[type]
                        const isUnlocked = round >= rule.unlockRound
                        const chance = chances[type]
                        const qty = distribution[type]

                        return (
                            <tr
                                key={type}
                                className={`border-b border-border/50 ${!isUnlocked ? 'opacity-40' : ''}`}
                            >
                                <td className="py-2">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 border border-foreground/30"
                                            style={{ backgroundColor: PILL_HEX_COLORS[type] }}
                                        />
                                        <span className="font-normal">{PILL_LABELS[type]}</span>
                                    </div>
                                </td>
                                <td className="text-right py-2 font-mono font-normal">
                                    R{rule.unlockRound}
                                </td>
                                <td className="text-right py-2 font-mono font-normal">
                                    {chance.toFixed(1)}%
                                </td>
                                <td className="text-right py-2 font-mono font-normal text-sm">
                                    {qty}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

// ============================================
// Componente Principal
// ============================================

export function DistributionSimulator() {
    // Estado da configuracao
    const [config, setConfig] = useState<ProgressionConfig>(() => ({
        maxRound: PROGRESSION.maxRound,
        rules: { ...PROGRESSION.rules },
    }))

    const [poolConfig, setPoolConfig] = useState<PoolScalingConfig>(() => ({
        ...POOL_SCALING,
    }))

    const [selectedRound, setSelectedRound] = useState<number>(5)

    // Handlers
    const updateRule = (type: PillType, rule: PillRule) => {
        setConfig((prev) => ({
            ...prev,
            rules: { ...prev.rules, [type]: rule },
        }))
    }

    const resetToDefault = () => {
        setConfig({
            maxRound: PROGRESSION.maxRound,
            rules: { ...PROGRESSION.rules },
        })
        setPoolConfig({ ...POOL_SCALING })
    }

    // Codigo gerado
    const generatedCode = useMemo(() => {
        const pillTypes: PillType[] = ['SAFE', 'DMG_LOW', 'DMG_HIGH', 'HEAL', 'FATAL', 'LIFE']
        const rulesStr = pillTypes
            .map((type) => {
                const r = config.rules[type]
                return `    ${type.padEnd(8)}: { unlockRound: ${String(r.unlockRound).padStart(2)}, startPct: ${String(r.startPct).padStart(2)}, endPct: ${String(r.endPct).padStart(2)} },`
            })
            .join('\n')

        return `export const PROGRESSION: ProgressionConfig = {
  maxRound: ${config.maxRound},
  rules: {
${rulesStr}
  },
}

export const POOL_SCALING: PoolScalingConfig = {
  baseCount: ${poolConfig.baseCount},
  increaseBy: ${poolConfig.increaseBy},
  frequency: ${poolConfig.frequency},
  maxCap: ${poolConfig.maxCap ?? 'undefined'},
}`
    }, [config, poolConfig])

    const pillTypes: PillType[] = ['SAFE', 'DMG_LOW', 'DMG_HIGH', 'HEAL', 'FATAL', 'LIFE']
    const rounds = Array.from({ length: 15 }, (_, i) => i + 1)

    return (
        <Card className="p-6">
            <div>
                <h2 className="text-2xl font-normal mb-2">Simulador de Distribuicao</h2>
                <p className="text-muted-foreground">
                    Ajuste os parametros e veja em tempo real como as pilulas serao distribuidas.
                </p>
            </div>

            <div className="grid grid-cols-4 gap-6">
                {/* Controles Globais */}
                <div className="space-y-6 col-span-1">
                    {/* Pool Scaling */}
                    <div>
                        <h3 className="text-sm font-normal uppercase text-muted-foreground mb-3 tracking-wider">
                            Pool Scaling
                        </h3>
                        <div className="p-4 border-2 border-border bg-background/50 space-y-3">
                            <Slider
                                label="Base"
                                value={poolConfig.baseCount}
                                min={4}
                                max={12}
                                onChange={(v) => setPoolConfig((p) => ({ ...p, baseCount: v }))}
                            />
                            <Slider
                                label="Aumento"
                                value={poolConfig.increaseBy}
                                min={0}
                                max={3}
                                onChange={(v) => setPoolConfig((p) => ({ ...p, increaseBy: v }))}
                            />
                            <Slider
                                label="Freq"
                                value={poolConfig.frequency}
                                min={1}
                                max={5}
                                onChange={(v) => setPoolConfig((p) => ({ ...p, frequency: v }))}
                            />
                            <Slider
                                label="Max Cap"
                                value={poolConfig.maxCap ?? 20}
                                min={6}
                                max={20}
                                onChange={(v) => setPoolConfig((p) => ({ ...p, maxCap: v }))}
                            />
                        </div>
                    </div>

                    {/* Progressao */}
                    <div>
                        <h3 className="text-sm font-normal uppercase text-muted-foreground mb-3 tracking-wider">
                            Progressao
                        </h3>
                        <div className="p-4 border-2 border-border bg-background/50">
                            <Slider
                                label="Max Rnd"
                                value={config.maxRound}
                                min={5}
                                max={30}
                                onChange={(v) => setConfig((p) => ({ ...p, maxRound: v }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Controles por Tipo */}
                <div className="space-y-4 col-span-2">
                    <h3 className="text-sm font-normal uppercase text-muted-foreground mb-3 tracking-wider">
                        Tipos de Pilula
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {pillTypes.map((type) => (
                            <PillTypeControls
                                key={type}
                                type={type}
                                rule={config.rules[type]}
                                onChange={(rule) => updateRule(type, rule)}
                            />
                        ))}
                    </div>
                </div>

                {/* Codigo */}
                <div className="space-y-4 col-span-1">
                    <div>
                        <h3 className="text-sm font-normal uppercase text-muted-foreground mb-3 tracking-wider">
                            Codigo Gerado
                        </h3>
                        <ScrollArea className="h-64 border-2 border-border bg-black/50" scrollbars="both">
                            <pre className="p-3 text-[8px] font-mono text-green-400 whitespace-pre">
                                {generatedCode}
                            </pre>
                        </ScrollArea>
                    </div>
                    {/* Acoes */}
                    <div className="flex flex-col gap-6">
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
                </div>
            </div>

            <Separator />

            {/* Visualizacao */}
            {/* Seletor de rodada */}
            <div className="flex items-center gap-3">
                <h3 className="text-sm font-normal uppercase text-muted-foreground tracking-wider">
                    Visualizacao
                </h3>
                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-muted-foreground">Rnd:</span>
                    <input
                        type="text"
                        value={selectedRound}
                        readOnly
                        onChange={(e) => setSelectedRound(Number(e.target.value))}
                        className="w-14 py-1 bg-background border-2 border-border text-center font-mono"
                    />
                </div>
            </div>
            <div className="flex flex-row gap-4">
                {/* Detalhe da rodada selecionada */}
                <RoundDetail round={selectedRound} config={config} poolConfig={poolConfig} />
                {/* Grid de rodadas */}
                <div className="grid grid-flow-row-dense grid-cols-5 gap-2">
                    {rounds.map((round) => (
                        <button
                            key={round}
                            onClick={() => setSelectedRound(round)}
                            className="text-left"
                        >
                            <RoundCard
                                round={round}
                                config={config}
                                poolConfig={poolConfig}
                                isHighlighted={round === selectedRound}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </Card>
    )
}
