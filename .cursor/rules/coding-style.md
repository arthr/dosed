# Estilo de Codigo

## Componentes React
- Sempre funcionais com hooks
- Props tipadas com `interface` (nao type inline)
- Desestruturacao de props no parametro
- Componentes pequenos e focados (max ~200 linhas)

```tsx
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}
```

## TypeScript
- Modo strict ativado
- Evitar `any` - usar `unknown` se necessario
- Interfaces para objetos, types para unions/primitivos
- Exportar types junto com componentes relacionados

## Hooks Customizados
- Prefixo `use` obrigatorio
- Retornar objeto nomeado (nao array)
- Documentar com JSDoc se complexo

```tsx
export function useGameActions() {
  const startGame = useGameStore((s) => s.startGame)
  const resetGame = useGameStore((s) => s.resetGame)
  
  return { startGame, resetGame }
}
```

## Zustand Stores
- Um arquivo por store
- Actions e selectors no mesmo arquivo
- Hooks customizados para expor funcionalidades

## Tailwind CSS
- Classes utilitarias diretamente no JSX
- Variaveis CSS para cores do tema
- Evitar inline styles
- Agrupar classes logicamente (layout, spacing, colors)

## Framer Motion
- Variants para animacoes reutilizaveis
- AnimatePresence para enter/exit
- `as const` em transitions para TypeScript
