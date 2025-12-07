# Stack Tecnologica

## Core
- **Framework:** React 18+ (hooks funcionais)
- **Build Tool:** Vite
- **Linguagem:** TypeScript (strict mode)
- **Package Manager:** pnpm

## UI e Estilizacao
- **CSS Framework:** Tailwind CSS v4
- **Componentes Base:** shadcn/ui
- **Componentes Retro:** 8bit/ui (visual pixelado)
- **Animacoes:** Framer Motion

## Estado e Logica
- **State Management:** Zustand (stores modulares)
- **Game Logic:** Funcoes puras em `src/utils/`
- **Custom Hooks:** Encapsulam acoes e selectors do Zustand

## Arquitetura de Estado
```
gameStore     -> Estado principal do jogo (players, pills, phase, round)
toastStore    -> Fila de notificacoes (non-blocking)
overlayStore  -> Stack de overlays (blocking: PillReveal, GameOver, NewRound)
```

## Fluxo de Dados
1. Usuario interage com componente
2. Hook dispara action do store
3. Store atualiza estado
4. Componentes re-renderizam via selectors
5. Animacoes Framer Motion respondem a mudancas

## Convencoes
- Preferir composicao sobre heranca
- Separar logica de UI (hooks vs componentes)
- Manter stores pequenos e focados
- Usar TypeScript para todas as interfaces
