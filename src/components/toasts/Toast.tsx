import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Toast as ToastType, ToastType as ToastVariant } from '@/stores/toastStore'
import { useToastDismiss } from '@/hooks/useToast'
import { PILL_LABELS } from '@/utils/constants'
import '@/components/ui/8bit/styles/retro.css'

interface ToastProps {
  toast: ToastType
}

/**
 * Estilos por tipo de toast
 */
const toastStyles: Record<ToastVariant, { bg: string; border: string; text: string; icon: string }> = {
  damage: { bg: 'bg-red-600', border: 'bg-red-800', text: 'text-white', icon: '-' },
  heal: { bg: 'bg-emerald-600', border: 'bg-emerald-800', text: 'text-white', icon: '+' },
  collapse: { bg: 'bg-purple-600', border: 'bg-purple-800', text: 'text-white', icon: '!' },
  safe: { bg: 'bg-green-600', border: 'bg-green-800', text: 'text-white', icon: '~' },
  fatal: { bg: 'bg-purple-900', border: 'bg-purple-950', text: 'text-white', icon: 'X' },
}

/**
 * Componente individual de Toast com visual 8bit
 * Auto-dismiss apos duration
 */
export function Toast({ toast }: ToastProps) {
  const dismiss = useToastDismiss()
  const styles = toastStyles[toast.type]

  // Auto-dismiss apos duration
  useEffect(() => {
    const timer = setTimeout(() => {
      dismiss(toast.id)
    }, toast.duration)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, dismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ duration: 0.3 }}
      className="pointer-events-none"
    >
      {/* Container 8bit com bordas pixeladas */}
      <div className="relative retro">
        {/* Conteudo principal */}
        <div
          className={`
            ${styles.bg} ${styles.text}
            px-6 py-4
            flex flex-col items-center gap-1
            min-w-[120px]
          `}
        >
          {toast.value !== undefined && (
            <span className="text-lg font-normal tracking-tight">
              {styles.icon}
              {Math.abs(toast.value)}
            </span>
          )}
          <span className="text-sm font-normal">{toast.message}</span>
          {toast.pillType && (
            <span className="text-xs opacity-80">{PILL_LABELS[toast.pillType]}</span>
          )}
        </div>

        {/* Bordas pixeladas 8bit */}
        <div className={`absolute -top-1.5 w-1/2 left-1.5 h-1.5 ${styles.border}`} />
        <div className={`absolute -top-1.5 w-1/2 right-1.5 h-1.5 ${styles.border}`} />
        <div className={`absolute -bottom-1.5 w-1/2 left-1.5 h-1.5 ${styles.border}`} />
        <div className={`absolute -bottom-1.5 w-1/2 right-1.5 h-1.5 ${styles.border}`} />
        <div className={`absolute top-0 left-0 size-1.5 ${styles.border}`} />
        <div className={`absolute top-0 right-0 size-1.5 ${styles.border}`} />
        <div className={`absolute bottom-0 left-0 size-1.5 ${styles.border}`} />
        <div className={`absolute bottom-0 right-0 size-1.5 ${styles.border}`} />
        <div className={`absolute top-1 -left-1.5 h-1/2 w-1.5 ${styles.border}`} />
        <div className={`absolute bottom-1 -left-1.5 h-1/2 w-1.5 ${styles.border}`} />
        <div className={`absolute top-1 -right-1.5 h-1/2 w-1.5 ${styles.border}`} />
        <div className={`absolute bottom-1 -right-1.5 h-1/2 w-1.5 ${styles.border}`} />
      </div>
    </motion.div>
  )
}

