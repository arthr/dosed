import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useItemUsage } from '@/hooks'
import { ITEM_CATALOG } from '@/utils/itemCatalog'
import type { ItemType } from '@/types'

/**
 * Instrucoes contextuais por tipo de item
 */
const TARGET_INSTRUCTIONS: Record<ItemType, string> = {
  // Intel (alvo: pilula)
  scanner: 'Clique em uma pilula para revelar seu tipo',
  inverter: 'Clique em uma pilula para inverter seu efeito',
  double: 'Clique em uma pilula para dobrar seu efeito',
  // Sustain (alvo: self - execucao imediata)
  pocket_pill: 'Aplicando cura...',
  shield: 'Ativando escudo...',
  // Control (alvo: oponente)
  handcuffs: 'Aplicando algemas no oponente...',
  force_feed: 'Clique em uma pilula para forcar o oponente a consumir',
  // Chaos
  shuffle: 'Embaralhando pilulas...',
  discard: 'Clique em uma pilula para descarta-la',
}

/**
 * Overlay de selecao de alvo para itens
 * Exibe instrucoes contextuais e botao de cancelar
 */
export function ItemTargetSelector() {
  const { isSelectingTarget, selectedItemType, cancelUsage } = useItemUsage()

  // Obtem dados do item selecionado
  const itemDef = selectedItemType ? ITEM_CATALOG[selectedItemType] : null
  const instruction = selectedItemType
    ? TARGET_INSTRUCTIONS[selectedItemType] || 'Selecione um alvo'
    : ''

  return (
    <AnimatePresence>
      {isSelectingTarget && itemDef && (
        <motion.div
          className="fixed inset-0 z-40 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overlay escuro nas bordas (nao bloqueia cliques no centro) */}
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />

          {/* Painel de instrucoes no topo */}
          <motion.div
            className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-card border-2 border-primary rounded-lg px-6 py-3 shadow-lg">
              <div className="flex items-center gap-4">
                {/* Nome do item */}
                <span className={`font-bold ${itemDef.color}`}>
                  {itemDef.name}
                </span>

                {/* Separador */}
                <div className="w-px h-6 bg-border" />

                {/* Instrucao */}
                <span className="text-foreground">{instruction}</span>

                {/* Separador */}
                <div className="w-px h-6 bg-border" />

                {/* Botao cancelar */}
                <button
                  onClick={cancelUsage}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm font-medium">Cancelar</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Indicador visual de modo ativo */}
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="bg-primary/20 border border-primary/50 rounded-full px-4 py-2">
              <span className="text-primary text-sm font-medium animate-pulse">
                Selecione o alvo...
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
