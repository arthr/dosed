# Tasks: Sistema de Progressao Dinamica de Pilulas

## Legenda
- `[ ]` Pendente
- `[x]` Concluido
- `[~]` Em andamento
- `[-]` Cancelado

---

## Fase 1: Preparacao de Tipos (Foundation)

### 1.1 Extensao do Sistema de Tipos

- [x] TASK-PP-001: Adicionar tipo `LIFE` ao enum `PillType` em `src/types/pill.ts`
- [x] TASK-PP-002: Adicionar campo `livesRestore` ao `PillStats` em `src/types/pill.ts`
- [x] TASK-PP-003: Adicionar campo `livesRestored` ao `PlayerEffectResult` em `src/types/player.ts`

### 1.2 Constantes e Configuracoes

- [x] TASK-PP-004: Adicionar `LIFE` ao `PILL_COLORS` em `src/utils/constants.ts`
- [x] TASK-PP-005: Adicionar `LIFE` ao `PILL_HEX_COLORS` em `src/utils/constants.ts`
- [x] TASK-PP-006: Adicionar `LIFE` ao `PILL_LABELS` em `src/utils/constants.ts`
- [x] TASK-PP-007: Adicionar `LIFE` ao `PILL_DESCRIPTIONS` em `src/utils/constants.ts`
- [x] TASK-PP-008: Adicionar `LIFE` ao `PILL_SHAPES` em `src/utils/constants.ts`
- [x] TASK-PP-009: Adicionar cor CSS `bg-pill-life` ao Tailwind config (se necessario)

---

## Fase 2: Modulo de Progressao (Core Logic)

### 2.1 Criar Novo Modulo - Progressao de Tipos

- [x] TASK-PP-010: Criar arquivo `src/utils/pillProgression.ts`
- [x] TASK-PP-011: Definir interface `PillRule` com campos `unlockRound`, `startPct`, `endPct`
- [x] TASK-PP-012: Definir interface `ProgressionConfig` com `maxRound` e `rules`
- [x] TASK-PP-013: Implementar constante `PROGRESSION` com regras de balanceamento
- [x] TASK-PP-014: Implementar funcao `lerp(start, end, t)` para interpolacao linear
- [x] TASK-PP-015: Implementar funcao `getPillChances(round, config?)` com normalizacao
- [x] TASK-PP-016: Implementar funcao `rollPillType(round, config?)` para sorteio

### 2.2 Pool Scaling (Step Function)

- [x] TASK-PP-054: Definir interface `PoolScalingConfig` com `baseCount`, `increaseBy`, `frequency`, `maxCap`
- [x] TASK-PP-055: Implementar constante `POOL_SCALING` com configuracao padrao (6, +1, freq 3, cap 12)
- [x] TASK-PP-056: Implementar funcao `getPillCount(round, config?)` com step function
- [x] TASK-PP-017: Exportar todas as funcoes e tipos necessarios

---

## Fase 3: Refatoracao do PillGenerator

### 3.1 Atualizar Geracao de Pilulas

- [x] TASK-PP-018: Atualizar `calculatePillStats()` para suportar tipo `LIFE` (feito na Fase 1)
- [x] TASK-PP-019: Atualizar `createPill()` para incluir `livesRestore` no stats (feito na Fase 1)
- [x] TASK-PP-020: Modificar assinatura de `generatePillPool(round, config?)` - usar `getPillCount()` internamente
- [x] TASK-PP-021: Substituir `selectPillType()` por `rollPillType()` importado de pillProgression
- [x] TASK-PP-022: Atualizar `countPillTypes()` para incluir contagem de `LIFE` (feito na Fase 1)
- [x] TASK-PP-057: Criar funcao auxiliar `generatePillPoolWithCount(count, round, config?)` para override manual

---

## Fase 4: Logica de Efeito LIFE

### 4.1 Atualizar GameLogic

- [x] TASK-PP-023: Adicionar case `LIFE` em `applyPillEffect()` para restaurar vidas
- [x] TASK-PP-024: Implementar logica de `LIFE` invertida (perde vida)
- [x] TASK-PP-025: Implementar logica de `LIFE` dobrada (restaura mais vidas)
- [x] TASK-PP-026: Garantir cap de vidas no `maxLives` do jogador

---

## Fase 5: Integracao com GameStore

### 5.1 Atualizar Estado Inicial

