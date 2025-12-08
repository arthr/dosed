import { useState } from 'react'
import {
  Search,
  RefreshCw,
  CopyPlus,
  Pill as PillIcon,
  Shield,
  Lock,
  Utensils,
  Shuffle,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import type { ItemType } from '@/types'

// Imports estaticos das imagens para melhor performance e bundling
import scannerImg from '@/assets/items/scanned.JPG'
import inverterImg from '@/assets/items/inverter.JPG'
import doubleImg from '@/assets/items/double.JPG'
import pocketPillImg from '@/assets/items/pill_pocket.JPG'
import shieldImg from '@/assets/items/shield.JPG'
import handcuffsImg from '@/assets/items/handcuffs.JPG'
import forceFeedImg from '@/assets/items/force_feed.JPG'
import shuffleImg from '@/assets/items/shuffle.JPG'
import discardImg from '@/assets/items/discard.JPG'

// ============================================
// Mapeamentos
// ============================================

/** Mapeamento de ItemType para imagem */
const IMAGE_MAP: Record<ItemType, string> = {
  scanner: scannerImg,
  inverter: inverterImg,
  double: doubleImg,
  pocket_pill: pocketPillImg,
  shield: shieldImg,
  handcuffs: handcuffsImg,
  force_feed: forceFeedImg,
  shuffle: shuffleImg,
  discard: discardImg,
}

/** Mapeamento de ItemType para icone Lucide (fallback) */
const ICON_MAP: Record<ItemType, LucideIcon> = {
  scanner: Search,
  inverter: RefreshCw,
  double: CopyPlus,
  pocket_pill: PillIcon,
  shield: Shield,
  handcuffs: Lock,
  force_feed: Utensils,
  shuffle: Shuffle,
  discard: Trash2,
}

// ============================================
// Componente
// ============================================

interface ItemIconProps {
  /** Tipo do item */
  type: ItemType
  /** Tamanho em pixels */
  size?: number
  /** Classe CSS adicional (cor, etc) */
  className?: string
  /** Estilos inline (para cores dinamicas) */
  style?: React.CSSProperties
  /** Forcar uso do icone (ignorar imagem) */
  forceIcon?: boolean
}

/**
 * Icone de item com imagem customizada e fallback para Lucide
 * 
 * Uso:
 * ```tsx
 * <ItemIcon type="scanner" size={24} className="text-blue-400" />
 * ```
 */
export function ItemIcon({
  type,
  size = 24,
  className = '',
  style,
  forceIcon = false,
}: ItemIconProps) {
  const [imageError, setImageError] = useState(false)
  
  const imageSrc = IMAGE_MAP[type]
  const FallbackIcon = ICON_MAP[type]
  
  // Usa imagem se disponivel e nao houve erro
  const shouldUseImage = !forceIcon && imageSrc && !imageError
  
  if (shouldUseImage) {
    return (
      <img
        src={imageSrc}
        alt={type}
        width={size}
        height={size}
        className={`object-contain ${className}`}
        style={{ width: size, height: size, ...style }}
        onError={() => setImageError(true)}
        draggable={false}
      />
    )
  }
  
  // Fallback para icone Lucide
  if (FallbackIcon) {
    return <FallbackIcon size={size} className={className} style={style} />
  }
  
  // Fallback final (nunca deveria chegar aqui)
  return null
}

/**
 * Hook para preload de imagens de itens
 * Pode ser usado no inicio do jogo para evitar flash
 */
export function usePreloadItemImages() {
  const preload = () => {
    Object.values(IMAGE_MAP).forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }
  
  return { preload }
}
