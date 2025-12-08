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
│      ├─► getPillChances(round) → { SAFE: 25%, DMG_LOW: 20%, ... }       │
│      │                                                                  │
│      └─► getPillCount(round) → 6  (quantidade baseada em step function) │
│      │                                                                  │
│      ▼                                                                  │
│  [pillGenerator.ts]                                                     │
│      │                                                                  │
│      │ generatePillPool(round) → Pill[]  (usa count e chances internas) │
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
 * 
 * NOTAS DE DESIGN:
 * - Rodada 1 ja tem algum risco (DMG_HIGH 15%) para criar tensao imediata
 * - HEAL desbloqueia rodada 2, ANTES de FATAL, como "valvula de escape"
 * - FATAL limitado a 18% max para evitar late game muito punitivo/aleatorio
 * - maxRound 15 para evitar estagnacao em partidas longas
 */
export const PROGRESSION: ProgressionConfig = {
  maxRound: 15,
  rules: {
    SAFE:     { unlockRound: 1, startPct: 45, endPct: 10 },  // Menos seguro no inicio
    DMG_LOW:  { unlockRound: 1, startPct: 30, endPct: 15 },  // Estabiliza
    DMG_HIGH: { unlockRound: 1, startPct: 15, endPct: 25 },  // Presente desde rodada 1
    HEAL:     { unlockRound: 2, startPct: 10, endPct: 15 },  // Antes de FATAL
    FATAL:    { unlockRound: 4, startPct: 5,  endPct: 18 },  // Atrasa e limita max
    LIFE:     { unlockRound: 99, startPct: 0, endPct: 0 },   // DESATIVADO por padrao
  }
}

// Para ativar LIFE no futuro, basta mudar para:
// LIFE: { unlockRound: 10, startPct: 10, endPct: 15 }
```

### Pool Scaling Configuration (`src/utils/pillProgression.ts`)

```typescript
/**
 * Configuracao de escalonamento do pool de pilulas
 * Usa Step Function para aumentar quantidade em degraus
 */
export interface PoolScalingConfig {
  /** Quantidade inicial de pilulas na rodada 1 */
  baseCount: number
  /** Quantas pilulas adicionar a cada ciclo */
  increaseBy: number
  /** A cada quantas rodadas o aumento acontece (tamanho do ciclo) */
  frequency: number
  /** Limite maximo para proteger UI e performance */
  maxCap?: number
}

/**
 * Configuracao padrao de pool scaling
 * "Comeca com 6 (retrocompativel), aumenta +1 a cada 3 rodadas, max 12"
 */
export const POOL_SCALING: PoolScalingConfig = {
  baseCount: 6,
  increaseBy: 1,
  frequency: 3,
  maxCap: 12,
}
```

**Tabela de Referencia - Pool Scaling:**

| Rodadas | Pilulas | Calculo |
|---------|---------|---------|
| 1-3     | 6       | 6 + floor(0/3) * 1 = 6 |
| 4-6     | 7       | 6 + floor(3/3) * 1 = 7 |
| 7-9     | 8       | 6 + floor(6/3) * 1 = 8 |
| 10-12   | 9       | 6 + floor(9/3) * 1 = 9 |
| 13-15   | 10      | 6 + floor(12/3) * 1 = 10 |
| 16-18   | 11      | 6 + floor(15/3) * 1 = 11 |
| 19+     | 12      | cap atingido |

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

### Funcao: getPillCount (Step Function)

```typescript
/**
 * Calcula a quantidade de pilulas para uma rodada usando Step Function
 * @param round - Numero da rodada atual
 * @param config - Configuracao de scaling (opcional, usa POOL_SCALING)
 * @returns Quantidade de pilulas para o pool
 * 
 * Formula: baseCount + floor((round - 1) / frequency) * increaseBy
 * Resultado limitado por maxCap se definido
 */
export function getPillCount(
  round: number,
  config: PoolScalingConfig = POOL_SCALING
): number {
  const { baseCount, increaseBy, frequency, maxCap } = config

  // Garante round minimo de 1
  const safeRound = Math.max(1, round)

  // Calcula quantos ciclos completos passaram
  const cyclesPassed = Math.floor((safeRound - 1) / frequency)

  // Calcula quantidade total
  let count = baseCount + cyclesPassed * increaseBy

  // Aplica cap se definido
  if (maxCap !== undefined) {
    count = Math.min(count, maxCap)
  }

  return count
}
```

**Exemplos de uso:**
```typescript
getPillCount(1)   // 6 (base, retrocompativel)
getPillCount(3)   // 6 (ainda no primeiro ciclo)
getPillCount(4)   // 7 (primeiro aumento)
getPillCount(10)  // 9 (terceiro aumento)
getPillCount(100) // 12 (cap atingido)
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