- [x] TASK-PP-027: Adicionar `LIFE: 0` ao `typeCounts` no `initialState`
- [x] TASK-PP-028: Atualizar tipo `GameStats.pillsByType` para incluir `LIFE`

### 5.2 Atualizar Geracao de Pilulas

- [x] TASK-PP-029: Modificar `initGame()` para usar `generatePillPool(1)` - quantidade dinamica
- [x] TASK-PP-030: Modificar `confirmItemSelection()` para usar `generatePillPool(1)` - quantidade dinamica
- [x] TASK-PP-031: Modificar `resetRound()` para usar `generatePillPool(state.round + 1)` - quantidade dinamica

### 5.3 Limpeza de Configuracao

- [x] TASK-PP-058: Remover ou depreciar `pillsPerRound` de `DEFAULT_GAME_CONFIG`
- [x] TASK-PP-059: Atualizar tipo `GameConfig` para remover `pillsPerRound` (se aplicavel)

---

## Fase 6: Feedback Visual (Opcional para LIFE)

### 6.1 Componentes Visuais

- [x] TASK-PP-032: Atualizar `TypeCounter.tsx` para exibir contador de LIFE (quando ativo)
- [x] TASK-PP-033: Atualizar `PillReveal.tsx` para feedback visual de LIFE
- [x] TASK-PP-034: Atualizar `FloatingNumber.tsx` para exibir "+1 Vida" (cor rosa)
- [x] TASK-PP-035: Adicionar icone para pilula LIFE (sugestao: Heart)

---

## Fase 7: Testes e Validacao

### 7.1 Testes Unitarios - Progressao de Tipos

- [x] TASK-PP-036: Criar arquivo `src/utils/__tests__/pillProgression.test.ts`
- [x] TASK-PP-037: Testar `getPillChances()` retorna apenas tipos desbloqueados
- [x] TASK-PP-038: Testar `getPillChances()` soma sempre 100%
- [x] TASK-PP-039: Testar `rollPillType()` nunca retorna tipo bloqueado
- [x] TASK-PP-040: Testar progressao de probabilidades por rodada
- [x] TASK-PP-041: Testar LIFE desativado por padrao

### 7.2 Testes Unitarios - Pool Scaling

- [x] TASK-PP-060: Testar `getPillCount()` retorna baseCount na rodada 1 (6)
- [x] TASK-PP-061: Testar `getPillCount()` mantem valor dentro do ciclo (rodadas 1-3 = 6)
- [x] TASK-PP-062: Testar `getPillCount()` aumenta apos ciclo (rodada 4 = 7)
- [x] TASK-PP-063: Testar `getPillCount()` respeita maxCap
- [x] TASK-PP-064: Testar `getPillCount()` com config customizada
- [x] TASK-PP-065: Testar `getPillCount()` sem maxCap definido

### 7.3 Testes de Integracao

- [x] TASK-PP-042: Verificar geracao de pilulas na rodada 1 (sem FATAL/HEAL, 6 pilulas)
- [x] TASK-PP-043: Verificar geracao de pilulas na rodada 4 (com FATAL, 7 pilulas)
- [x] TASK-PP-044: Verificar transicao de rodada mantem consistencia (MANUAL)
- [x] TASK-PP-045: Verificar itens funcionam com novos tipos (Scanner, Inverter, etc) (MANUAL)
- [x] TASK-PP-066: Verificar quantidade de pilulas aumenta corretamente entre rodadas

### 7.4 Validacao Manual

- [x] TASK-PP-046: Jogar partida completa (10+ rodadas)
- [x] TASK-PP-047: Verificar curva de dificuldade perceptivel
- [x] TASK-PP-048: Verificar IA funciona normalmente
- [x] TASK-PP-049: Verificar todos os overlays e toasts
- [x] TASK-PP-067: Verificar UI de PillPool adapta-se a quantidade variavel (5-12 pilulas)
- [x] TASK-PP-068: Verificar que cap de 12 pilulas nao quebra layout

---

## Fase 8: Ativacao da Pilula LIFE

- [x] TASK-PP-050: Alterar `PROGRESSION.rules.LIFE` para { unlockRound: 5, startPct: 6, endPct: 17 }
- [x] TASK-PP-051: Verificar CSS para cor `bg-pill-life` (ja estava configurado)
- [X] TASK-PP-052: Testar balanceamento com LIFE ativo (MANUAL)
- [X] TASK-PP-053: Ajustar porcentagens se necessario (CONDICIONAL)

