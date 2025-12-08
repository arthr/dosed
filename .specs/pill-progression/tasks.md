# Tasks: Sistema de Progressao Dinamica de Pilulas

## Legenda
- `[ ]` Pendente
- `[x]` Concluido
- `[~]` Em andamento
- `[-]` Cancelado

---

## Fase 1: Preparacao de Tipos (Foundation)

### 1.1 Extensao do Sistema de Tipos

- [ ] TASK-PP-001: Adicionar tipo `LIFE` ao enum `PillType` em `src/types/pill.ts`
- [ ] TASK-PP-002: Adicionar campo `livesRestore` ao `PillStats` em `src/types/pill.ts`
- [ ] TASK-PP-003: Adicionar campo `livesRestored` ao `PlayerEffectResult` em `src/types/player.ts`

### 1.2 Constantes e Configuracoes

- [ ] TASK-PP-004: Adicionar `LIFE` ao `PILL_COLORS` em `src/utils/constants.ts`
- [ ] TASK-PP-005: Adicionar `LIFE` ao `PILL_HEX_COLORS` em `src/utils/constants.ts`
- [ ] TASK-PP-006: Adicionar `LIFE` ao `PILL_LABELS` em `src/utils/constants.ts`
- [ ] TASK-PP-007: Adicionar `LIFE` ao `PILL_DESCRIPTIONS` em `src/utils/constants.ts`
- [ ] TASK-PP-008: Adicionar `LIFE` ao `PILL_SHAPES` em `src/utils/constants.ts`
- [ ] TASK-PP-009: Adicionar cor CSS `bg-pill-life` ao Tailwind config (se necessario)

---

## Fase 2: Modulo de Progressao (Core Logic)

### 2.1 Criar Novo Modulo

- [ ] TASK-PP-010: Criar arquivo `src/utils/pillProgression.ts`
- [ ] TASK-PP-011: Definir interface `PillRule` com campos `unlockRound`, `startPct`, `endPct`
- [ ] TASK-PP-012: Definir interface `ProgressionConfig` com `maxRound` e `rules`
- [ ] TASK-PP-013: Implementar constante `PROGRESSION` com regras de balanceamento
- [ ] TASK-PP-014: Implementar funcao `lerp(start, end, t)` para interpolacao linear
- [ ] TASK-PP-015: Implementar funcao `getPillChances(round, config?)` com normalizacao
- [ ] TASK-PP-016: Implementar funcao `rollPillType(round, config?)` para sorteio
- [ ] TASK-PP-017: Exportar todas as funcoes e tipos necessarios

---

## Fase 3: Refatoracao do PillGenerator

### 3.1 Atualizar Geracao de Pilulas

- [ ] TASK-PP-018: Atualizar `calculatePillStats()` para suportar tipo `LIFE`
- [ ] TASK-PP-019: Atualizar `createPill()` para incluir `livesRestore` no stats
- [ ] TASK-PP-020: Modificar assinatura de `generatePillPool(count, round?, config?)`
- [ ] TASK-PP-021: Substituir `selectPillType()` por `rollPillType()` importado de pillProgression
- [ ] TASK-PP-022: Atualizar `countPillTypes()` para incluir contagem de `LIFE`

---

## Fase 4: Logica de Efeito LIFE

### 4.1 Atualizar GameLogic

- [ ] TASK-PP-023: Adicionar case `LIFE` em `applyPillEffect()` para restaurar vidas
- [ ] TASK-PP-024: Implementar logica de `LIFE` invertida (perde vida)
- [ ] TASK-PP-025: Implementar logica de `LIFE` dobrada (restaura mais vidas)
- [ ] TASK-PP-026: Garantir cap de vidas no `maxLives` do jogador

---

## Fase 5: Integracao com GameStore

### 5.1 Atualizar Estado Inicial

- [ ] TASK-PP-027: Adicionar `LIFE: 0` ao `typeCounts` no `initialState`
- [ ] TASK-PP-028: Atualizar tipo `GameStats.pillsByType` para incluir `LIFE`

### 5.2 Atualizar Geracao de Pilulas

- [ ] TASK-PP-029: Modificar `initGame()` para passar `round: 1` ao `generatePillPool()`
- [ ] TASK-PP-030: Modificar `confirmItemSelection()` para passar `round: 1` ao `generatePillPool()`
- [ ] TASK-PP-031: Modificar `resetRound()` para passar `state.round + 1` ao `generatePillPool()`

---

## Fase 6: Feedback Visual (Opcional para LIFE)

### 6.1 Componentes Visuais

- [ ] TASK-PP-032: Atualizar `TypeCounter.tsx` para exibir contador de LIFE (quando ativo)
- [ ] TASK-PP-033: Atualizar `PillReveal.tsx` para feedback visual de LIFE
- [ ] TASK-PP-034: Atualizar `FloatingNumber.tsx` para exibir "+1 Vida" (cor rosa)
- [ ] TASK-PP-035: Adicionar icone para pilula LIFE (sugestao: Heart)

---

## Fase 7: Testes e Validacao

### 7.1 Testes Unitarios

