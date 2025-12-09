import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import type { Pill as PillType } from '@/types'
import {
  PILL_COLORS,
  PILL_LABELS,
  HIDDEN_PILL_COLOR,
  SHAPE_CLASSES,
  SHAPE_CLIP_PATHS,
  SHAPE_LABELS,
} from '@/utils/constants'

interface PillProps {
  /** Dados da pilula */
  pill: PillType
  /** Callback ao clicar */
  onClick?: () => void
  /** Se a pilula esta desabilitada (nao pode ser clicada) */
  disabled?: boolean
  /** Se a pilula esta selecionada */
  selected?: boolean
  /** Tamanho da pilula */
  size?: 'sm' | 'md' | 'lg'
  /** Se a pilula foi revelada por Scanner (temporario) */
  isScanned?: boolean
  /** Se a pilula e um alvo valido (modo selecao de alvo) */
  isValidTarget?: boolean
}

/**
 * Classes de tamanho base (altura fixa, largura ajustada pelo aspect ratio)
 */
const sizeClasses = {
  sm: 'h-10 min-w-10 text-xs',
  md: 'h-12 min-w-12 text-sm',
  lg: 'h-16 min-w-16 text-base',
}

/**
 * Componente visual de uma pilula
 * Estados: oculta, revelada, hover, selecionada, scanned, target, inverted, doubled
 */
export function Pill({
  pill,
  onClick,
  disabled = false,
  selected = false,
  size = 'md',
  isScanned = false,
  isValidTarget = false,
}: PillProps) {
  // Pilula visivel se: revelada normalmente OU escaneada
  const showType = pill.isRevealed || isScanned
  const colorClass = showType ? PILL_COLORS[pill.type] : HIDDEN_PILL_COLOR
  const label = showType ? PILL_LABELS[pill.type] : '???'
  const displayChar = showType ? pill.type.charAt(0) : '?'

  // Shape visual (sempre visivel, mesmo quando pilula oculta)
  const shape = pill.visuals.shape
  const shapeClass = SHAPE_CLASSES[shape]
  const clipPath = SHAPE_CLIP_PATHS[shape]
  const shapeLabel = SHAPE_LABELS[shape]

  // Modifiers visuais
  const hasInverted = pill.inverted === true
  const hasDoubled = pill.doubled === true

  // Classes de estado
  const targetClasses = isValidTarget
    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background cursor-pointer'
    : ''
  const scannedClasses = isScanned && !pill.isRevealed
    ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-background'
    : ''

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled && !isValidTarget}
      style={clipPath ? { clipPath } : undefined}
      className={`
        ${sizeClasses[size]}
        ${shapeClass}
        border-2 
        flex items-center justify-center
        font-normal text-foreground
        transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${colorClass}
        ${disabled && !isValidTarget
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer'
        }
        ${selected 
          ? 'border-primary ring-2 ring-primary/50' 
          : 'border-transparent hover:border-primary/50'
        }
        ${!showType ? 'bg-pill-hidden' : ''}
        ${targetClasses}
        ${scannedClasses}
        relative
      `}
      // Animacoes Framer Motion
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: disabled && !isValidTarget ? 0.5 : 1,
      }}
      exit={{ 
        scale: 0, 
        opacity: 0,
        transition: { duration: 0.2 }
      }}
      whileHover={(!disabled || isValidTarget) ? { 
        scale: 1.15,
        transition: { duration: 0.15 }
      } : undefined}
      whileTap={(!disabled || isValidTarget) ? { 
        scale: 0.95 
      } : undefined}
      // Animacao de pulse quando selecionada ou alvo valido
      {...((selected || isValidTarget) && {
        animate: {
          scale: [1, 1.05, 1],
          opacity: 1,
          transition: {
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      })}
      aria-label={`Pílula ${shapeLabel}${showType ? ` - ${label}` : ' (oculta)'}${hasInverted ? ' (invertida)' : ''}${hasDoubled ? ' (dobrada)' : ''}`}
      title={`${shapeLabel}${showType ? ` - ${label}` : ''}`}
    >
      <span className="select-none">{displayChar}</span>

      {/* Badge de Invertido */}
      {hasInverted && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          title="Efeito invertido"
        >
          <RefreshCw className="w-2.5 h-2.5 text-white" />
        </motion.div>
      )}

      {/* Badge de Dobrado */}
      {hasDoubled && (
        <motion.div
          className={`absolute ${hasInverted ? '-top-1 -left-1' : '-top-1 -right-1'} w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          title="Efeito dobrado"
        >
          <span className="text-[8px] font-bold text-white">x2</span>
        </motion.div>
      )}
    </motion.button>
  )
}

/**
 * Grid de pílulas com animação de entrada escalonada
 */
interface PillGridProps {
  pills: PillType[]
  onSelectPill: (pillId: string) => void
  disabled?: boolean
  selectedPillId?: string | null
  /** IDs de pilulas reveladas por Scanner */
  scannedPillIds?: string[]
  /** Se esta em modo de selecao de alvo (todas pilulas sao alvos validos) */
  isTargetSelectionMode?: boolean
}

export function PillGrid({
  pills,
  onSelectPill,
  disabled = false,
  selectedPillId = null,
  scannedPillIds = [],
  isTargetSelectionMode = false,
}: PillGridProps) {
  const gridKey = pills.length > 0 ? pills[0].id : 'empty'
  
  return (
    <motion.div
      key={gridKey}
      className="flex flex-wrap justify-center gap-3 py-4"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
    >
      {pills.map((pill) => (
        <motion.div
          key={pill.id}
          variants={{
            hidden: { scale: 0, opacity: 0 },
            visible: { scale: 1, opacity: 1 },
          }}
        >
          <Pill
            pill={pill}
            onClick={() => onSelectPill(pill.id)}
            disabled={disabled}
            selected={selectedPillId === pill.id}
            isScanned={scannedPillIds.includes(pill.id)}
            isValidTarget={isTargetSelectionMode}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}

