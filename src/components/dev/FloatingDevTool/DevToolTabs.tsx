import { cn } from '@/lib/utils'
import type { DevToolTab } from '@/stores/devToolStore'

interface DevToolTabsProps {
  activeTab: DevToolTab
  onTabChange: (tab: DevToolTab) => void
}

const TABS: { id: DevToolTab; label: string }[] = [
  { id: 'game', label: 'Game' },
  { id: 'multiplayer', label: 'Multi' },
  { id: 'stores', label: 'Stores' },
  { id: 'actions', label: 'Actions' },
  { id: 'logs', label: 'Logs' },
]

/**
 * Sistema de navegação entre abas do DevTool
 */
export function DevToolTabs({ activeTab, onTabChange }: DevToolTabsProps) {
  return (
    <div className="flex border-b border-border bg-muted/20">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'px-2.5 py-1.5 text-[8px] font-mono uppercase tracking-wider transition-colors',
            'hover:bg-muted/40',
            'border-r border-border last:border-r-0',
            activeTab === tab.id
              ? 'bg-background text-foreground font-normal'
              : 'bg-muted/10 text-muted-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

