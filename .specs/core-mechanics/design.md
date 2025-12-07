# Design: Mecânica Central - Dosed (Pill Roulette)

## 1. Stack Tecnológico

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| Build Tool | **Vite** | Hot reload rápido, suporte nativo a TypeScript |
| Framework | **React 18+** | Componentização, hooks, gerenciamento de estado |
| Linguagem | **TypeScript** | Type safety, melhor DX e manutenibilidade |
| UI Components | **shadcn/ui** | Componentes acessíveis, customizáveis, baseados em Radix |
| Styling | **Tailwind CSS** | Utility-first, integrado com shadcn/ui |
| State Management | **Zustand** | Leve, sem boilerplate, ideal para game state |
| Animações | **Framer Motion** | Animações declarativas para feedback visual |

---

## 2. Arquitetura de Componentes

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── game/
│   │   ├── GameBoard.tsx      # Container principal do jogo
│   │   ├── PlayerArea.tsx     # Stats do jogador (vidas, resistência)
│   │   ├── PillPool.tsx       # Mesa com pílulas selecionáveis
│   │   ├── Pill.tsx           # Componente individual de pílula
│   │   ├── HealthBar.tsx      # Barra de resistência
│   │   ├── LivesDisplay.tsx   # Display de vidas
│   │   ├── TypeCounter.tsx    # Contador de tipos no pool
│   │   └── TurnIndicator.tsx  # Indicador de turno
│   └── layout/
│       └── GameLayout.tsx     # Layout base do jogo
├── stores/
│   └── gameStore.ts           # Zustand store para estado do jogo
├── types/
│   ├── pill.ts                # Tipos das pílulas
│   ├── player.ts              # Tipos do jogador
│   └── game.ts                # Tipos do estado do jogo
├── utils/
│   ├── pillGenerator.ts       # Lógica de geração de pílulas
│   ├── gameLogic.ts           # Lógica central do jogo
│   └── constants.ts           # Constantes configuráveis
├── hooks/
│   ├── useGameActions.ts      # Actions do jogo
│   └── useGameState.ts        # Selectors do estado
└── App.tsx
```

---

## 3. Modelagem de Dados (TypeScript)

### 3.1 Tipos de Pílula

```typescript
// types/pill.ts

export type PillType = 'SAFE' | 'DMG_LOW' | 'DMG_HIGH' | 'FATAL' | 'HEAL';

export type PillShape = 'capsule' | 'round' | 'triangle' | 'oval';

export interface PillStats {
  damage: number;      // 0 para SAFE/HEAL, 1-2 para DMG_LOW, 3-4 para DMG_HIGH, 999 para FATAL
  isFatal: boolean;    // true apenas para FATAL
  heal: number;        // 0 para não-cura, 2+ para HEAL
}

export interface PillVisuals {
  color: string;       // Cor real (revelada) ou cor genérica (oculta)
  shape: PillShape;
  label: string;       // "Unknown" quando oculta, tipo real quando revelada
}

export interface Pill {
  id: string;
  type: PillType;
  isRevealed: boolean;
  stats: PillStats;
  visuals: PillVisuals;
}
```

### 3.2 Tipos do Jogador

```typescript
// types/player.ts

export type PlayerId = 'player1' | 'player2';

export interface Player {
  id: PlayerId;
  name: string;
  lives: number;
  maxLives: number;
  resistance: number;
  maxResistance: number;
  isAI: boolean;
}
```

### 3.3 Estado do Jogo

```typescript
// types/game.ts

export type GamePhase = 'setup' | 'playing' | 'ended';
export type TurnPhase = 'items' | 'consume' | 'resolution';

export interface GameState {
  phase: GamePhase;
  turnPhase: TurnPhase;
  currentTurn: PlayerId;
  players: Record<PlayerId, Player>;
  pillPool: Pill[];
  typeCounts: Record<PillType, number>;  // Contagem pública
  round: number;
  winner: PlayerId | null;
}
```

---

## 4. Store (Zustand)

```typescript
// stores/gameStore.ts

interface GameStore extends GameState {
  // Actions
  initGame: (config: GameConfig) => void;
  consumePill: (pillId: string) => void;
  revealPill: (pillId: string) => void;
  applyDamage: (playerId: PlayerId, amount: number) => void;
  applyHeal: (playerId: PlayerId, amount: number) => void;
  processCollapse: (playerId: PlayerId) => void;
  nextTurn: () => void;
  resetRound: () => void;
  
  // Computed (via selectors)
  getCurrentPlayer: () => Player;
  getOpponent: () => Player;
  isPillPoolEmpty: () => boolean;
}
```

---

## 5. Fluxo de Lógica do Jogo

### 5.1 Consumo de Pílula

```
[Jogador seleciona pílula]
        ↓
