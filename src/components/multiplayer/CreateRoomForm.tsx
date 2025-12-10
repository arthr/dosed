import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/8bit/button'
import { Input } from '@/components/ui/8bit/input'
import { useMultiplayer } from '@/hooks'

interface CreateRoomFormProps {
  /** Callback quando usuario clica em voltar */
  onBack: () => void
}

/**
 * Formulario para criar uma nova sala multiplayer
 */
export function CreateRoomForm({ onBack }: CreateRoomFormProps) {
  const [hostName, setHostName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { createRoom } = useMultiplayer()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = hostName.trim()
    if (!trimmedName) {
      setErrorMessage('Digite seu nome')
      return
    }

    if (trimmedName.length < 2) {
      setErrorMessage('Nome muito curto (minimo 2 caracteres)')
      return
    }

    if (trimmedName.length > 20) {
      setErrorMessage('Nome muito longo (maximo 20 caracteres)')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      await createRoom(trimmedName)
      // Sucesso - WaitingRoom sera exibido automaticamente
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar sala'
      setErrorMessage(message)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <label htmlFor="hostName" className="text-sm font-medium">
          Seu nome
        </label>
        <Input
          id="hostName"
          placeholder="Digite seu nome..."
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          disabled={isLoading}
          maxLength={20}
          autoFocus
        />
        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            Criando sala...
          </>
        ) : (
          'Criar Sala'
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        disabled={isLoading}
      >
        <ArrowLeft className="size-4 mr-2" />
        Voltar
      </Button>
    </form>
  )
}

