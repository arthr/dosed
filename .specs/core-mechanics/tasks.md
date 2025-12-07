# Tarefas: Mecânica Central - Side Effects (Pill Roulette)

## Legenda de Status
- [ ] Pendente
- [x] Concluída
- [~] Em progresso

---

## Fase 1: Setup do Projeto

### TASK-001: Inicializar projeto Vite + React + TypeScript
- [x] Criar projeto com `pnpm create vite@latest side-effects -- --template react-ts`
- [x] Configurar `tsconfig.json` com strict mode
- [x] Configurar path aliases (`@/` para `src/`)
- [x] Instalar e configurar ESLint + Prettier

**Critério de Aceite:** Projeto compila sem erros e abre no browser [CONCLUIDO]

---

### TASK-002: Configurar Tailwind CSS
- [x] Instalar Tailwind CSS v4 com `@tailwindcss/vite` plugin
- [x] Configurar plugin no `vite.config.ts`
- [x] Adicionar variaveis CSS para cores do jogo via `@theme`
- [x] Configurar `index.css` com `@import "tailwindcss"` e custom utilities

**Critério de Aceite:** Classes Tailwind funcionam no projeto [CONCLUIDO]

---

### TASK-003: Configurar shadcn/ui
- [x] Executar `pnpm dlx shadcn@latest init` (com Tailwind v4)
- [x] Configurar `components.json` com aliases corretos (style: new-york)
- [x] Instalar componentes base: Button, Card, Progress, Badge, Tooltip, Dialog, Alert

**Critério de Aceite:** Componentes shadcn renderizam corretamente [CONCLUIDO]

---

### TASK-004: Instalar dependencias adicionais
- [x] Instalar Zustand v5.0.9 para state management
- [x] Instalar Framer Motion v12.23.25 para animacoes
- [x] Instalar uuid v13.0.0 para geracao de IDs unicos (tipos inclusos)

**Criterio de Aceite:** Dependencias instaladas e importaveis [CONCLUIDO]

---

## Fase 2: Estrutura de Tipos e Dados

### TASK-005: Criar tipos TypeScript base
- [x] Criar `src/types/pill.ts` com interfaces Pill, PillType, PillStats, PillVisuals, PillConfig
- [x] Criar `src/types/player.ts` com interface Player, PlayerId, PlayerConfig, PlayerEffectResult
- [x] Criar `src/types/game.ts` com GameState, GamePhase, TurnPhase, GameConfig, GameStats
- [x] Exportar todos os tipos via `src/types/index.ts`

**Criterio de Aceite:** Tipos compilam sem erros e sao exportados corretamente [CONCLUIDO]

---

### TASK-006: Criar constantes e configuracoes
- [x] Criar `src/utils/constants.ts` com valores default (vidas, resistencia, probabilidades)
- [x] Definir configuracao de tipos de pilulas (dano, cura, cores)
- [x] Criar mapa de cores e labels para cada PillType

**Criterio de Aceite:** Constantes exportadas e tipadas corretamente [CONCLUIDO]

---

## Fase 3: Lógica do Jogo (Game Logic)

### TASK-007: Implementar gerador de pilulas
- [x] Criar `src/utils/pillGenerator.ts`
- [x] Implementar funcao `generatePillPool(config)` que retorna array de Pill[]
- [x] Implementar distribuicao baseada em probabilidades configuraveis
- [x] Garantir que cada pilula tem ID unico (uuid) e `isRevealed: false`

**Criterio de Aceite:** Funcao gera pool valido conforme configuracao [CONCLUIDO]

---

### TASK-008: Implementar logica de efeitos das pilulas
- [x] Criar `src/utils/gameLogic.ts`
- [x] Implementar `applyPillEffect(pill, player)` que retorna novo estado do player
- [x] Implementar logica para cada tipo: SAFE, DMG_LOW, DMG_HIGH, FATAL, HEAL
- [x] Implementar cap de resistencia no maximo para cura

**Criterio de Aceite:** Cada tipo de pilula aplica efeito correto [CONCLUIDO]

---

### TASK-009: Implementar logica de colapso
- [x] Implementar `checkCollapse(player)` que verifica se resistencia <= 0
- [x] Implementar `processCollapse(player)` que reduz vida e reseta resistencia
- [x] Implementar `checkGameOver(player)` que verifica se vidas <= 0

