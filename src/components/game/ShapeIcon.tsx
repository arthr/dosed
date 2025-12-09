import type { PillShape } from '@/types'
import { SHAPE_CLASSES, SHAPE_CLIP_PATHS, SHAPE_LABELS } from '@/utils/constants'

interface ShapeIconProps {
  /** Shape a ser renderizada */
  shape: PillShape
  /** Tamanho do icone */
  size?: 'sm' | 'md' | 'lg'
  /** Classes CSS adicionais */
  className?: string
  /** Cor de fundo (hex ou classe Tailwind) */
  color?: string
}

const sizeClasses = {
  sm: 'h-5 min-w-5',
  md: 'h-7 min-w-7',
  lg: 'h-9 min-w-9',
}

/**
 * Componente para exibir uma shape isolada
 * Usado em ShapeQuestDisplay, ShapeSelector e outros contextos
 */
export function ShapeIcon({
  shape,
  size = 'md',
  className = '',
  color,
}: ShapeIconProps) {
  const shapeClass = SHAPE_CLASSES[shape]
  const clipPath = SHAPE_CLIP_PATHS[shape]
  const label = SHAPE_LABELS[shape]

  // Determina estilo de cor
  const isHexColor = color?.startsWith('#')
  const colorStyle = isHexColor ? { backgroundColor: color } : undefined
  const colorClass = !isHexColor && color ? color : (!color ? 'bg-muted' : '')

  return (
    <div
      style={{
        clipPath: clipPath || undefined,
        ...colorStyle,
      }}
      className={`
        ${sizeClasses[size]}
        ${shapeClass}
        ${colorClass}
        ${className}
      `}
      title={label}
      aria-label={label}
    />
  )
}

