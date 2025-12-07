import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function App() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 gap-8">
        <h1 className="text-4xl font-bold text-foreground">
          Side Effects - Pill Roulette
        </h1>

        <p className="text-muted-foreground">
          shadcn/ui + Tailwind CSS v4 configurados!
        </p>

        {/* Test shadcn Components */}
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Player 1</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lives */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Vidas:</span>
              <div className="flex gap-1">
                <span className="text-health-full text-xl">&#9829;</span>
                <span className="text-health-full text-xl">&#9829;</span>
                <span className="text-muted-foreground text-xl">&#9825;</span>
              </div>
            </div>

            {/* Resistance Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Resistencia</span>
                <span className="text-foreground">4/6</span>
              </div>
              <Progress value={66} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Pill Types with Badges */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-pill-safe hover:bg-pill-safe/80">SAFE</Badge>
            </TooltipTrigger>
            <TooltipContent>Placebo - Sem efeito</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-pill-dmg-low hover:bg-pill-dmg-low/80">DMG LOW</Badge>
            </TooltipTrigger>
            <TooltipContent>Veneno - Dano 1-2</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-pill-dmg-high hover:bg-pill-dmg-high/80">DMG HIGH</Badge>
            </TooltipTrigger>
            <TooltipContent>Toxina - Dano 3-4</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-pill-fatal hover:bg-pill-fatal/80">FATAL</Badge>
            </TooltipTrigger>
            <TooltipContent>Cianeto - Morte instantanea!</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-pill-heal hover:bg-pill-heal/80">HEAL</Badge>
            </TooltipTrigger>
            <TooltipContent>Antidoto - Cura +2</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="bg-pill-hidden">???</Badge>
            </TooltipTrigger>
            <TooltipContent>Pilula oculta</TooltipContent>
          </Tooltip>
        </div>

        {/* Test Buttons */}
        <div className="flex gap-4">
          <Button>Iniciar Jogo</Button>
          <Button variant="secondary">Regras</Button>
          <Button variant="destructive">Sair</Button>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default App