**Criterio de Aceite:** Colapso processa corretamente e detecta game over [CONCLUIDO]
*Nota: Implementado junto com TASK-008 em `src/utils/gameLogic.ts`*

---

### TASK-010: Implementar Zustand Store
- [x] Criar `src/stores/gameStore.ts`
- [x] Implementar estado inicial com dois jogadores e pool vazio
- [x] Implementar action `initGame(config)` para setup inicial
- [x] Implementar action `consumePill(pillId)` com toda logica de turno
- [x] Implementar action `revealPillById(pillId)` para revelar pilula
- [x] Implementar action `nextTurn()` para alternar turno
- [x] Implementar action `resetRound()` para nova rodada
- [x] Implementar selectors para current player, opponent, type counts

**Criterio de Aceite:** Store gerencia estado completo do jogo corretamente [CONCLUIDO]

---

## Fase 4: Componentes de UI

### TASK-011: Criar componente GameLayout
- [ ] Criar `src/components/layout/GameLayout.tsx`
- [ ] Implementar layout responsivo com header, área de jogadores e mesa
- [ ] Aplicar tema dark com variáveis CSS

**Critério de Aceite:** Layout renderiza estrutura base do jogo

---

### TASK-012: Criar componente LivesDisplay
- [ ] Criar `src/components/game/LivesDisplay.tsx`
- [ ] Exibir ícones de coração/desfibrilador para cada vida
- [ ] Diferenciar vidas ativas de perdidas visualmente
- [ ] Props: `lives: number, maxLives: number`

**Critério de Aceite:** Vidas exibidas corretamente com visual adequado

---

### TASK-013: Criar componente HealthBar (Resistência)
- [ ] Criar `src/components/game/HealthBar.tsx`
- [ ] Usar shadcn Progress como base
- [ ] Mudar cor baseado em porcentagem (verde > amarelo > vermelho)
- [ ] Exibir valores numéricos (atual/máximo)
- [ ] Props: `current: number, max: number`

**Critério de Aceite:** Barra de resistência com cores dinâmicas

---

### TASK-014: Criar componente PlayerArea
- [ ] Criar `src/components/game/PlayerArea.tsx`
- [ ] Compor LivesDisplay + HealthBar + nome do jogador
- [ ] Indicar visualmente se é o turno do jogador
- [ ] Props: `player: Player, isCurrentTurn: boolean`

**Critério de Aceite:** Área do jogador exibe todos os stats

---

### TASK-015: Criar componente Pill
- [ ] Criar `src/components/game/Pill.tsx`
- [ ] Implementar visual oculto (cor neutra, ícone "?")
- [ ] Implementar visual revelado (cor do tipo, label)
- [ ] Adicionar estados: hover, selected, disabled
- [ ] Usar Framer Motion para animações
- [ ] Props: `pill: Pill, onClick: () => void, disabled: boolean`

**Critério de Aceite:** Pílula renderiza estados oculto/revelado com animações

---

### TASK-016: Criar componente TypeCounter
- [ ] Criar `src/components/game/TypeCounter.tsx`
- [ ] Exibir contagem de cada tipo de pílula restante
- [ ] Usar Badge do shadcn para cada tipo
- [ ] Props: `counts: Record<PillType, number>`

**Critério de Aceite:** Contador exibe tipos restantes na mesa

---

### TASK-017: Criar componente PillPool
- [ ] Criar `src/components/game/PillPool.tsx`
- [ ] Renderizar grid de componentes Pill
- [ ] Incluir TypeCounter
- [ ] Permitir seleção de pílula (click handler)
- [ ] Props: `pills: Pill[], onSelectPill: (id: string) => void, disabled: boolean`

**Critério de Aceite:** Mesa exibe pílulas selecionáveis com contador

---

### TASK-018: Criar componente TurnIndicator
- [ ] Criar `src/components/game/TurnIndicator.tsx`
- [ ] Exibir de quem é o turno atual
- [ ] Exibir instrução contextual ("Selecione uma pílula")
- [ ] Props: `currentPlayer: Player, phase: TurnPhase`

