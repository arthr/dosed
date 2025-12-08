import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface GameLayoutProps {
  children: ReactNode
}

/**
 * Layout principal do jogo Dosed
 * Estrutura: Header + Area de Jogadores + Mesa de Pilulas
 */
export function GameLayout({ children }: GameLayoutProps) {
  return (
    <div className="retro min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <h1 className="font-normal text-foreground tracking-tight">
              Dosed
            </h1>
          </Link>
          <span className="text-xs text-muted-foreground">Pill Roulette</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-3 text-center text-xs text-muted-foreground">
        Developed by <a href="https://github.com/arthr" target="_blank" rel="noopener noreferrer" className="text-game-accent">@arthr</a>
      </footer>
    </div>
  )
}
