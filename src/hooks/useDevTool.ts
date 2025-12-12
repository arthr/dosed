import { useEffect } from 'react'
import { useDevToolStore } from '@/stores/devToolStore'

/**
 * Hook para controlar o DevTool via atalho de teclado
 * 
 * Atalho: CTRL+SHIFT+D
 * 
 * @returns Estado e actions do DevTool
 */
export function useDevTool() {
  const isOpen = useDevToolStore((state) => state.isOpen)
  const toggle = useDevToolStore((state) => state.toggle)
  const open = useDevToolStore((state) => state.open)
  const close = useDevToolStore((state) => state.close)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // CTRL+SHIFT+D (ou CMD+SHIFT+D no Mac)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault()
        toggle()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [toggle])

  return {
    isOpen,
    toggle,
    open,
    close,
  }
}

