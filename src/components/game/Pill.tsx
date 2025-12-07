import { motion } from 'framer-motion'
import type { Pill as PillType } from '@/types'
import { PILL_COLORS, PILL_LABELS, HIDDEN_PILL_COLOR } from '@/utils/constants'

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
}

const sizeClasses = {
  sm: 'w-10 h-10 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
}

/**
 * Componente visual de uma pilula
 * Estados: oculta, revelada, hover, selecionada, consumida
 */
export function Pill({
  pill,
  onClick,
  disabled = false,
  selected = false,
  size = 'md',
}: PillProps) {
  const isRevealed = pill.isRevealed
  const colorClass = isRevealed ? PILL_COLORS[pill.type] : HIDDEN_PILL_COLOR
  const label = isRevealed ? PILL_LABELS[pill.type] : '???'
  const displayChar = isRevealed ? pill.type.charAt(0) : '?'

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        rounded-full border-2 
        flex items-center justify-center
        font-bold text-white
        transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${colorClass}
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer'
        }
        ${selected 
          ? 'border-primary ring-2 ring-primary/50' 
          : 'border-transparent hover:border-primary/50'
        }
        ${!isRevealed ? 'bg-pill-hidden' : ''}
      `}
      // Animacoes Framer Motion
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: disabled ? 0.5 : 1,
      }}
      exit={{ 
        scale: 0, 
        opacity: 0,
        transition: { duration: 0.2 }
      }}
      whileHover={!disabled ? { 
        scale: 1.15,
        transition: { duration: 0.15 }
      } : undefined}
      whileTap={!disabled ? { 
        scale: 0.95 
      } : undefined}
      // Animacao de pulse quando selecionada
      {...(selected && {
        animate: {
          scale: [1, 1.05, 1],
          transition: {
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      })}
      aria-label={`Pilula ${label}${isRevealed ? '' : ' (oculta)'}`}
      title={label}
    >
      <span className="select-none">{displayChar}</span>
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
}

export function PillGrid({
  pills,
  onSelectPill,
  disabled = false,
  selectedPillId = null,
}: PillGridProps) {
  return (
    <motion.div 
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
          />
        </motion.div>
      ))}
    </motion.div>
  )
}

