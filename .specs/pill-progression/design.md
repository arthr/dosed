# Design: Sistema de Progressao Dinamica de Pilulas

## Arquitetura Proposta

### Visao Geral da Integracao

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE GERACAO DE PILULAS                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [gameStore]                                                            │
│      │                                                                  │
│      │ round = N                                                        │
│      ▼                                                                  │
│  [pillProgression.ts]                                                   │
│      │                                                                  │
│      │ getPillChances(round) → { SAFE: 25%, DMG_LOW: 20%, ... }         │
│      ▼                                                                  │
│  [pillGenerator.ts]                                                     │
│      │                                                                  │
│      │ generatePillPool(count, round) → Pill[]                          │
│      ▼                                                                  │
│  [gameStore.pillPool]                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Nova Estrutura de Arquivos

```
src/
├── types/
│   └── pill.ts                     # MODIFICADO: Adicionar LIFE ao PillType
│
├── utils/
│   ├── constants.ts                # MODIFICADO: Cores/labels para LIFE
│   ├── pillProgression.ts          # NOVO: Logica de interpolacao
│   ├── pillGenerator.ts            # MODIFICADO: Usar progressao dinamica
│   └── gameLogic.ts                # MODIFICADO: Efeito de LIFE
│
├── stores/
│   └── gameStore.ts                # MODIFICADO: Passar round para geracao
```

---

## Modelagem de Dados

### Extensao do PillType (`src/types/pill.ts`)

```typescript
// ANTES
export type PillType = 'SAFE' | 'DMG_LOW' | 'DMG_HIGH' | 'FATAL' | 'HEAL'

// DEPOIS
export type PillType = 'SAFE' | 'DMG_LOW' | 'DMG_HIGH' | 'FATAL' | 'HEAL' | 'LIFE'
```

### Extensao do PillStats (`src/types/pill.ts`)

```typescript
export interface PillStats {
  damage: number
  isFatal: boolean
  heal: number
  livesRestore: number  // NOVO: para pilula LIFE
}
```

### Novo Modulo: Configuracao de Progressao (`src/utils/pillProgression.ts`)

```typescript
/**
 * Regra de progressao para um tipo de pilula
 */
export interface PillRule {
  /** Rodada minima para a pilula comecar a aparecer */
  unlockRound: number
  /** Probabilidade (%) no momento do desbloqueio */
  startPct: number
  /** Probabilidade (%) na rodada maxima (maxRound) */
  endPct: number
}

/**
 * Configuracao completa de progressao
 */
export interface ProgressionConfig {
  /** Rodada teto para interpolacao */
  maxRound: number
  /** Regras por tipo de pilula */
  rules: Record<PillType, PillRule>
}

/**
 * Configuracao padrao - Single Source of Truth do balanceamento
 */
export const PROGRESSION: ProgressionConfig = {
  maxRound: 10,
  rules: {
    SAFE:     { unlockRound: 1, startPct: 70, endPct: 10 },  // Decai drasticamente
    DMG_LOW:  { unlockRound: 1, startPct: 30, endPct: 15 },  // Estabiliza
    DMG_HIGH: { unlockRound: 3, startPct: 20, endPct: 25 },  // Sobe no mid-game
    HEAL:     { unlockRound: 3, startPct: 10, endPct: 10 },  // Constante apos unlock
    FATAL:    { unlockRound: 5, startPct: 5,  endPct: 25 },  // Sobe no fim
    LIFE:     { unlockRound: 99, startPct: 0, endPct: 0 },   // DESATIVADO por padrao
  }
}

// Para ativar LIFE no futuro, basta mudar para:
// LIFE: { unlockRound: 8, startPct: 10, endPct: 15 }
```

---

## Logica de Calculo

### Funcao: lerp (Interpolacao Linear)

```typescript
/**
 * Interpolacao linear entre dois valores
 * @param start - Valor inicial
 * @param end - Valor final
 * @param t - Progresso (0 a 1)
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}
```

### Funcao: getPillChances

