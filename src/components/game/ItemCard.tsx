import { motion } from 'framer-motion'
import type { ItemDefinition, ItemType } from '@/types'
import { ITEM_CATALOG, CATEGORY_HEX_COLORS, CATEGORY_BG_COLORS } from '@/utils/itemCatalog'
import { ItemIcon } from './ItemIcon'
import { cn } from '@/lib/utils'

interface ItemCardProps {
  item: ItemType | ItemDefinition
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: {
    card: 'size-24',
    icon: 54,
    text: 'text-[10px] h-6',
  },
  md: {
    card: 'size-32',
    icon: 72, 
    text: 'text-xs h-8',
  },
  lg: {
    card: 'size-40',
    icon: 90,
    text: 'text-sm h-10',
  },
}

export function ItemCard({
  item,
  selected = false,
  disabled = false,
  onClick,
  size = 'md',
}: ItemCardProps) {
  const itemDef = typeof item === 'string' ? ITEM_CATALOG[item] : item
  const sizeConfig = sizeClasses[size]
  
  // Cor hex da categoria para estilos dinamicos
  const categoryHexColor = CATEGORY_HEX_COLORS[itemDef.category]
  const categoryBgColorClass = CATEGORY_BG_COLORS[itemDef.category]

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      // Layout Base
      className={cn(
        sizeConfig.card,
        "relative group overflow-hidden flex items-center justify-center",
        "border-2 transition-all duration-200 rounded-none", // Rounded-none para 8-bit puro
        // Cores e Bordas
        "bg-card/50 backdrop-blur-sm", // Fundo base escuro
        disabled 
          ? "opacity-50 grayscale cursor-not-allowed border-muted/20" 
          : "cursor-pointer hover:brightness-110",
        selected
          ? "border-primary ring-2 ring-primary/50 ring-offset-2 ring-offset-background z-10" // Portal Green glow
          : "border-border hover:border-primary/50",
        // Fundo sutil colorido baseado na categoria
        !disabled && !selected && categoryBgColorClass
      )}
      // Animações
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {/* 1. Camada do Icone (Centralizado e Grande) */}
      <div className="absolute inset-0 flex items-center justify-center pb-4">
        <motion.div
            animate={selected ? { y: [0, -4, 0] } : {}}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
            <ItemIcon 
              type={itemDef.type} 
              size={sizeConfig.icon}
              className="border-2 shadow-md"
              style={{ borderColor: categoryHexColor }}
            />
        </motion.div>
      </div>

      {/* 2. Camada de Texto (Overlay no fundo) */}
      <div 
        className={cn(
            "absolute bottom-0 inset-x-0 flex items-center justify-center",
            "border-t border-white/10", // Linha sutil separando
            sizeConfig.text,
            selected ? "bg-primary text-primary-foreground" : "bg-black/60 text-white",
            "font-mono uppercase tracking-wider transition-colors duration-200"
        )}
      >
        <span className="truncate px-1 font-bold drop-shadow-md">
            {itemDef.name}
        </span>
      </div>

      {/* 3. Badge de Categoria (Canto Superior) */}
      <div className={cn(
        "absolute top-0 right-0 p-1",
        disabled ? "opacity-0" : "opacity-100"
      )}>
         <div 
           className="size-2" 
           style={{ backgroundColor: categoryHexColor }} 
         />
      </div>

    </motion.button>
  )
}