---

## Resumo de Arquivos

### Novos Arquivos
| Arquivo | Descricao |
|---------|-----------|
| `src/utils/pillProgression.ts` | Logica de interpolacao, pool scaling e configuracoes |
| `src/utils/__tests__/pillProgression.test.ts` | Testes unitarios |

### Arquivos Modificados
| Arquivo | Mudancas |
|---------|----------|
| `src/types/pill.ts` | Adicionar `LIFE`, `livesRestore` |
| `src/types/player.ts` | Adicionar `livesRestored` ao result |
| `src/utils/constants.ts` | Cores, labels, shapes para LIFE; remover/depreciar `pillsPerRound` |
| `src/utils/pillGenerator.ts` | Nova assinatura `generatePillPool(round)`, usar `getPillCount` e `rollPillType` |
| `src/utils/gameLogic.ts` | Logica de efeito LIFE |
| `src/stores/gameStore.ts` | Usar `generatePillPool(round)` sem count explicito |
| `src/components/game/TypeCounter.tsx` | Exibir LIFE (opcional) |
| `src/components/game/PillPool.tsx` | Layout flexivel para 5-12 pilulas |
| `src/components/overlays/PillReveal.tsx` | Visual de LIFE |
| `src/components/game/FloatingNumber.tsx` | "+1 Vida" |

---

## Ordem de Execucao Recomendada

```
Fase 1 (Types)
     │
     ▼
Fase 2 (Progressao + Pool Scaling) ───┐
     │                                │
     ▼                                │
Fase 3 (Generator)                    │ Podem ser
     │                                │ paralelizadas
     ▼                                │
Fase 4 (GameLogic) ───────────────────┘
     │
     ▼
Fase 5 (GameStore + Limpeza Config)
     │
     ▼
Fase 7 (Testes - Tipos + Pool Scaling)
     │
     ▼
Fase 6 (Visual) ─── Inclui PillPool layout flexivel
     │
     ▼
Fase 8 (LIFE) ─── Futura, quando decidir ativar
```

---

## Estimativas

| Fase | Complexidade | Tempo Estimado |
|------|--------------|----------------|
| Fase 1 | Baixa | 30 min |
| Fase 2 | Media | 1h 15min (+15min para pool scaling) |
| Fase 3 | Media | 45 min |
| Fase 4 | Baixa | 30 min |
| Fase 5 | Baixa | 45 min (+15min para limpeza config) |
| Fase 6 | Media | 1h (+15min para layout flexivel) |
| Fase 7 | Media | 1h 30min (+30min para testes pool scaling) |
| **Total** | - | **~6h 15min** |

---

## Notas de Implementacao

### Configuracao PROGRESSION

A configuracao padrao desativa LIFE para manter compatibilidade:

```typescript
LIFE: { unlockRound: 99, startPct: 0, endPct: 0 }
```

Para ativar no futuro:

```typescript
LIFE: { unlockRound: 10, startPct: 10, endPct: 15 }
```

### Retrocompatibilidade

O comportamento da rodada 1 foi calibrado para manter tensao:
- 45% SAFE (era ~35% - um pouco mais seguro no inicio)
- 30% DMG_LOW (era ~25% - similar)
- 15% DMG_HIGH (era ~15% - igual)
- FATAL atrasa para rodada 4 (era desde rodada 1 com 10%)

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

---

### Configuracao POOL_SCALING

A configuracao padrao e retrocompativel (comeca com 6, igual ao sistema atual):

```typescript
export const POOL_SCALING: PoolScalingConfig = {
  baseCount: 6,    // Retrocompativel com sistema atual
  increaseBy: 1,   // Aumenta devagar
  frequency: 3,    // A cada 3 rodadas
  maxCap: 12,      // Limite para UI
}
```

**Tabela de referencia rapida:**
| Rodadas | Pilulas |
|---------|---------|
| 1-3     | 6       |
| 4-6     | 7       |
| 7-9     | 8       |
| 10-12   | 9       |
| 13-15   | 10      |
| 16-18   | 11      |
| 19+     | 12 (cap)|

Se quiser quantidade fixa como antes:

```typescript
export const FIXED_POOL: PoolScalingConfig = {
  baseCount: 6,
  increaseBy: 0,  // Nunca aumenta
  frequency: 1,
}
```
