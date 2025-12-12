import { Minimize2, X } from 'lucide-react'
import { Button } from '@/components/ui/8bit/button'

interface DevToolHeaderProps {
  onMinimize: () => void
  onClose: () => void
  onDragStart: (e: React.MouseEvent) => void
}

/**
 * Header do DevTool com drag handle e botões de controle
 */
export function DevToolHeader({ onMinimize, onClose, onDragStart }: DevToolHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2 bg-primary text-primary-foreground border-b border-border cursor-move select-none"
      onMouseDown={onDragStart}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono font-normal tracking-wider">DEV TOOL</span>
        <span className="text-[10px] opacity-70">(CTRL+SHIFT+D)</span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onMinimize()
          }}
          className="h-6 w-6 p-0 hover:bg-primary-foreground/20"
        >
          <Minimize2 className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="h-6 w-6 p-0 hover:bg-destructive/80"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

