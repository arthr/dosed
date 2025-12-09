import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import type { Pill as PillType } from '@/types'
import {
  PILL_LABELS,
  PILL_HEX_COLORS,
  SHAPE_IMAGES,
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
 * Classes de tamanho para o container
 */
const sizeClasses = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-12',
}

/**
 * Componente visual de uma pilula
 * Usa imagens PNG para representar shapes
 * Estados: oculta, revelada, hover, selecionada, scanned, target, inverted, doubled
 */
export function Pill({
  pill,
  onClick,
  disabled = false,
  selected: _selected = false, // Mantido para compatibilidade mas nao usado com shapes de imagem
  size = 'md',
  isScanned = false,
  isValidTarget = false,
}: PillProps) {
  void _selected // Suprimir warning - prop mantida para API compativel
  // Pilula visivel se: revelada normalmente OU escaneada
  const showType = pill.isRevealed || isScanned
  const label = showType ? PILL_LABELS[pill.type] : '???'

  // Shape visual (sempre visivel, mesmo quando pilula oculta)
  const shape = pill.visuals.shape
  const shapeImage = SHAPE_IMAGES[shape]
  const shapeLabel = SHAPE_LABELS[shape]

  // Cor do tipo para drop-shadow (quando visivel)
  const typeColor = showType ? PILL_HEX_COLORS[pill.type] : null

  // Modifiers visuais
  const hasInverted = pill.inverted === true
  const hasDoubled = pill.doubled === true

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled && !isValidTarget}
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        transition-all duration-200
        focus:outline-none
        ${disabled && !isValidTarget
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer'
        }
        relative
      `}
      // Animacoes Framer Motion
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isValidTarget ? [1, 1.08, 1] : 1, 
        opacity: disabled && !isValidTarget ? 0.5 : 1,
        transition: isValidTarget ? {
          scale: {
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        } : undefined,
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
      aria-label={`Pilula ${shapeLabel}${showType ? ` - ${label}` : ' (oculta)'}${hasInverted ? ' (invertida)' : ''}${hasDoubled ? ' (dobrada)' : ''}`}
      title={`${shapeLabel}${showType ? ` - ${label}` : ''}`}
    >
      {/* Imagem da Shape com drop-shadow colorido baseado no tipo */}
      <motion.img
        src={shapeImage}
        alt={shapeLabel}
        className="w-full h-full object-contain select-none pointer-events-none"
        style={{
          filter: typeColor 
            ? `drop-shadow(0 0 4px ${typeColor}) drop-shadow(0 0 8px ${typeColor}) drop-shadow(0 0 16px ${typeColor}80)`
            : 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))',
        }}
        draggable={false}
        // Animacao de pulse quando revelada por scanner (temporario)
        animate={isScanned && !pill.isRevealed ? {
          scale: [1, 1.08, 1],
          transition: {
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        } : {
          scale: 1,
        }}
        // Transicao suave do filtro
        transition={{ filter: { duration: 0.3 } }}
      />

      {/* Badge de Invertido */}
      {hasInverted && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center z-10"
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
          className={`absolute ${hasInverted ? '-top-1 -left-1' : '-top-1 -right-1'} w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center z-10`}
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
 * Grid de pilulas com animacao de entrada escalonada
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