```typescript
/**
 * Calcula distribuicao de probabilidades para uma rodada
 * @param round - Numero da rodada atual
 * @param config - Configuracao de progressao (opcional, usa PROGRESSION)
 * @returns Record com probabilidades normalizadas (soma = 100)
 */
export function getPillChances(
  round: number,
  config: ProgressionConfig = PROGRESSION
): Record<PillType, number> {
  const { maxRound, rules } = config
  const clampedRound = Math.max(1, Math.min(round, maxRound))

  // 1. Calcula pesos brutos
  const rawWeights: Record<PillType, number> = {
    SAFE: 0, DMG_LOW: 0, DMG_HIGH: 0, FATAL: 0, HEAL: 0, LIFE: 0
  }

  let totalWeight = 0

  for (const [type, rule] of Object.entries(rules)) {
    const pillType = type as PillType

    // Tipo nao desbloqueado ainda
    if (clampedRound < rule.unlockRound) {
      rawWeights[pillType] = 0
      continue
    }

    // Calcula progresso (t) da interpolacao
    const roundSpan = maxRound - rule.unlockRound
    const t = roundSpan <= 0 ? 1 : (clampedRound - rule.unlockRound) / roundSpan

    const value = lerp(rule.startPct, rule.endPct, t)
    rawWeights[pillType] = value
    totalWeight += value
  }

  // 2. Normaliza para 100%
  const normalized: Record<PillType, number> = { ...rawWeights }

  if (totalWeight > 0) {
    for (const type of Object.keys(normalized) as PillType[]) {
      normalized[type] = Number(((normalized[type] * 100) / totalWeight).toFixed(2))
    }
  }

  return normalized
}
```

### Funcao: rollPillType

```typescript
/**
 * Sorteia um tipo de pilula baseado nas chances da rodada
 * @param round - Numero da rodada atual
 * @param config - Configuracao de progressao
 */
export function rollPillType(
  round: number,
  config: ProgressionConfig = PROGRESSION
): PillType {
  const chances = getPillChances(round, config)
  const randomValue = Math.random() * 100

  let accumulated = 0
  for (const [type, chance] of Object.entries(chances)) {
    accumulated += chance
    if (randomValue <= accumulated) {
      return type as PillType
    }
  }

  return 'SAFE' // Fallback de seguranca
}
```

---

## Refatoracao do pillGenerator.ts

### Mudanca na Assinatura

```typescript
// ANTES
export function generatePillPool(
  count: number,
  config: PillConfig = PILL_CONFIG
): Pill[]

// DEPOIS
export function generatePillPool(
  count: number,
  round: number = 1,
  config?: PillConfig
): Pill[]
```

### Nova Implementacao

```typescript
import { rollPillType, PROGRESSION } from './pillProgression'

/**
 * Gera pool de pilulas com probabilidades baseadas na rodada
 */
export function generatePillPool(
  count: number,
  round: number = 1,
  config: PillConfig = PILL_CONFIG
): Pill[] {
  const pills: Pill[] = []

  for (let i = 0; i < count; i++) {
    // Usa progressao dinamica ao inves de probabilidades estaticas
    const type = rollPillType(round)
    pills.push(createPill(type, config))
  }

  return pills
}
```

---

## Refatoracao do gameStore.ts

### Pontos de Modificacao

1. **initGame** - Usa rodada 1 para geracao inicial
2. **confirmItemSelection** - Usa rodada 1 para inicio do jogo
3. **resetRound** - Usa `state.round + 1` para nova rodada

```typescript
// Em resetRound():
const newPillPool = generatePillPool(
  DEFAULT_GAME_CONFIG.pillsPerRound,
  state.round + 1  // NOVO: passa rodada para progressao
)

// Em confirmItemSelection():
const pillPool = generatePillPool(
  DEFAULT_GAME_CONFIG.pillsPerRound,
  1  // Rodada 1
)
```

### Atualizacao de typeCounts

```typescript
// Estado inicial
const initialState: GameState = {
  // ...
  typeCounts: {
    SAFE: 0,
    DMG_LOW: 0,
    DMG_HIGH: 0,
    FATAL: 0,
    HEAL: 0,
    LIFE: 0,  // NOVO
  },
}
```

---

## Logica de Efeito: Pilula LIFE

### gameLogic.ts - applyPillEffect

