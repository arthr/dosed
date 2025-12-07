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
- [x] Criar `src/components/layout/GameLayout.tsx`
- [x] Implementar layout responsivo com header, area de jogadores e mesa
- [x] Aplicar tema dark com variaveis CSS

**Criterio de Aceite:** Layout renderiza estrutura base do jogo [CONCLUIDO]

---

### TASK-012: Criar componente LivesDisplay
- [x] Criar `src/components/game/LivesDisplay.tsx`
- [x] Exibir icones de coracao para cada vida
- [x] Diferenciar vidas ativas de perdidas visualmente
- [x] Props: `lives, maxLives, size, showLabel`

**Criterio de Aceite:** Vidas exibidas corretamente com visual adequado [CONCLUIDO]

---

### TASK-013: Criar componente HealthBar (Resistencia)
- [x] Criar `src/components/game/HealthBar.tsx`
- [x] Barra customizada com cores dinamicas (usa getHealthBarColor)
- [x] Mudar cor baseado em porcentagem (verde > amarelo > vermelho)
- [x] Exibir valores numericos (atual/maximo)
- [x] Props: `current, max, showLabel, showValues, height`

**Criterio de Aceite:** Barra de resistencia com cores dinamicas [CONCLUIDO]

---

### TASK-014: Criar componente PlayerArea
- [x] Criar `src/components/game/PlayerArea.tsx`
- [x] Compor LivesDisplay + HealthBar + nome do jogador
- [x] Indicar visualmente se e o turno do jogador ("Seu turno")
- [x] Props: `player: Player, isCurrentTurn: boolean`

**Criterio de Aceite:** Area do jogador exibe todos os stats [CONCLUIDO]

*Nota: TASK 012-014 implementadas juntas seguindo DRY, refatorando duplicacoes do App.tsx e InfoPanel.tsx*

---

### TASK-015: Criar componente Pill
- [x] Criar `src/components/game/Pill.tsx`
- [x] Implementar visual oculto (cor neutra, icone "?")
- [x] Implementar visual revelado (cor do tipo, label)
- [x] Adicionar estados: hover, selected, disabled
- [x] Usar Framer Motion para animacoes (scale, fade, pulse)
- [x] Props: `pill, onClick, disabled, selected, size`
- [x] Criar `PillGrid` para renderizar lista com animacao escalonada

**Criterio de Aceite:** Pilula renderiza estados oculto/revelado com animacoes [CONCLUIDO]

---

### TASK-016: Criar componente TypeCounter
- [x] Criar `src/components/game/TypeCounter.tsx`
- [x] Exibir contagem de cada tipo de pilula restante
- [x] Ocultar tipos com contagem 0
- [x] Props: `counts: Record<PillType, number>`

**Criterio de Aceite:** Contador exibe tipos restantes na mesa [CONCLUIDO]

*Nota: TASK 015-016 implementadas juntas. App.tsx atualizado para usar PillGrid e TypeCounter.*

---

### TASK-017: Criar componente PillPool
- [x] Criar `src/components/game/PillPool.tsx`
- [x] Renderizar grid de componentes Pill (via PillGrid)
- [x] Incluir TypeCounter
- [x] Permitir selecao de pilula (click handler)
- [x] Props: `pills, typeCounts, onSelectPill, disabled, selectedPillId, instructionMessage`

**Criterio de Aceite:** Mesa exibe pilulas selecionaveis com contador [CONCLUIDO]

---

### TASK-018: Criar componente TurnIndicator
- [x] Criar `src/components/game/TurnIndicator.tsx`
- [x] Exibir de quem e o turno atual
- [x] Exibir instrucao contextual (rodada, "A IA esta pensando...")
- [x] Props: `currentPlayer, round, isHumanTurn`

**Criterio de Aceite:** Indicador mostra turno e fase claramente [CONCLUIDO]

---

### TASK-019: Criar componente GameBoard
- [x] Criar `src/components/game/GameBoard.tsx`
- [x] Compor todos os componentes: PlayerArea (x2), PillPool, TurnIndicator
- [x] Conectar com gameStore via hooks
- [x] Implementar handlers para acoes do jogo

**Criterio de Aceite:** Tabuleiro completo e funcional [CONCLUIDO]

*Nota: App.tsx simplificado de 142 linhas para 75 linhas usando GameBoard*

---

## Fase 5: Integracao e Fluxo do Jogo

### TASK-020: Implementar hooks customizados
- [x] Criar `src/hooks/useGameActions.ts` para encapsular actions do store
- [x] Criar `src/hooks/useGameState.ts` para selectors otimizados
- [x] Criar `src/hooks/index.ts` barrel export
- [x] Atualizar GameBoard.tsx para usar hooks
- [x] Atualizar App.tsx para usar hooks
- [x] Extrair GameOverScreen como componente separado

**Criterio de Aceite:** Hooks funcionam e evitam re-renders desnecessarios [CONCLUIDO]

---

### TASK-021: Implementar fluxo de consumo de pilula
- [x] Conectar click na pilula com action `consumePill`
- [x] Exibir animacao de revelacao antes de aplicar efeito (`PillReveal.tsx`)
- [x] Mostrar feedback visual do efeito (`GameFeedback.tsx`, `AnimatedPlayerArea.tsx`)
- [x] Processar colapso se necessario com animacao (shake no PlayerArea)
- [x] Alternar turno automaticamente apos resolucao
- [x] Adicionar auto-advance e suporte a teclas no overlay
- [x] Criar hook `usePillConsumption` para gerenciar fluxo

**Criterio de Aceite:** Fluxo completo de consumo funciona end-to-end [CONCLUIDO]

---

### TASK-022: Implementar tela de fim de jogo
- [x] Criar `src/components/game/GameOverDialog.tsx` usando Dialog do shadcn/ui
- [x] Adicionar botao para reiniciar jogo com icone
- [x] Exibir estatisticas detalhadas (rodadas, pilulas, colapsos, vidas restantes)
- [x] Adicionar animacoes com Framer Motion (icone, titulo, stats, botao)
- [x] Mostrar resumo visual de vencedor vs perdedor
- [x] Diferenciar vitoria (Trophy dourado) de derrota (Skull vermelho)

**Criterio de Aceite:** Jogo detecta fim e exibe vencedor [CONCLUIDO]

---

### TASK-023: Implementar reset de rodada
- [x] Detectar quando pool de pilulas esta vazio (gameStore.ts linha 217)
- [x] Gerar novo pool automaticamente (resetRound action)
- [x] Manter vidas e resetar resistencia se necessario (conforme GAME-IDEA.md)
- [x] Incrementar contador de rodadas (resetRound action)
- [x] Adicionar feedback visual de nova rodada (NewRoundBanner.tsx)

**Criterio de Aceite:** Nova rodada inicia corretamente [CONCLUIDO]

---

## Fase 6: Polish e Refinamentos

### TASK-024: Adicionar animacoes de feedback
- [x] Animacao de shake no PlayerArea ao receber dano (via AnimatedPlayerArea)
- [x] Transicao suave ao revelar pilula (via PillReveal)
- [x] Animacao de pulse na HealthBar ao mudar valor (spring animation + scale)
- [x] Animacao de bounce nas vidas ao perder uma (AnimatePresence + exit animation)

**Criterio de Aceite:** Feedback visual claro para todas as acoes [CONCLUIDO]

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

