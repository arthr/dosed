import { motion } from 'framer-motion'
import { useEffect, useState, useRef, useCallback } from 'react'
import type { Pill } from '@/types'
import { PILL_HEX_COLORS, PILL_LABELS, PILL_DESCRIPTIONS } from '@/utils/constants'

interface PillRevealProps {
  /** Dados da pilula a revelar */
  pill: Pill
  /** Se e turno da IA (countdown mais rapido) */
  isAITurn: boolean
  /** Chamado quando usuario clica ou countdown termina */
  onComplete: () => void
}

// Delays em ms
const HUMAN_DELAY = 5000
const AI_DELAY = 1200

/**
 * Overlay de revelacao de pilula
 * Exibe a pilula revelada com animacao antes de aplicar o efeito
 *
 * - Turno humano: countdown de 5s ou clique para continuar
 * - Turno IA: countdown de 1.2s (mais rapido)
 */
export function PillReveal({ pill, isAITurn, onComplete }: PillRevealProps) {
  const autoAdvanceDelay = isAITurn ? AI_DELAY : HUMAN_DELAY

  // Contador regressivo em segundos
  const [countdown, setCountdown] = useState(Math.ceil(autoAdvanceDelay / 1000))

  // Ref para evitar chamadas multiplas de onComplete
  const hasCompletedRef = useRef(false)
  // Ref para manter referencia estavel de onComplete
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Handler estavel para completar
  const handleComplete = useCallback(() => {
    if (hasCompletedRef.current) return
    hasCompletedRef.current = true
    onCompleteRef.current()
  }, [])

  // Reset quando pill muda (nova pilula)
  useEffect(() => {
    hasCompletedRef.current = false
    setCountdown(Math.ceil(autoAdvanceDelay / 1000))
  }, [pill.id, autoAdvanceDelay])

  // Countdown timer - decrementa a cada segundo
  useEffect(() => {
    if (hasCompletedRef.current || countdown <= 0) return

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown])

  // Auto-advance quando countdown chega a zero
  useEffect(() => {
    if (hasCompletedRef.current || countdown > 0) return

    // Usa setTimeout para garantir que nao chamamos durante render
    const timer = setTimeout(() => {
      handleComplete()
    }, 0)

    return () => clearTimeout(timer)
  }, [countdown, handleComplete])

  // Suporte a tecla para fechar (apenas turno humano)
  useEffect(() => {
    if (isAITurn) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        handleComplete()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAITurn, handleComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`fixed inset-0 bg-black/70 flex items-center justify-center z-40 ${
        isAITurn ? 'cursor-default' : 'cursor-pointer'
      }`}
      onClick={(e) => {
        if (isAITurn) return
        e.stopPropagation()
        handleComplete()
      }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
        className="flex flex-col items-center gap-6"
      >
        {/* Pilula grande revelada */}
        <motion.div
          className="w-32 h-32 rounded-full flex items-center justify-center shadow-2xl"
          style={{ backgroundColor: PILL_HEX_COLORS[pill.type] }}
          animate={{
            boxShadow: [
              `0 0 20px ${PILL_HEX_COLORS[pill.type]}`,
              `0 0 60px ${PILL_HEX_COLORS[pill.type]}`,
              `0 0 20px ${PILL_HEX_COLORS[pill.type]}`,
            ],
          }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <span className="text-4xl font-bold text-white drop-shadow-lg">
            {PILL_LABELS[pill.type].charAt(0)}
          </span>
        </motion.div>

        {/* Info da pilula */}
        <div className="text-center space-y-2">
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-white"
          >
            {PILL_LABELS[pill.type]}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            {PILL_DESCRIPTIONS[pill.type]}
          </motion.p>
          {pill.stats.damage > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-red-400 font-medium"
            >
              Dano: -{pill.stats.damage}
            </motion.p>
          )}
          {pill.stats.heal > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-emerald-400 font-medium"
            >
              Cura: +{pill.stats.heal}
            </motion.p>
          )}
          {pill.stats.livesRestore > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-pink-400 font-medium"
            >
              Vida: +{pill.stats.livesRestore}
            </motion.p>
          )}
        </div>

        {/* Instrucao com contador */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center space-y-1"
        >
          {isAITurn ? (
            <p className="text-sm text-muted-foreground">Processando...</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Avancando em{' '}
                <span className="text-primary font-bold tabular-nums">{countdown}s</span>
              </p>
              <p className="text-xs text-muted-foreground/70">ou clique para continuar</p>
            </>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

