import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/8bit/button'
import { Input } from '@/components/ui/8bit/input'
import { useMultiplayer } from '@/hooks'

interface JoinRoomFormProps {
  /** Callback quando usuario clica em voltar */
  onBack: () => void
}

/**
 * Formulario para entrar em uma sala multiplayer existente
 */
export function JoinRoomForm({ onBack }: JoinRoomFormProps) {
  const [guestName, setGuestName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { joinRoom } = useMultiplayer()

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Aceita apenas letras e numeros, converte para maiusculo
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setRoomCode(value.slice(0, 6))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = guestName.trim()
    const trimmedCode = roomCode.trim()

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

    if (!trimmedCode) {
      setErrorMessage('Digite o codigo da sala')
      return
    }

    if (trimmedCode.length !== 6) {
      setErrorMessage('Codigo invalido (deve ter 6 caracteres)')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      await joinRoom(trimmedCode, trimmedName)
      // Sucesso - jogo sera iniciado automaticamente
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao entrar na sala'
      setErrorMessage(message)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <label htmlFor="guestName" className="text-sm font-medium">
          Seu nome
        </label>
        <Input
          id="guestName"
          placeholder="Digite seu nome..."
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          disabled={isLoading}
          maxLength={20}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="roomCode" className="text-sm font-medium">
          Codigo da sala
        </label>
        <Input
          id="roomCode"
          placeholder="Ex: ABC123"
          value={roomCode}
          onChange={handleRoomCodeChange}
          disabled={isLoading}
          maxLength={6}
          className="uppercase tracking-widest text-center text-lg"
        />
        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            Conectando...
          </>
        ) : (
          'Entrar na Sala'
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

