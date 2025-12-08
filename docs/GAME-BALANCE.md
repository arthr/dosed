# Game Balance: Sistema de Progressao de Pilulas

Este documento define a curva de dificuldade e a distribuicao proporcional das pilulas ao longo das rodadas, visando um equilibrio entre sorte e estrategia.

## 1. Tipos de Pilulas

| Codigo | Label | Efeito | Cor |
|--------|-------|--------|-----|
| SAFE | Placebo | Nenhum efeito | Verde |
| DMG_LOW | Veneno | -1 a -2 resistencia | Amarelo |
| DMG_HIGH | Toxina | -3 a -4 resistencia | Laranja |
| FATAL | Cianeto | Zera resistencia | Roxo |
| HEAL | Antidoto | +2 resistencia | Ciano |
| LIFE | Vida | +1 vida | Rosa |

---

## 2. Configuracao Atual (PROGRESSION)

Localizado em `src/utils/pillProgression.ts`:

```typescript
export const PROGRESSION: ProgressionConfig = {
  maxRound: 15,
  rules: {
    SAFE:     { unlockRound: 1, startPct: 45, endPct: 10 },
    DMG_LOW:  { unlockRound: 1, startPct: 30, endPct: 15 },
    DMG_HIGH: { unlockRound: 1, startPct: 15, endPct: 25 },
    HEAL:     { unlockRound: 2, startPct: 10, endPct: 15 },
    FATAL:    { unlockRound: 4, startPct: 5,  endPct: 18 },
    LIFE:     { unlockRound: 5, startPct: 5,  endPct: 10 },
  }
}
```

### Notas de Design:
- **Rodada 1**: Apenas SAFE, DMG_LOW, DMG_HIGH (sem HEAL/FATAL para tutorial suave)
- **Rodada 2**: HEAL desbloqueia como "valvula de escape"
- **Rodada 4**: FATAL desbloqueia (atraso intencional para buildup de tensao)
- **Rodada 5**: LIFE desbloqueia como recompensa rara de late game
- **maxRound 15**: Evita estagnacao em partidas longas

---

## 3. Pool Scaling (Quantidade de Pilulas)

Localizado em `src/utils/pillProgression.ts`:

```typescript
export const POOL_SCALING: PoolScalingConfig = {
  baseCount: 6,
  increaseBy: 1,
  frequency: 3,
  maxCap: 12,
}
```

### Tabela de Referencia:

| Rodadas | Pilulas |
|---------|---------|
| 1-3 | 6 |
| 4-6 | 7 |
| 7-9 | 8 |
| 10-12 | 9 |
| 13-15 | 10 |
| 16-18 | 11 |
| 19+ | 12 (cap) |

---

## 4. Distribuicao Proporcional por Rodada

O sistema usa **distribuicao proporcional** (nao sorteio). A porcentagem define a quantidade exata de cada tipo no pool.

### Rodada 1 (6 pilulas)

| Tipo | % Normalizado | Quantidade |
|------|---------------|------------|
| SAFE | ~50% | 3 |
| DMG_LOW | ~33% | 2 |
| DMG_HIGH | ~17% | 1 |
| HEAL | 0% | 0 |
| FATAL | 0% | 0 |

### Rodada 4 (7 pilulas)

| Tipo | % Normalizado | Quantidade |
|------|---------------|------------|
| SAFE | ~39% | 3 |
| DMG_LOW | ~27% | 2 |
| DMG_HIGH | ~18% | 1 |
| HEAL | ~11% | 1 |
| FATAL | ~5% | 0 |

### Rodada 10 (9 pilulas)

| Tipo | % Normalizado | Quantidade |
|------|---------------|------------|
| SAFE | ~24% | 2 |
| DMG_LOW | ~19% | 2 |
| DMG_HIGH | ~22% | 2 |
| HEAL | ~14% | 1 |
| FATAL | ~12% | 1 |

---

## 5. Funcoes Principais

### distributePillTypes(count, round)
Calcula a distribuicao proporcional de tipos para uma rodada.

### getPillCount(round)
Retorna a quantidade de pilulas baseado na rodada (step function).

### getPillChances(round)
Retorna as porcentagens normalizadas de cada tipo.

---

## 6. Ajustes de Balanceamento

Para ajustar a dificuldade, modifique `PROGRESSION` em `pillProgression.ts`:

### Jogo mais facil:
- Aumentar `startPct` de SAFE
- Aumentar `unlockRound` de FATAL
- Aumentar `endPct` de HEAL

### Jogo mais dificil:
- Diminuir `startPct` de SAFE
- Diminuir `unlockRound` de FATAL
- Aumentar `endPct` de DMG_HIGH e FATAL

---

## 7. Extensibilidade

O sistema suporta configs customizadas para modos alternativos:

```typescript
// Modo Classico (quantidade fixa)
const CLASSIC_SCALING: PoolScalingConfig = {
  baseCount: 6,
  increaseBy: 0,
  frequency: 1,
}

// Modo Hardcore (mais agressivo)
const HARDCORE: ProgressionConfig = {
  maxRound: 10,
  rules: {
    SAFE:     { unlockRound: 1, startPct: 30, endPct: 5 },
    DMG_LOW:  { unlockRound: 1, startPct: 35, endPct: 20 },
    DMG_HIGH: { unlockRound: 1, startPct: 20, endPct: 30 },
    HEAL:     { unlockRound: 3, startPct: 10, endPct: 10 },
    FATAL:    { unlockRound: 2, startPct: 5,  endPct: 25 },
    LIFE:     { unlockRound: 5, startPct: 5,  endPct: 10 },
  }
}
```
