# Requirements: Sistema de Progressao Dinamica de Pilulas

## Visao Geral
Sistema de balanceamento que ajusta dinamicamente a distribuicao de probabilidades e a quantidade de pilulas com base na rodada atual, criando uma curva de dificuldade progressiva que transiciona de "seguro" para "caos controlado".

O sistema possui dois eixos de progressao:
1. **Progressao de Tipos**: Probabilidades de cada tipo de pilula mudam por rodada
2. **Progressao de Quantidade**: O pool de pilulas cresce em degraus conforme as rodadas avancam

> **Referencia:** Especificacao completa em `docs/GAME-BALANCE.md`

---

## Requisitos Funcionais

### RF-001: Progressao por Rodada
**EARS:** O sistema DEVE calcular as probabilidades de cada tipo de pilula com base no numero da rodada atual.

**Criterios:**
- Rodadas iniciais (1-2): Predominancia de pilulas seguras (Placebo, Veneno)
- Rodadas intermediarias (3-5): Introducao gradual de Toxina, Antidoto e Cianeto
- Rodadas tardias (6-10): Aumento de letalidade, introducao opcional de Vida

**Mapeamento de Tipos:**
| Tipo Interno | Nome Display | Desbloqueio |
|--------------|--------------|-------------|
| SAFE         | Placebo      | Rodada 1    |
| DMG_LOW      | Veneno       | Rodada 1    |
| DMG_HIGH     | Toxina       | Rodada 3    |
| HEAL         | Antidoto     | Rodada 3    |
| FATAL        | Cianeto      | Rodada 5    |
| LIFE         | Vida         | Rodada 8*   |

> *LIFE e uma feature futura, implementada mas desativada por padrao.

---

### RF-002: Interpolacao Linear de Probabilidades
**EARS:** O sistema DEVE usar interpolacao linear (lerp) para calcular a transicao suave de probabilidades entre o desbloqueio e a rodada final.

**Formula:**
```
probabilidade = startPct + (endPct - startPct) * t
onde t = (rodadaAtual - unlockRound) / (maxRound - unlockRound)
```

**Exemplo - Placebo:**
- unlockRound: 1, startPct: 70%, endPct: 10%
- Rodada 1: 70%
- Rodada 5: ~40%
- Rodada 10: 10%

---

### RF-003: Normalizacao Automatica
**EARS:** O sistema DEVE normalizar as probabilidades calculadas para garantir que a soma seja sempre 100%.

**Criterios:**
- Soma de todas as probabilidades deve ser exatamente 100%
- Arredondamento para 2 casas decimais
- Tipos nao desbloqueados tem probabilidade 0%

---

### RF-004: Configuracao Centralizada
**EARS:** O sistema DEVE fornecer uma configuracao centralizada (Single Source of Truth) para todos os parametros de balanceamento.

**Estrutura de Configuracao:**
```typescript
interface ProgressionConfig {
  maxRound: number
  rules: Record<PillType, {
    unlockRound: number
    startPct: number
    endPct: number
  }>
}
```

**Criterios:**
- Todos os parametros de balanceamento em um unico objeto
- Alteracoes de tunning nao requerem mudancas em logica
- Permite desativar tipos via `endPct: 0`

---

### RF-005: Novo Tipo de Pilula - LIFE (Feature Flag)
**EARS:** O sistema DEVE suportar um novo tipo de pilula LIFE que recupera vidas perdidas.

**Efeito:**
- Recupera +1 vida (ate o maximo de vidas)
- NAO afeta resistencia

**Feature Flag:**
- Implementado no codigo
- Desativado por padrao (`endPct: 0` ou `unlockRound > maxRound`)
- Pode ser ativado alterando configuracao

---

### RF-006: Compatibilidade com Sistema Existente
**EARS:** O sistema DEVE manter compatibilidade total com:
- Itens que modificam pilulas (Scanner, Inverter, Double)
- Logica de consumo e efeitos
- TypeCounts e exibicao publica

**Criterios:**
- `generatePillPool()` continua funcionando com mesmo retorno
- Todos os hooks e componentes existentes funcionam sem alteracao
- Testes existentes permanecem validos

