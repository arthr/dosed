import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/8bit/button'
import { DistributionSimulator } from './DistributionSimulator'
import { ShapeDistributionSimulator } from './ShapeDistributionSimulator'

type DevTool = 'pills' | 'shapes'

interface NavItem {
  id: DevTool
  label: string
  description: string
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'pills',
    label: 'Pills Distribution',
    description: 'Simulador de distribuicao de tipos de pilulas',
  },
  {
    id: 'shapes',
    label: 'Shapes Distribution',
    description: 'Simulador de distribuicao de shapes por rodada',
  },
]

/**
 * Pagina de ferramentas de desenvolvimento
 * Acessivel via /#/dev
 */
export function DevPage() {
  const [activeTool, setActiveTool] = useState<DevTool>('pills')

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixo */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b-2 border-border">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-2xl font-normal text-foreground">
                  Dev Tools
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5 retro">
                  Ferramentas de desenvolvimento e calibracao
                </p>
              </div>

              {/* Menu de navegacao */}
              <nav className="flex items-center gap-1 ml-8">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTool(item.id)}
                    className={`
                      px-4 py-2 text-sm font-normal transition-colors border-2
                      ${activeTool === item.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:border-muted-foreground hover:text-foreground'
                      }
                    `}
                    title={item.description}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <Link to="/">
              <Button variant="outline" size="sm">
                Voltar ao Jogo
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1800px] mx-auto p-6">
        {activeTool === 'pills' && <DistributionSimulator />}
        {activeTool === 'shapes' && <ShapeDistributionSimulator />}
      </main>
    </div>
  )
}
