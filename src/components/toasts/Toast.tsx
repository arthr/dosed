import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Toast as ToastType, ToastType as ToastVariant } from '@/stores/toastStore'
import type { ItemType } from '@/types'
import { useToastDismiss } from '@/hooks/useToast'
import { ITEM_CATALOG } from '@/utils/itemCatalog'
import { ItemIcon } from '@/components/game/ItemIcon'

interface ToastProps {
  toast: ToastType
}

/**
 * Estilos por tipo de toast - versao compacta
 */
const toastStyles: Record<ToastVariant, { bg: string; text: string; icon: string }> = {
  damage: { bg: 'bg-red-600/90', text: 'text-white', icon: '-' },
  heal: { bg: 'bg-emerald-600/90', text: 'text-white', icon: '+' },
  collapse: { bg: 'bg-purple-600/90', text: 'text-white', icon: '!' },
  safe: { bg: 'bg-green-600/90', text: 'text-white', icon: '' },
  fatal: { bg: 'bg-purple-900/90', text: 'text-white', icon: 'X' },
  item: { bg: 'bg-blue-600/90', text: 'text-white', icon: '' },
  quest: { bg: 'bg-amber-600/90', text: 'text-white', icon: '' },
}

/**
 * Retorna estilos dinamicos para toast de item baseado na categoria
 */
function getItemToastStyles(itemType: ItemType) {
  const itemDef = ITEM_CATALOG[itemType]

  const categoryStyles: Record<string, { bg: string }> = {
    intel: { bg: 'bg-blue-600/90' },
    sustain: { bg: 'bg-emerald-600/90' },
    control: { bg: 'bg-yellow-600/90' },
    chaos: { bg: 'bg-purple-600/90' },
  }

  return categoryStyles[itemDef.category] || { bg: 'bg-blue-600/90' }
}

/**
 * Toast compacto e sutil
 * Projetado para aparecer acima da area do jogador
 */
export function Toast({ toast }: ToastProps) {
  const dismiss = useToastDismiss()

  const isItemToast = toast.type === 'item' && toast.itemType
  const baseStyles = toastStyles[toast.type]
  const itemStyles = isItemToast ? getItemToastStyles(toast.itemType!) : null
  const styles = { ...baseStyles, ...(itemStyles || {}) }

  const itemDef = isItemToast ? ITEM_CATALOG[toast.itemType!] : null

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, dismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-none"
    >
      <div
        className={`
          ${styles.bg} ${styles.text}
          px-3 py-1.5
          rounded
          flex items-center gap-2
          text-xs font-normal
          shadow-lg
          backdrop-blur-sm
        `}
      >
        {/* Icone do item */}
        {isItemToast && (
          <ItemIcon type={toast.itemType!} size={14} className="shrink-0" forceIcon />
        )}

        {/* Valor numerico (para damage/heal) */}
        {toast.value !== undefined && (
          <span className="font-bold">
            {styles.icon}{Math.abs(toast.value)}
          </span>
        )}

        {/* Nome do item ou mensagem curta */}
        {itemDef ? (
          <span>{itemDef.name}</span>
        ) : (
          <span>{toast.message}</span>
        )}
      </div>
    </motion.div>
  )
}

