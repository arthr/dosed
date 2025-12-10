import { motion } from 'framer-motion'
import { useEffect, useRef, useCallback } from 'react'
import type { ItemType } from '@/types'
import { ITEM_CATALOG, CATEGORY_HEX_COLORS } from '@/utils/itemCatalog'
import { ItemIcon } from '@/components/game/ItemIcon'

interface ItemEffectOverlayProps {
  /** Tipo do item usado */
  itemType: ItemType
  /** Informacao adicional sobre o alvo (ex: "na pilula Veneno") */
  targetInfo?: string
  /** Chamado quando animacao termina */
  onComplete: () => void
}

/** Delay antes de auto-dismiss (ms) */
const AUTO_DISMISS_DELAY = 1500

/**
 * Overlay de feedback visual quando um item e usado
 * Exibe icone, nome e efeito do item com animacao
 * Auto-dismiss apos 1.5s
 */
export function ItemEffectOverlay({
  itemType,
  targetInfo,
  onComplete,
}: ItemEffectOverlayProps) {
  const hasCompletedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const handleComplete = useCallback(() => {
    if (hasCompletedRef.current) return
    hasCompletedRef.current = true
    onCompleteRef.current()
  }, [])

  // Auto-dismiss apos delay
  useEffect(() => {
    const timer = setTimeout(() => {
      handleComplete()
    }, AUTO_DISMISS_DELAY)

    return () => clearTimeout(timer)
  }, [handleComplete])

  // Dados do item
  const itemDef = ITEM_CATALOG[itemType]
  const categoryColor = CATEGORY_HEX_COLORS[itemDef.category]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-none"
    >
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 45 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
        className="flex flex-col items-center gap-4"
      >
        {/* Icone grande do item */}
        <motion.div
          className="size-32 border-2 rounded-2xl overflow-hidden shadow-2xl"
          style={{ backgroundColor: categoryColor, borderColor: categoryColor }}
          animate={{
            boxShadow: [
              `0 0 20px ${categoryColor}`,
              `0 0 50px ${categoryColor}`,
              `0 0 20px ${categoryColor}`,
            ],
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <ItemIcon 
            type={itemType} 
            size={128} 
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Info do item */}
        <div className="text-center space-y-2">
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-normal text-white"
          >
            {itemDef.name}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground"
          >
            {itemDef.description}
          </motion.p>
          {targetInfo && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-primary font-medium"
            >
              {targetInfo}
            </motion.p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
