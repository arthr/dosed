import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/8bit/button'
import { DistributionSimulator } from './DistributionSimulator'

/**
 * Pagina de ferramentas de desenvolvimento
 * Acessivel via /#/dev
 */
export function DevPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-normal text-foreground">
              Dev Tools
            </h1>
            <p className="text-sm text-muted-foreground mt-1 retro">
              Ferramentas de desenvolvimento e calibracao
            </p>
          </div>
          <Link to="/">
            <Button variant="outline">Voltar ao Jogo</Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Distribution Simulator */}
        <DistributionSimulator />
      </div>
    </div>
  )
}

