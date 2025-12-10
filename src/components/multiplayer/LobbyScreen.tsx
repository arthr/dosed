import { useState } from 'react'
import { ArrowLeft, Users, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/8bit/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/8bit/card'
import { CreateRoomForm } from './CreateRoomForm'
import { JoinRoomForm } from './JoinRoomForm'

type LobbyView = 'menu' | 'create' | 'join'

interface LobbyScreenProps {
  /** Callback quando usuario cancela e volta para single player */
  onBack?: () => void
}

/**
 * Tela de lobby multiplayer
 * Permite criar ou entrar em uma sala
 */
export function LobbyScreen({ onBack }: LobbyScreenProps) {
  const [view, setView] = useState<LobbyView>('menu')

  const handleBack = () => {
    if (view === 'menu') {
      onBack?.()
    } else {
      setView('menu')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {view === 'menu' && 'Multiplayer'}
            {view === 'create' && 'Criar Sala'}
            {view === 'join' && 'Entrar em Sala'}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {view === 'menu' && (
            <>
              <p className="text-center text-muted-foreground text-sm mb-4">
                Jogue contra um amigo online
              </p>

              <Button
                className="w-full justify-start gap-3 h-14"
                onClick={() => setView('create')}
              >
                <UserPlus className="size-5" />
                <div className="flex flex-col items-start">
                  <span>Criar Sala</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Gere um codigo para seu amigo
                  </span>
                </div>
              </Button>

              <Button
                className="w-full justify-start gap-3 h-14"
                variant="outline"
                onClick={() => setView('join')}
              >
                <Users className="size-5" />
                <div className="flex flex-col items-start">
                  <span>Entrar em Sala</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Use o codigo do seu amigo
                  </span>
                </div>
              </Button>

              {onBack && (
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={handleBack}
                >
                  <ArrowLeft className="size-4 mr-2" />
                  Voltar
                </Button>
              )}
            </>
          )}

          {view === 'create' && (
            <CreateRoomForm onBack={() => setView('menu')} />
          )}

          {view === 'join' && (
            <JoinRoomForm onBack={() => setView('menu')} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