```typescript
export function applyPillEffect(
  pill: Pill,
  player: Player,
  options?: ApplyPillOptions
): PlayerEffectResult {
  const { stats, inverted, doubled } = pill

  // Caso especial: LIFE restaura vidas, nao resistencia
  if (pill.type === 'LIFE' && !inverted) {
    let livesToRestore = stats.livesRestore
    if (doubled) livesToRestore *= 2

    const newLives = Math.min(player.lives + livesToRestore, player.maxLives)
    const actualRestored = newLives - player.lives

    return {
      player: { ...player, lives: newLives },
      collapsed: false,
      eliminated: false,
      damageDealt: 0,
      healReceived: 0,
      livesRestored: actualRestored,  // NOVO campo
    }
  }

  // Se LIFE invertida: perde vida ao inves de ganhar
  if (pill.type === 'LIFE' && inverted) {
    let livesToLose = stats.livesRestore
    if (doubled) livesToLose *= 2

    const newLives = player.lives - livesToLose
    const eliminated = newLives <= 0

    return {
      player: {
        ...player,
        lives: Math.max(0, newLives),
        resistance: eliminated ? 0 : player.resistance,
      },
      collapsed: false,
      eliminated,
      damageDealt: 0,
      healReceived: 0,
      livesRestored: -livesToLose,
    }
  }

  // ... resto da logica existente para outros tipos
}
```

### constants.ts - Adicionar LIFE

```typescript
export const PILL_COLORS: Record<PillType, string> = {
  // ... existentes
  LIFE: 'bg-pill-life',
}

export const PILL_HEX_COLORS: Record<PillType, string> = {
  // ... existentes
  LIFE: '#ec4899',  // pink-500
}

export const PILL_LABELS: Record<PillType, string> = {
  // ... existentes
  LIFE: 'Vida',
}

export const PILL_DESCRIPTIONS: Record<PillType, string> = {
  // ... existentes
  LIFE: 'Restaura +1 vida perdida.',
}

export const PILL_SHAPES: Record<PillType, string> = {
  // ... existentes
  LIFE: 'capsule',  // Mesmo shape do DMG_LOW
}
```

---

## Tabela de Probabilidades por Rodada

Referencia visual do comportamento esperado:

| Rodada | SAFE  | DMG_LOW | DMG_HIGH | HEAL  | FATAL | LIFE* |
|--------|-------|---------|----------|-------|-------|-------|
| 1      | 70%   | 30%     | 0%       | 0%    | 0%    | 0%    |
| 2      | 63.3% | 28.3%   | 2.9%     | 1.4%  | 0%    | 0%    |
| 3      | 56.7% | 26.7%   | 5.7%     | 2.9%  | 0%    | 0%    |
| 4      | 45.8% | 23.3%   | 11.7%    | 5.0%  | 0%    | 0%    |
| 5      | 35.0% | 20.0%   | 17.5%    | 7.5%  | 5.0%  | 0%    |
| 6      | 29.2% | 18.3%   | 19.2%    | 7.9%  | 10.4% | 0%    |
| 7      | 23.3% | 16.7%   | 20.8%    | 8.3%  | 15.8% | 0%    |
| 8      | 17.5% | 15.0%   | 22.5%    | 8.8%  | 21.2% | 0%    |
| 9      | 11.7% | 13.3%   | 24.2%    | 9.2%  | 26.7% | 0%    |
| 10     | 10.0% | 15.0%   | 25.0%    | 10.0% | 25.0% | 0%    |

> *LIFE desativado por padrao. Ativar altera distribuicao.

---