[Revelar pílula (isRevealed = true)]
        ↓
[Determinar tipo e efeito]
        ↓
    ┌───┴───┐
    │       │
  DANO    CURA
    ↓       ↓
[Reduzir Resistência]  [Aumentar Resistência (cap no max)]
    ↓
[Resistência <= 0?]
    │
    ├── SIM → [Processo de Colapso]
    │              ↓
    │         [Perder 1 Vida]
    │              ↓
    │         [Vidas <= 0?]
    │              │
    │         SIM──┴──NÃO
    │          ↓       ↓
    │     [FIM JOGO] [Reset Resistência]
    │
    └── NÃO → [Remover pílula do pool]
                   ↓
              [Pool vazio?]
                   │
              SIM──┴──NÃO
               ↓       ↓
          [Nova Rodada] [Próximo Turno]
```

### 5.2 Cálculo de Colapso

```typescript
function processCollapse(player: Player): Player {
  const newLives = player.lives - 1;
  
  if (newLives <= 0) {
    return { ...player, lives: 0, resistance: 0 };  // Game Over
  }
  
  // Reset com penalidade opcional
  const newMaxResistance = Math.max(player.maxResistance - 1, 3);
  return {
    ...player,
    lives: newLives,
    resistance: newMaxResistance,
    maxResistance: newMaxResistance,
  };
}
```

---

## 6. Design Visual (UI/UX)

### 6.1 Layout Principal

```
┌─────────────────────────────────────────────────────┐
│                   [GAME HEADER]                     │
│                  Dosed - Round 1                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐                 ┌─────────────┐    │
│  │  PLAYER 1   │                 │    PLAYER 2 │    │
│  │  ♥ ♥ ♥      │                 │       ♥ ♥ ♥ │    │
│  │ [████░░] 4/6│                 │ 4/6 [████░░]│    │
│  └─────────────┘                 └─────────────┘    │
│                                                     │
│            ┌───────────────────────┐                │
│            │    PILL POOL (MESA)   │                │
│            │                       │                │
│            │   (?) (?) (?) (?)     │                │
│            │      (?) (?)          │                │
│            │                       │                │
│            │  Poison: 3 | Safe: 2  │                │
│            │  Heal: 1              │                │
│            └───────────────────────┘                │
│                                                     │
│          [TURN: Player 1 - Select a pill]           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 6.2 Estados Visuais da Pílula

| Estado | Aparência |
|--------|-----------|
| **Oculta** | Cor neutra (cinza/escuro), ícone "?", sem label |
| **Revelada** | Cor do tipo, ícone específico, label do tipo |
| **Hover** | Escala aumentada, borda highlight |
| **Selecionada** | Animação de pulse, borda accent |
| **Consumida** | Fade out + scale down |

### 6.3 Paleta de Cores (Sugestão Dark Theme)

```css
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #1a1a2e;
  --accent: #6366f1;
  
  /* Pill Colors */
  --pill-safe: #22c55e;      /* Verde */
  --pill-dmg-low: #f59e0b;   /* Amarelo/Laranja */
  --pill-dmg-high: #ef4444;  /* Vermelho */
  --pill-fatal: #7c3aed;     /* Roxo */
  --pill-heal: #06b6d4;      /* Ciano */
  --pill-hidden: #374151;    /* Cinza */
  
  /* Status */
  --health-full: #22c55e;
  --health-mid: #f59e0b;
  --health-low: #ef4444;
}
```

---

## 7. Componentes shadcn/ui Utilizados

| Componente | Uso |
|------------|-----|
| `Button` | Ações, seleção de pílula |
| `Card` | Área do jogador, pool de pílulas |
| `Progress` | Barra de resistência |
| `Badge` | Contador de tipos, indicadores |
| `Tooltip` | Informações de hover |
| `Dialog` | Modais de fim de jogo, confirmações |
| `Alert` | Notificações de eventos (colapso, vitória) |

---

## 8. Considerações de Performance

1. **Memoização**: Usar `React.memo` em componentes de pílula para evitar re-renders
2. **Selectors Zustand**: Usar selectors específicos para evitar re-renders desnecessários
3. **Animações**: Usar `will-change` e `transform` para animações performáticas
4. **Keys estáveis**: Usar IDs únicos das pílulas como keys

---

## 9. Extensibilidade Futura

O design permite fácil adição de:
- Novos tipos de pílulas (adicionar ao enum e factory)
- Sistema de itens (novo slice no store)
- Modo multiplayer (abstrair Player, adicionar networking layer)
- Temas visuais (CSS variables + theme provider)

