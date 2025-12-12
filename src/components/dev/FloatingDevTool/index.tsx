import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDevToolStore } from '@/stores/devToolStore'
import { DevToolHeader } from './DevToolHeader'
import { DevToolTabs } from './DevToolTabs'
import { GameStateTab } from './tabs/GameStateTab'
import { cn } from '@/lib/utils'

/**
 * FloatingDevTool - Ferramenta de desenvolvimento flutuante
 * 
 * Atalho: CTRL+SHIFT+D
 * 
 * Features:
 * - Draggable
 * - Minimizável
 * - Múltiplas abas (Game, Multiplayer, Stores, Actions, Logs)
 */
export function FloatingDevTool() {
  const isOpen = useDevToolStore((s) => s.isOpen)
  const isMinimized = useDevToolStore((s) => s.isMinimized)
  const activeTab = useDevToolStore((s) => s.activeTab)
  const position = useDevToolStore((s) => s.position)
  const toggleMinimize = useDevToolStore((s) => s.toggleMinimize)
  const close = useDevToolStore((s) => s.close)
  const setActiveTab = useDevToolStore((s) => s.setActiveTab)
  const setPosition = useDevToolStore((s) => s.setPosition)

  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Handler para iniciar drag
  const handleDragStart = (e: React.MouseEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
  }

  // Handler para mover durante drag
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      // Limita posição dentro da viewport
      const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 400)
      const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 500)

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, setPosition])

  // Atualiza posição quando window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return

      const maxX = window.innerWidth - containerRef.current.offsetWidth
      const maxY = window.innerHeight - containerRef.current.offsetHeight

      if (position.x > maxX || position.y > maxY) {
        setPosition({
          x: Math.min(position.x, maxX),
          y: Math.min(position.y, maxY),
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [position, setPosition])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 9999,
        }}
        className={cn(
          'bg-background border-4 border-foreground shadow-2xl',
          'w-auto max-w-[460px]',
          isDragging && 'cursor-move',
          isMinimized ? 'h-auto' : 'h-[500px]'
        )}
      >
        {/* Header */}
        <DevToolHeader onMinimize={toggleMinimize} onClose={close} onDragStart={handleDragStart} />

        {/* Content (apenas se não minimizado) */}
        {!isMinimized && (
          <>
            {/* Tabs */}
            <DevToolTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            <div className="bg-background">
              {activeTab === 'game' && <GameStateTab />}
              {activeTab === 'multiplayer' && (
                <div className="p-4 text-xs text-muted-foreground italic">Em desenvolvimento...</div>
              )}
              {activeTab === 'stores' && (
                <div className="p-4 text-xs text-muted-foreground italic">Em desenvolvimento...</div>
              )}
              {activeTab === 'actions' && (
                <div className="p-4 text-xs text-muted-foreground italic">Em desenvolvimento...</div>
              )}
              {activeTab === 'logs' && (
                <div className="p-4 text-xs text-muted-foreground italic">Em desenvolvimento...</div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

