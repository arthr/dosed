import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/8bit/card'
import { Badge } from '@/components/ui/8bit/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/8bit/tooltip'
import { LivesDisplay } from './LivesDisplay'
import { HealthBar } from './HealthBar'

/**
 * Painel informativo com demonstracao dos elementos do jogo
 * Sera usado como base para tutorial/onboarding no futuro
 */
export function InfoPanel() {
  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Como Jogar
        </h2>
        <p className="text-muted-foreground text-sm max-w-md">
          Um jogo de estrategia por turnos onde dois jogadores competem 
          para ser o ultimo sobrevivente atraves da gestao de risco.
        </p>
      </div>

      {/* Player Stats Example */}
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Seus Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lives - usando componente reutilizavel */}
          <div className="flex items-center justify-between">
            <LivesDisplay lives={2} maxLives={3} />
            <span className="text-xs text-muted-foreground">
              Perder todas = Game Over
            </span>
          </div>

          {/* Resistance Bar - usando componente reutilizavel */}
          <div className="space-y-1">
            <HealthBar current={4} max={6} height="lg" />
            <p className="text-xs text-muted-foreground">
              Ao zerar, voce perde 1 vida e reseta a barra
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pill Types Legend */}
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tipos de Pilulas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 justify-center">
            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-pill-safe hover:bg-pill-safe/80 cursor-help">
                  SAFE
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Placebo - Sem efeito</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-pill-dmg-low hover:bg-pill-dmg-low/80 cursor-help">
                  VENENO
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Dano baixo: -1 ou -2</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-pill-dmg-high hover:bg-pill-dmg-high/80 cursor-help">
                  TOXINA
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Dano alto: -3 ou -4</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-pill-fatal hover:bg-pill-fatal/80 cursor-help">
                  FATAL
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Zera resistencia instantaneamente!</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <Badge className="bg-pill-heal hover:bg-pill-heal/80 cursor-help">
                  CURA
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Antidoto: +2 de resistencia</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" className="bg-pill-hidden cursor-help">
                  ???
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Pilula oculta - tipo desconhecido</TooltipContent>
            </Tooltip>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3">
            Voce ve a contagem total de cada tipo, mas nao sabe qual e qual!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