// DEPOIS - Simplificada: apenas round, calcula count internamente
export function generatePillPool(
  round: number = 1,
  config?: PillConfig
): Pill[]
```

### Nova Implementacao (Distribuicao Proporcional)

```typescript
import { getPillCount, distributePillTypes } from './pillProgression'

/**
 * Gera pool de pilulas com distribuicao PROPORCIONAL
 * A porcentagem define a quantidade exata de cada tipo (nao chance de sorteio)
 * 
 * @param round - Numero da rodada atual (determina quantidade E tipos)
 * @param config - Configuracao de dano/cura (opcional)
 * @returns Array de pilulas embaralhado
 */
export function generatePillPool(
  round: number = 1,
  config: PillConfig = PILL_CONFIG
): Pill[] {
  const count = getPillCount(round)
  const distribution = distributePillTypes(count, round)
  const pills: Pill[] = []

  // Cria pilulas baseado na distribuicao proporcional
  for (const [type, typeCount] of Object.entries(distribution)) {
    for (let i = 0; i < typeCount; i++) {
      pills.push(createPill(type as PillType, config))
    }
  }

  // Embaralha para ordem nao previsivel
  return shuffleArray(pills)
}

/**
 * Variante que permite override da quantidade (para testes ou modos especiais)
 */
export function generatePillPoolWithCount(
  count: number,
  round: number = 1,
  config: PillConfig = PILL_CONFIG
): Pill[] {
  const distribution = distributePillTypes(count, round)
  const pills: Pill[] = []

  for (const [type, typeCount] of Object.entries(distribution)) {
    for (let i = 0; i < typeCount; i++) {
      pills.push(createPill(type as PillType, config))
    }
  }

  return shuffleArray(pills)
}
```

> **NOTA:** A funcao `rollPillType()` ainda existe para casos de sorteio individual
> (ex: pilula bonus, item especial), mas nao e mais usada para geracao do pool principal.

---

## Refatoracao do gameStore.ts

### Pontos de Modificacao

1. **initGame** - Usa rodada 1 para geracao inicial
2. **confirmItemSelection** - Usa rodada 1 para inicio do jogo
3. **resetRound** - Usa `state.round + 1` para nova rodada

```typescript
// ANTES (count fixo):
const newPillPool = generatePillPool(DEFAULT_GAME_CONFIG.pillsPerRound, PILL_CONFIG)

// DEPOIS (apenas round, count calculado internamente):

// Em resetRound():
const newPillPool = generatePillPool(state.round + 1)

// Em confirmItemSelection():
const pillPool = generatePillPool(1)  // Rodada 1

// Em initGame():
const pillPool = generatePillPool(1)  // Rodada 1
```

### Remocao de pillsPerRound

O campo `pillsPerRound` em `DEFAULT_GAME_CONFIG` pode ser **removido** ou **depreciado**, 
pois a quantidade agora e determinada dinamicamente por `POOL_SCALING`.

```typescript
// ANTES
export const DEFAULT_GAME_CONFIG: GameConfig = {
  // ...
  pillsPerRound: 6,  // REMOVER - agora usa POOL_SCALING
}

