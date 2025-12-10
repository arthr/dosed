import { motion } from 'framer-motion'
import dosedPill from '/dosed_pill.svg'

interface PillCoinsDisplayProps {
  /** Quantidade de Pill Coins */
  pillCoins: number
  /** Se o jogador sinalizou querer visitar a loja */
  wantsStore: boolean
  /** Callback quando clicado (toggle wantsStore) */
  onToggleStore?: () => void
  /** Se o componente esta desabilitado (ex: IA) */
  disabled?: boolean
}

/**
 * Exibe a quantidade de Pill Coins do jogador
 * Clicavel para sinalizar intencao de visitar a Pill Store
 */
export function PillCoinsDisplay({
  pillCoins,
  wantsStore,
  onToggleStore,
  disabled = false,
}: PillCoinsDisplayProps) {
  const hasCoins = pillCoins > 0
  const canInteract = hasCoins && !disabled && onToggleStore

  // Determina classes baseado no estado
  const getStateClasses = () => {
    if (!hasCoins) {
      return 'opacity-40 grayscale cursor-not-allowed'
    }
    if (wantsStore) {
      return 'cursor-pointer'
    }
    return 'cursor-pointer hover:opacity-80'
  }

  // Tooltip baseado no estado
  const getTooltip = () => {
    if (!hasCoins) return 'Sem Pill Coins - Complete quests para obter'
    if (wantsStore) return 'Clique para cancelar visita a loja'
    return 'Clique para visitar a Pill Store ao fim da rodada'
  }

  const handleClick = () => {
    if (canInteract) {
      onToggleStore()
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={!canInteract}
      title={getTooltip()}
      className={`
        relative flex items-center gap-1.5 px-2 py-1 rounded-md
        transition-all duration-200
        ${getStateClasses()}
        ${wantsStore && hasCoins ? 'bg-amber-500/20 ring-1 ring-amber-500/50' : 'bg-muted/30'}
      `}
      whileHover={canInteract ? { scale: 1.05 } : {}}
      whileTap={canInteract ? { scale: 0.95 } : {}}
    >
      {/* Icone da Pill Coin */}
      <div className="relative">
        <img
          src={dosedPill}
          alt="Pill Coin"
          className="w-5 h-5"
          draggable={false}
        />
        
        {/* Glow quando wantsStore esta ativo */}
        {wantsStore && hasCoins && (
          <motion.div
            className="absolute inset-0 rounded-full bg-amber-400/40 blur-sm"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      {/* Contador */}
      <span
        className={`
          text-xs font-bold tabular-nums
          ${hasCoins ? 'text-amber-400' : 'text-muted-foreground'}
        `}
      >
        {pillCoins}
      </span>

      {/* Indicador de "quer ir a loja" */}
      {wantsStore && hasCoins && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"
        />
      )}
    </motion.button>
  )
}