## Fluxo de Dados Atualizado

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CICLO DE RODADA                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Nova Rodada]                                                          │
│       │                                                                 │
│       │ round++                                                         │
│       ▼                                                                 │
│  [getPillChances(round)]                                                │
│       │                                                                 │
│       │ Calcula lerp para cada tipo                                     │
│       │ Normaliza para 100%                                             │
│       ▼                                                                 │
│  { SAFE: 35%, DMG_LOW: 20%, DMG_HIGH: 17.5%, HEAL: 7.5%, FATAL: 5% }    │
│       │                                                                 │
│       ▼                                                                 │
│  [generatePillPool(6, round)]                                           │
│       │                                                                 │
│       │ Loop 6x: rollPillType(round)                                    │
│       │ Cria pilulas com tipos sorteados                                │
│       ▼                                                                 │
│  [Pill[], Pill[], Pill[], Pill[], Pill[], Pill[]]                       │
│       │                                                                 │
│       ▼                                                                 │
│  [gameStore.pillPool = newPillPool]                                     │
│       │                                                                 │
│       ▼                                                                 │
│  [countPillTypes(pillPool)]                                             │
│       │                                                                 │
│       ▼                                                                 │
│  [gameStore.typeCounts = { SAFE: 2, DMG_LOW: 2, ... }]                  │
│       │                                                                 │
│       ▼                                                                 │
│  [UI Atualiza: TypeCounter, PillPool]                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Riscos e Mitigacoes

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Rodadas iniciais muito faceis | Baixo | Ajustar startPct do DMG_LOW para 35-40% |
| Rodadas tardias muito dificeis | Medio | Garantir HEAL disponivel (minimo 10%) |
| LIFE desbalanceado quando ativo | Medio | Testar extensivamente antes de ativar |
| Mudanca brusca de comportamento | Alto | Rodada 1 similar ao sistema atual |
| Config nao reflete na UI | Baixo | TypeCounter ja usa countPillTypes() |

---

## Compatibilidade

### Itens que Interagem com Pilulas

| Item | Interacao | Status |
|------|-----------|--------|
| Scanner | Revela tipo - OK, funciona com todos tipos | Compativel |
| Inverter | Inverte efeito - LIFE invertido perde vida | Requer logica |
| Double | Dobra efeito - LIFE dobrado = +2 vidas | Requer logica |
| Discard | Remove pilula - OK, funciona normalmente | Compativel |
| Force Feed | Forca consumo - OK, funciona normalmente | Compativel |

### IA

A IA nao precisa de mudancas - ela escolhe pilulas aleatoriamente e a distribuicao ja reflete a progressao.

---

## Testes Sugeridos

```typescript
describe('pillProgression', () => {
  describe('getPillChances', () => {
    it('retorna apenas SAFE e DMG_LOW na rodada 1', () => {
      const chances = getPillChances(1)
      expect(chances.DMG_HIGH).toBe(0)
      expect(chances.FATAL).toBe(0)
      expect(chances.LIFE).toBe(0)
    })

    it('soma das probabilidades e 100', () => {
      for (let round = 1; round <= 10; round++) {
        const chances = getPillChances(round)
        const sum = Object.values(chances).reduce((a, b) => a + b, 0)
        expect(sum).toBeCloseTo(100, 1)
      }
    })

    it('FATAL aparece a partir da rodada 5', () => {
      expect(getPillChances(4).FATAL).toBe(0)
      expect(getPillChances(5).FATAL).toBeGreaterThan(0)
    })

    it('LIFE desativado por padrao', () => {
      for (let round = 1; round <= 10; round++) {
        expect(getPillChances(round).LIFE).toBe(0)
      }
    })
  })

  describe('rollPillType', () => {
    it('nunca retorna tipo nao desbloqueado', () => {
      for (let i = 0; i < 100; i++) {
        const type = rollPillType(1)
        expect(['SAFE', 'DMG_LOW']).toContain(type)
      }
    })
  })
})
```

---

## Consideracoes de UX

1. **Nao mostrar probabilidades ao jogador** - Manter misterio
2. **TypeCounter continua funcionando** - Mostra contagem real, nao probabilidades
3. **Tooltips de pilula nao mudam** - Descricoes fixas por tipo
4. **Nova rodada banner** - Pode mostrar "Rodada X" sem indicar dificuldade

---

## Extensibilidade Futura

### Adicionar Novo Tipo de Pilula

1. Adicionar ao `PillType` em `pill.ts`
2. Adicionar regra em `PROGRESSION.rules`
3. Adicionar cor/label em `constants.ts`
4. Adicionar stats em `calculatePillStats()`
5. Adicionar logica em `applyPillEffect()` se necessario

### Modos de Jogo Alternativos

A configuracao `ProgressionConfig` pode ser substituida para criar modos:
- **Hardcore:** Cianeto desde rodada 1
- **Casual:** Mais HEAL, menos FATAL
- **Infinito:** maxRound = 100, curva esticada