// Se precisar manter para retrocompatibilidade, pode ignorar:
// pillsPerRound: 6,  // @deprecated - usar POOL_SCALING
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

  // Se LIFE invertida: causa dano em RESISTENCIA (proporcional)
  // NOTA: Mantemos consistencia com outros tipos - inversao afeta resistencia, nao vidas
  if (pill.type === 'LIFE' && inverted) {
    let damageAmount = stats.livesRestore * 3  // Equivalente em dano de resistencia
    if (doubled) damageAmount *= 2

    const newResistance = player.resistance - damageAmount
    const collapsed = newResistance <= 0

    let finalPlayer = { ...player, resistance: Math.max(0, newResistance) }

    // Se colapsou, perde vida e reseta resistencia (fluxo normal)
    if (collapsed) {
      const newLives = player.lives - 1
      const eliminated = newLives <= 0
      finalPlayer = {
        ...finalPlayer,
        lives: Math.max(0, newLives),
        resistance: eliminated ? 0 : player.maxResistance,
      }

      return {
        player: finalPlayer,
        collapsed: true,
        eliminated,
        damageDealt: damageAmount,
        healReceived: 0,
        livesRestored: 0,
      }
    }

    return {
      player: finalPlayer,
      collapsed: false,
      eliminated: false,
      damageDealt: damageAmount,
      healReceived: 0,
      livesRestored: 0,
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

Referencia visual do comportamento esperado (valores aproximados, normalizados):

| Rodada | SAFE  | DMG_LOW | DMG_HIGH | HEAL  | FATAL | LIFE* |
|--------|-------|---------|----------|-------|-------|-------|
| 1      | 50.0% | 33.3%   | 16.7%    | 0%    | 0%    | 0%    |
| 2      | 46.3% | 31.6%   | 16.8%    | 5.3%  | 0%    | 0%    |
| 3      | 42.9% | 30.0%   | 17.1%    | 10.0% | 0%    | 0%    |
| 4      | 39.2% | 27.5%   | 17.6%    | 10.8% | 4.9%  | 0%    |
| 5      | 35.8% | 26.0%   | 18.3%    | 11.4% | 8.5%  | 0%    |
| 6      | 32.4% | 24.3%   | 18.9%    | 12.2% | 12.2% | 0%    |
| 7      | 29.3% | 22.9%   | 19.6%    | 12.8% | 15.4% | 0%    |
| 8      | 26.1% | 21.5%   | 20.3%    | 13.5% | 18.6% | 0%    |
| 10     | 20.0% | 18.8%   | 21.8%    | 14.1% | 25.3% | 0%    |
| 15     | 12.0% | 18.1%   | 30.1%    | 18.1% | 21.7% | 0%    |

> *LIFE desativado por padrao. Ativar altera distribuicao.
> Nota: Valores sao normalizados para soma = 100%. FATAL limitado a ~18% endPct.

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
│  [generatePillPool(round)]                                              │
│       │                                                                 │
│       ├─► [getPillCount(round)]                                         │
│       │       │                                                         │
│       │       │ Step Function: base + floor((r-1)/freq) * inc           │
│       │       │ Aplica maxCap                                           │
│       │       ▼                                                         │
│       │   count = 7 (exemplo: rodada 8)                                 │
│       │                                                                 │
│       └─► [distributePillTypes(count, round)]                           │
│               │                                                         │
│               │ Usa getPillChances() para calcular porcentagens         │
│               │ Converte % em quantidades proporcionais                 │
│               │ Arredonda e ajusta para garantir soma = count           │
│               ▼                                                         │
│           { SAFE: 2, DMG_LOW: 2, DMG_HIGH: 1, HEAL: 1, FATAL: 1 }       │
│       │                                                                 │
│       ▼                                                                 │
│  [Cria pilulas por tipo, embaralha array]                               │
│       │                                                                 │
│       │ Distribuicao PROPORCIONAL (deterministica)                      │
│       ▼                                                                 │
│  [Pill[], Pill[], Pill[], Pill[], Pill[], Pill[], Pill[]]  (7 pilulas)  │
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
│  [UI Atualiza: TypeCounter, PillPool (layout adapta a 7 pilulas)]       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Riscos e Mitigacoes

### Progressao de Tipos

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Rodadas iniciais muito faceis | Baixo | Ajustar startPct do DMG_LOW para 35-40% |
| Rodadas tardias muito dificeis | Medio | Garantir HEAL disponivel (minimo 10%) |
| LIFE desbalanceado quando ativo | Medio | Testar extensivamente antes de ativar |
| Mudanca brusca de comportamento | Alto | Rodada 1 similar ao sistema atual |
| Config nao reflete na UI | Baixo | TypeCounter ja usa countPillTypes() |

### Pool Scaling

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| UI quebra com muitas pilulas | Alto | maxCap de 12 pilulas, testar layout |
| Rodadas muito longas no late game | Medio | Ajustar frequency/increaseBy se necessario |
| Memoria/performance com pools grandes | Baixo | 12 pilulas e trivial, nao e problema |
| Jogador confuso com quantidade variavel | Baixo | UX clara, talvez mostrar "Rodada X (N pilulas)" |
| Step Function muito agressiva | Medio | Comecar conservador (freq: 3) e ajustar |

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
    it('retorna SAFE, DMG_LOW e DMG_HIGH na rodada 1 (sem HEAL, FATAL, LIFE)', () => {
      const chances = getPillChances(1)
      expect(chances.SAFE).toBeGreaterThan(0)
      expect(chances.DMG_LOW).toBeGreaterThan(0)
      expect(chances.DMG_HIGH).toBeGreaterThan(0)
      expect(chances.HEAL).toBe(0)  // Desbloqueia rodada 2
      expect(chances.FATAL).toBe(0) // Desbloqueia rodada 4
      expect(chances.LIFE).toBe(0)
    })

    it('soma das probabilidades e 100', () => {
      for (let round = 1; round <= 10; round++) {
        const chances = getPillChances(round)
        const sum = Object.values(chances).reduce((a, b) => a + b, 0)
        expect(sum).toBeCloseTo(100, 1)
      }
    })

    it('FATAL aparece a partir da rodada 4', () => {
      expect(getPillChances(3).FATAL).toBe(0)
      expect(getPillChances(4).FATAL).toBeGreaterThan(0)
    })

    it('HEAL aparece a partir da rodada 2', () => {
      expect(getPillChances(1).HEAL).toBe(0)
      expect(getPillChances(2).HEAL).toBeGreaterThan(0)
    })

    it('LIFE desativado por padrao', () => {
      for (let round = 1; round <= 10; round++) {
        expect(getPillChances(round).LIFE).toBe(0)
      }
    })
  })

  describe('rollPillType', () => {
    it('nunca retorna tipo nao desbloqueado na rodada 1', () => {
      for (let i = 0; i < 100; i++) {
        const type = rollPillType(1)
        expect(['SAFE', 'DMG_LOW', 'DMG_HIGH']).toContain(type)
      }
    })
  })

  describe('getPillCount', () => {
    it('retorna baseCount na rodada 1', () => {
      expect(getPillCount(1)).toBe(6)
    })

    it('mantem mesmo valor dentro do ciclo', () => {
      // Rodadas 1-3 devem retornar 6 (primeiro ciclo)
      expect(getPillCount(1)).toBe(6)
      expect(getPillCount(2)).toBe(6)
      expect(getPillCount(3)).toBe(6)
    })

    it('aumenta apos completar ciclo', () => {
      // Rodada 4 inicia segundo ciclo
      expect(getPillCount(4)).toBe(7)
      expect(getPillCount(5)).toBe(7)
      expect(getPillCount(6)).toBe(7)
    })

    it('respeita maxCap', () => {
      // Rodada 100 deve retornar maxCap (12)
      expect(getPillCount(100)).toBe(12)
    })

    it('funciona com config customizada', () => {
      const customConfig: PoolScalingConfig = {
        baseCount: 3,
        increaseBy: 2,
        frequency: 2,
        maxCap: 10,
      }
      expect(getPillCount(1, customConfig)).toBe(3)
      expect(getPillCount(3, customConfig)).toBe(5)  // 3 + 1*2
      expect(getPillCount(5, customConfig)).toBe(7)  // 3 + 2*2
      expect(getPillCount(100, customConfig)).toBe(10) // cap
    })

    it('funciona sem maxCap', () => {
      const noCapConfig: PoolScalingConfig = {
        baseCount: 5,
        increaseBy: 1,
        frequency: 3,
      }
      expect(getPillCount(100, noCapConfig)).toBe(38) // 5 + 33*1
    })
  })
})
```

---

## Consideracoes de UX

### Progressao de Tipos
1. **Nao mostrar probabilidades ao jogador** - Manter misterio
2. **TypeCounter continua funcionando** - Mostra contagem real, nao probabilidades
3. **Tooltips de pilula nao mudam** - Descricoes fixas por tipo

### Pool Scaling
4. **PillPool layout flexivel** - Grid deve adaptar-se a 5-12 pilulas
5. **Feedback visual sutil** - Jogador percebe mais pilulas naturalmente
6. **Nova rodada banner** - Pode mostrar "Rodada X" ou "Rodada X (N pilulas)" para clareza
7. **Nao sobrecarregar tela** - maxCap de 12 garante que UI nao quebre

---

## Extensibilidade Futura

### Adicionar Novo Tipo de Pilula

1. Adicionar ao `PillType` em `pill.ts`
2. Adicionar regra em `PROGRESSION.rules`
3. Adicionar cor/label em `constants.ts`
4. Adicionar stats em `calculatePillStats()`
5. Adicionar logica em `applyPillEffect()` se necessario

### Modos de Jogo Alternativos

As configuracoes `ProgressionConfig` e `PoolScalingConfig` podem ser substituidas para criar modos:

**Progressao de Tipos:**
- **Hardcore:** Cianeto desde rodada 1
- **Casual:** Mais HEAL, menos FATAL
- **Infinito:** maxRound = 100, curva esticada

**Pool Scaling:**
```typescript
// Modo Rapido: menos pilulas, aumenta devagar
const FAST_MODE: PoolScalingConfig = {
  baseCount: 5,
  increaseBy: 1,
  frequency: 5,
  maxCap: 8,
}

// Modo Caos: muitas pilulas, aumenta rapido
const CHAOS_MODE: PoolScalingConfig = {
  baseCount: 7,
  increaseBy: 2,
  frequency: 2,
  maxCap: 16,
}

// Modo Classico: quantidade fixa (retrocompativel com sistema antigo)
const CLASSIC_MODE: PoolScalingConfig = {
  baseCount: 6,
  increaseBy: 0,
  frequency: 1,
  // sem maxCap necessario pois nao aumenta
}
```