---

### RF-007: Escalonamento de Quantidade de Pilulas (Pool Scaling)
**EARS:** O sistema DEVE ajustar a quantidade de pilulas no pool usando uma Step Function baseada na rodada atual.

**Comportamento Step Function:**
- A quantidade aumenta em degraus, nao linearmente
- O aumento ocorre a cada X rodadas (frequencia configuravel)
- Existe um limite maximo para proteger UI e performance

**Formula:**
```
pillCount = baseCount + floor((round - 1) / frequency) * increaseBy
pillCount = min(pillCount, maxCap)
```

**Estrutura de Configuracao:**
```typescript
interface PoolScalingConfig {
  /** Quantidade inicial de pilulas na rodada 1 */
  baseCount: number
  /** Quantas pilulas adicionar a cada ciclo */
  increaseBy: number
  /** A cada quantas rodadas o aumento acontece */
  frequency: number
  /** Limite maximo para nao quebrar UI */
  maxCap?: number
}
```

**Exemplo - Configuracao Padrao:**
```
baseCount: 5, increaseBy: 1, frequency: 3, maxCap: 12

Rodada 1-3:  5 pilulas
Rodada 4-6:  6 pilulas
Rodada 7-9:  7 pilulas
Rodada 10-12: 8 pilulas
...
Rodada 22+: 12 pilulas (cap)
```

**Criterios:**
- Quantidade inicial configuravel (padrao: 5)
- Incremento configuravel (padrao: +1)
- Frequencia de incremento configuravel (padrao: a cada 3 rodadas)
- Limite maximo respeitado (padrao: 12)
- Funcao pura e deterministica

---

## Requisitos Nao-Funcionais

### RNF-001: Performance
- Calculo de probabilidades deve ser O(n) onde n = numero de tipos
- Geracao de pool nao deve adicionar latencia perceptivel (< 5ms)

### RNF-002: Extensibilidade
- Adicionar novo tipo de pilula deve requerer apenas:
  1. Adicionar ao enum PillType
  2. Adicionar regra em PROGRESSION
  3. Adicionar visual em constants.ts

### RNF-003: Testabilidade
- Funcoes de calculo devem ser puras (sem side effects)
- Config customizavel para testes

### RNF-004: Retrocompatibilidade
- Comportamento da rodada 1 deve ser similar ao sistema atual
- Jogadores existentes nao devem perceber mudanca drastica inicial

---

## Criterios de Aceitacao

### Progressao de Tipos
- [ ] Probabilidades mudam conforme rodada avanca
- [ ] Tipos sao desbloqueados na rodada correta
- [ ] Soma de probabilidades sempre igual a 100%
- [ ] Tipo LIFE implementado mas desativado
- [ ] Configuracao centralizada em PROGRESSION

### Pool Scaling
- [ ] Quantidade de pilulas aumenta em degraus
- [ ] Frequencia de aumento configuravel
- [ ] Limite maximo (cap) respeitado
- [ ] Configuracao centralizada em POOL_SCALING

### Geral
- [ ] Geracao de pilulas usa rodada atual para tipo E quantidade
- [ ] Testes unitarios para funcoes de calculo
- [ ] Comportamento de IA nao afetado
- [ ] UI de PillPool adapta-se a quantidades variaveis

---

## Dependencias

### Features Existentes
- Sistema de rodadas (gameStore.round)
- Geracao de pilulas (pillGenerator.ts)
- Logica de efeitos (gameLogic.ts)

### Arquivos Afetados
- `src/types/pill.ts` - Adicionar tipo LIFE
- `src/utils/constants.ts` - Adicionar cores/labels para LIFE, remover pillsPerRound fixo
- `src/utils/pillGenerator.ts` - Refatorar para usar progressao de tipos
- `src/utils/pillProgression.ts` - NOVO: Logica de interpolacao e pool scaling
- `src/stores/gameStore.ts` - Usar getPillCount() para quantidade dinamica
- `src/components/game/PillPool.tsx` - Adaptar layout para quantidade variavel