**Critério de Aceite:** Indicador mostra turno e fase claramente

---

### TASK-019: Criar componente GameBoard
- [ ] Criar `src/components/game/GameBoard.tsx`
- [ ] Compor todos os componentes: PlayerArea (x2), PillPool, TurnIndicator
- [ ] Conectar com gameStore via hooks
- [ ] Implementar handlers para ações do jogo

**Critério de Aceite:** Tabuleiro completo e funcional

---

## Fase 5: Integração e Fluxo do Jogo

### TASK-020: Implementar hooks customizados
- [ ] Criar `src/hooks/useGameActions.ts` para encapsular actions do store
- [ ] Criar `src/hooks/useGameState.ts` para selectors otimizados

**Critério de Aceite:** Hooks funcionam e evitam re-renders desnecessários

---

### TASK-021: Implementar fluxo de consumo de pílula
- [ ] Conectar click na pílula com action `consumePill`
- [ ] Exibir animação de revelação antes de aplicar efeito
- [ ] Mostrar feedback visual do efeito (dano vermelho, cura verde)
- [ ] Processar colapso se necessário com animação
- [ ] Alternar turno automaticamente após resolução

**Critério de Aceite:** Fluxo completo de consumo funciona end-to-end

---

### TASK-022: Implementar tela de fim de jogo
- [ ] Criar Dialog para exibir vencedor
- [ ] Adicionar botão para reiniciar jogo
- [ ] Exibir estatísticas básicas (rodadas, pílulas consumidas)

**Critério de Aceite:** Jogo detecta fim e exibe vencedor

---

### TASK-023: Implementar reset de rodada
- [ ] Detectar quando pool de pílulas está vazio
- [ ] Gerar novo pool automaticamente
- [ ] Manter vidas e resetar resistência se necessário
- [ ] Incrementar contador de rodadas

**Critério de Aceite:** Nova rodada inicia corretamente

---

## Fase 6: Polish e Refinamentos

### TASK-024: Adicionar animações de feedback
- [ ] Animação de shake no PlayerArea ao receber dano
- [ ] Animação de pulse na HealthBar ao mudar valor
- [ ] Animação de bounce nas vidas ao perder uma
- [ ] Transição suave ao revelar pílula

**Critério de Aceite:** Feedback visual claro para todas as ações

---

### TASK-025: Implementar sons (opcional)
- [ ] Som ao consumir pílula
- [ ] Som de dano/colapso
- [ ] Som de cura
- [ ] Som de vitória/derrota

**Critério de Aceite:** Sons opcionais com controle de volume

---

### TASK-026: Testes manuais e ajustes
- [ ] Testar todos os tipos de pílula
- [ ] Testar cenário de colapso
- [ ] Testar cenário de game over
- [ ] Testar reset de rodada
- [ ] Verificar responsividade
- [ ] Ajustar balanceamento se necessário

**Critério de Aceite:** Jogo funciona sem bugs em todos os cenários

---

## Resumo de Dependências entre Tarefas

```
TASK-001 → TASK-002 → TASK-003 → TASK-004
                ↓
           TASK-005 → TASK-006
                ↓
    ┌──────────┼──────────┐
    ↓          ↓          ↓
TASK-007  TASK-008  TASK-009
    └──────────┴──────────┘
                ↓
           TASK-010
                ↓
    ┌──────────┴──────────┐
    ↓                     ↓
TASK-011            TASK-012 → TASK-013 → TASK-014
    ↓                              ↓
TASK-015 → TASK-016 → TASK-017 → TASK-018
                ↓
           TASK-019
                ↓
           TASK-020 → TASK-021 → TASK-022 → TASK-023
                                      ↓
                              TASK-024 → TASK-025 → TASK-026
```

---

## Estimativa de Tempo

| Fase | Tarefas | Tempo Estimado |
|------|---------|----------------|
| 1. Setup | 001-004 | 1-2 horas |
| 2. Tipos | 005-006 | 30 min |
| 3. Lógica | 007-010 | 2-3 horas |
| 4. UI | 011-019 | 3-4 horas |
| 5. Integração | 020-023 | 2-3 horas |
| 6. Polish | 024-026 | 1-2 horas |

**Total Estimado:** 10-15 horas de desenvolvimento

