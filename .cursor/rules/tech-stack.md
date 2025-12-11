# Stack Tecnologica

## ⚠️ Restricoes de Dependencias (Refatoracao)

- **Zero Novas Libs:** Nao adicione pacotes npm (ex: lodash, moment, axios) sem aprovacao explicita. Use o que ja esta instalado ou implemente utilitarios nativos.
- **Tailwind-First:** Nao crie arquivos CSS ou SCSS. Nao use styled-components. Tudo deve ser utility classes.
- **Zustand Exclusivo:** Nao introduza Context API ou Redux. Se precisar de estado global, use/estenda os stores existentes.

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

## Backend & Multiplayer (NOVO)
- **BaaS:** Supabase (Auth, Database, Realtime)
- **Multiplayer:** Supabase Realtime (Channels) para sincronizacao de estado.
- **Padrão de Sincronizacao:**
  - O "Dono da Sala" (Host) ou o Servidor (Edge Function) detém a verdade do GameState.
  - Clientes apenas enviam "Intenções" (Actions) e recebem "Estado Atualizado" (Patch).

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