- [ ] TASK-PP-036: Criar arquivo `src/utils/__tests__/pillProgression.test.ts`
- [ ] TASK-PP-037: Testar `getPillChances()` retorna apenas tipos desbloqueados
- [ ] TASK-PP-038: Testar `getPillChances()` soma sempre 100%
- [ ] TASK-PP-039: Testar `rollPillType()` nunca retorna tipo bloqueado
- [ ] TASK-PP-040: Testar progressao de probabilidades por rodada
- [ ] TASK-PP-041: Testar LIFE desativado por padrao

### 7.2 Testes de Integracao

- [ ] TASK-PP-042: Verificar geracao de pilulas na rodada 1 (sem FATAL)
- [ ] TASK-PP-043: Verificar geracao de pilulas na rodada 5 (com FATAL)
- [ ] TASK-PP-044: Verificar transicao de rodada mantem consistencia
- [ ] TASK-PP-045: Verificar itens funcionam com novos tipos (Scanner, Inverter, etc)

### 7.3 Validacao Manual

- [ ] TASK-PP-046: Jogar partida completa (10+ rodadas)
- [ ] TASK-PP-047: Verificar curva de dificuldade perceptivel
- [ ] TASK-PP-048: Verificar IA funciona normalmente
- [ ] TASK-PP-049: Verificar todos os overlays e toasts

---

## Fase 8: Feature Flag LIFE (Futura)

> **NOTA:** Estas tasks sao para quando decidirmos ativar a pilula LIFE.

- [ ] TASK-PP-050: Alterar `PROGRESSION.rules.LIFE` para { unlockRound: 8, startPct: 10, endPct: 15 }
- [ ] TASK-PP-051: Atualizar CSS para cor `bg-pill-life` visivel
- [ ] TASK-PP-052: Testar balanceamento com LIFE ativo
- [ ] TASK-PP-053: Ajustar porcentagens se necessario

---

## Resumo de Arquivos

### Novos Arquivos
| Arquivo | Descricao |
|---------|-----------|
| `src/utils/pillProgression.ts` | Logica de interpolacao e configuracao |
| `src/utils/__tests__/pillProgression.test.ts` | Testes unitarios |

### Arquivos Modificados
| Arquivo | Mudancas |
|---------|----------|
| `src/types/pill.ts` | Adicionar `LIFE`, `livesRestore` |
| `src/types/player.ts` | Adicionar `livesRestored` ao result |
| `src/utils/constants.ts` | Cores, labels, shapes para LIFE |
| `src/utils/pillGenerator.ts` | Usar `rollPillType`, nova assinatura |
| `src/utils/gameLogic.ts` | Logica de efeito LIFE |
| `src/stores/gameStore.ts` | Passar round, typeCounts com LIFE |
| `src/components/game/TypeCounter.tsx` | Exibir LIFE (opcional) |
| `src/components/overlays/PillReveal.tsx` | Visual de LIFE |
| `src/components/game/FloatingNumber.tsx` | "+1 Vida" |

---

## Ordem de Execucao Recomendada

```
Fase 1 (Types)
     │
     ▼
Fase 2 (Progressao) ─────────┐
     │                       │
     ▼                       │
Fase 3 (Generator)           │ Podem ser
     │                       │ paralelizadas
     ▼                       │
Fase 4 (GameLogic) ──────────┘
     │
     ▼
Fase 5 (GameStore)
     │
     ▼
Fase 7 (Testes)
     │
     ▼
Fase 6 (Visual) ─── Opcional, pode ser feito apos testes
     │
     ▼
Fase 8 (LIFE) ─── Futura, quando decidir ativar
```

---

## Estimativas

| Fase | Complexidade | Tempo Estimado |
|------|--------------|----------------|
| Fase 1 | Baixa | 30 min |
| Fase 2 | Media | 1h |
| Fase 3 | Media | 45 min |
| Fase 4 | Baixa | 30 min |
| Fase 5 | Baixa | 30 min |
| Fase 6 | Baixa | 45 min |
| Fase 7 | Media | 1h |
| **Total** | - | **~5h** |

---

## Notas de Implementacao

### Configuracao PROGRESSION

A configuracao padrao desativa LIFE para manter compatibilidade:

```typescript
LIFE: { unlockRound: 99, startPct: 0, endPct: 0 }
```

Para ativar no futuro:

```typescript
LIFE: { unlockRound: 8, startPct: 10, endPct: 15 }
```

### Retrocompatibilidade

O comportamento da rodada 1 foi calibrado para ser similar ao sistema atual:
- 70% SAFE (era ~35% - mais seguro no inicio)
- 30% DMG_LOW (era ~25% - similar)
- 0% resto (antes tinha FATAL desde o inicio)

Se quiser manter exatamente igual ao antigo, pode criar um modo "legacy":

```typescript
export const LEGACY_PROGRESSION: ProgressionConfig = {
  maxRound: 1, // Nao progride
  rules: {
    SAFE:     { unlockRound: 1, startPct: 35, endPct: 35 },
    DMG_LOW:  { unlockRound: 1, startPct: 25, endPct: 25 },
    DMG_HIGH: { unlockRound: 1, startPct: 15, endPct: 15 },
    HEAL:     { unlockRound: 1, startPct: 15, endPct: 15 },
    FATAL:    { unlockRound: 1, startPct: 10, endPct: 10 },
    LIFE:     { unlockRound: 99, startPct: 0, endPct: 0 },
  }
}
```
