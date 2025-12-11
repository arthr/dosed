# Plano de Refatoracao - Core Loop N-Jogadores

**Data de Criacao:** 2024-12-11  
**Ultima Atualizacao:** 2024-12-11  
**Status:** Em Andamento (Fase 2 - Revisao)

---

## Objetivo

Refatorar o Core Loop do jogo para:

1. **Decompor `gameStore.ts`** (~2359 linhas) em stores menores e focados (~200-350 linhas cada)
2. **Generalizar para N jogadores** (2 a MAX_ROOM_PLAYERS), eliminando logica hardcoded de 1v1
3. **Manter simplicidade** - Codigo obvio para um desenvolvedor solo

> **Escopo Expandido:** Alem da decomposicao do store, este refactor prepara a arquitetura para salas de 2+ jogadores, abandonando a logica fixa `player1` vs `player2`.

---

## Pontos de Falha com 3+ Jogadores (Diagnostico)

### Lógica de Turnos
| Local | Codigo Atual | Problema |
|-------|--------------|----------|
| `gameStore.ts:627` | `currentTurn === 'player1' ? 'player2' : 'player1'` | Binario, nao rotaciona |
| `gameStore.ts:545` | `state.currentTurn === 'player1' ? 'player2' : 'player1'` | Proximo turno fixo |
| `gameStore.ts:479` | `consumerId === 'player1' ? 'player2' : 'player1'` | Winner binario |

### Estrutura de Jogadores
| Local | Codigo Atual | Problema |
|-------|--------------|----------|
| `types/player.ts:6` | `PlayerId = 'player1' \| 'player2'` | Union type fixa |
| `gameStore.ts:202-203` | `players: { player1, player2 }` | Estrutura fixa |
| `gameStore.ts:325` | `players: { player1, player2 }` | initGame fixo |

### Conceito de "Opponent"
| Local | Codigo Atual | Problema |
|-------|--------------|----------|
| `gameStore.ts:970` | `opponentId = currentPlayerId === 'player1' ? 'player2' : 'player1'` | 1 oponente unico |
| `gameStore.ts:2255-2257` | `useOpponent()` hook | Retorna apenas 1 |
| `types/item.ts` | `targetType: 'opponent'` | Implica 1 alvo |

### Stores Extraidos (Parcialmente Hardcoded)
| Store | Linhas Hardcoded | Status |
|-------|------------------|--------|
| `effectsStore.ts:75-78` | `activeEffects: { player1: [], player2: [] }` | Precisa generalizar |
| `effectsStore.ts:125-128` | `removeEffectFromAll` com player1/player2 | Precisa generalizar |
| `shopStore.ts:107-112` | `createInitialStoreState` com player1/player2 | Precisa generalizar |

---

## Arquivos Afetados

### Criacao (~6 arquivos de stores)

| Arquivo | Status | Descricao |
|---------|--------|-----------|
| `stores/game/effectsStore.ts` | PARCIAL | Efeitos de jogador (precisa N-players) |
| `stores/game/shopStore.ts` | PARCIAL | Pill Store (precisa N-players) |
| `stores/game/pillPoolStore.ts` | PENDENTE | Pool de pilulas, consumo, reveal |
| `stores/game/inventoryStore.ts` | PENDENTE | Itens, selecao, uso |
| `stores/game/playerStore.ts` | PENDENTE | Vidas, resistencia, maximos |
| `stores/game/gameFlowStore.ts` | PENDENTE | Fases, turnos, rodadas, winner |

### Modificacao (Types e Constantes)

| Arquivo | Mudanca | Prioridade |
|---------|---------|------------|
| `types/player.ts` | `PlayerId` -> string dinamico | CRITICA |
| `utils/constants.ts` | Adicionar `MAX_ROOM_PLAYERS` | CRITICA |
| `types/game.ts` | `players: Record<string, Player>` | ALTA |

### Refatoracao (~3 arquivos)

| Arquivo | Linhas Atuais | Meta | Status |
|---------|---------------|------|--------|
| `stores/gameStore.ts` | 2359 | < 350 (orquestracao) | PENDENTE |
| `hooks/useItemUsage.ts` | ~200 | Adaptar para N-players | PENDENTE |
| `hooks/usePillConsumption.ts` | ~150 | Adaptar para N-players | PENDENTE |

---

## Passo a Passo (Checklist)

### Fase 1: Preparacao (Baixo Risco) - COMPLETA

- [x] **1.1** Criar pasta `stores/game/` com `index.ts`
- [x] **1.2** Criar pasta `stores/multiplayer/` com `index.ts`
- [x] **1.3** Criar pasta `services/sync/` e `services/realtime/` com placeholders
- [x] **1.4** Adicionar testes unitarios para `pillGenerator.ts` e `questGenerator.ts`

### Fase 2: Fundacao N-Jogadores (NOVA - Alta Prioridade)

- [ ] **2.0** Definir constantes de limites de jogadores
  - Criar `MAX_ROOM_PLAYERS` em `utils/constants.ts`
  - Criar `MIN_PLAYERS = 2`
  - Documentar limite razoavel (ex: 4 ou 6 jogadores)

- [ ] **2.1** Generalizar tipo `PlayerId`
  - Mudar de `'player1' | 'player2'` para `string`
  - Criar helper `generatePlayerId(index: number): string`
  - Criar type guard `isValidPlayerId(id: string): boolean`

- [ ] **2.2** Criar funcao `getNextTurn()`
  - Assinatura: `(currentTurn: PlayerId, playerOrder: PlayerId[]) => PlayerId`
  - Logica circular: `playerOrder[(currentIndex + 1) % playerOrder.length]`
  - Considerar jogadores eliminados (filtrar `lives > 0`)

- [ ] **2.3** Criar funcao `getTargetablePlayers()`
  - Assinatura: `(currentPlayer: PlayerId, allPlayers: PlayerId[]) => PlayerId[]`
  - Exclui jogador atual
  - Exclui jogadores eliminados
  - Retorna array (permite multi-target futuro)

### Fase 3: Extracao de Stores de Dominio (Medio Risco)

**Estrategia:** DUAL-WRITE - gameStore continua sendo fonte da verdade durante migracao.

- [ ] **3.1** Atualizar `effectsStore.ts` para N-jogadores
  - Mudar `activeEffects` de `{ player1, player2 }` para `Record<PlayerId, PlayerEffect[]>`
  - Inicializar dinamicamente no `reset()`
  - Parametrizar `removeEffectFromAll` para iterar todos jogadores
  - Atualizar testes unitarios

- [ ] **3.2** Atualizar `shopStore.ts` para N-jogadores
  - Mudar `confirmed`, `pendingBoosts`, `cart` para `Record<PlayerId, T>`
  - Parametrizar `openShop(timerDuration, playerIds: PlayerId[])`
  - Atualizar `clearPendingBoosts` para iterar todos jogadores
  - Atualizar testes unitarios

- [ ] **3.3** Extrair `pillPoolStore.ts` do gameStore
  - Estado: `pillPool`, `revealedPills`, `typeCounts`, `shapeCounts`
  - Actions: `generatePool`, `consumePill`, `revealPill`, `shuffle`, `discard`
  - Criar testes unitarios

- [ ] **3.4** Extrair `inventoryStore.ts` do gameStore
  - Estado: `inventory` (por jogador), `selectedItems`, `targetSelection`
  - Actions: `selectItem`, `deselectItem`, `useItem`, `addItem`, `removeItem`
  - Criar testes unitarios

- [ ] **3.5** Extrair `playerStore.ts` do gameStore
  - Estado: `players` (vidas, resistencia, maxResistance)
  - Actions: `applyDamage`, `heal`, `loseLife`, `gainLife`, `resetResistance`
  - Criar testes unitarios

- [ ] **3.6** Extrair `gameFlowStore.ts` do gameStore
  - Estado: `phase`, `round`, `currentTurn`, `playerOrder`, `winner`
  - Actions: `startGame`, `endGame`, `nextTurn`, `nextRound`, `resetGame`
  - **IMPORTANTE:** Usar `getNextTurn()` da Fase 2.2
  - Criar testes unitarios

### Fase 4: Refatorar gameStore (Medio Risco)

- [ ] **4.1** Refatorar `initGame()` para N-jogadores
  - Parametro `playerConfigs: PlayerConfig[]` em vez de `player1`/`player2`
  - Gerar `playerOrder` dinamicamente
  - Inicializar stores filhos com lista de playerIds

- [ ] **4.2** Refatorar `consumePill()` para N-jogadores
  - Usar `getNextTurn()` em vez de ternario
  - Verificar eliminacao em loop (pode haver multiplos eliminados)

- [ ] **4.3** Refatorar `executeItem()` para N-jogadores
  - Substituir `opponentId` por `getTargetablePlayers()`
  - Items como Force Feed precisam de selector de alvo explicito

- [ ] **4.4** Refatorar `checkAndStartShopping()` para N-jogadores
  - Verificar `wantsStore` de todos jogadores
  - Inicializar storeState com todos playerIds

### Fase 5: Adaptacao de Hooks (Baixo Risco)

- [ ] **5.1** Atualizar `useOpponent()` -> `useTargetablePlayers()`
  - Retornar array em vez de unico
  - Manter `useOpponent()` deprecado para retrocompatibilidade temporaria

- [ ] **5.2** Atualizar `useItemUsage.ts` para usar stores especificos
  - Adaptar `validTargets` para array de playerIds

- [ ] **5.3** Atualizar `usePillConsumption.ts` para usar stores especificos

- [ ] **5.4** Atualizar `useGameActions.ts` para usar gameFlowStore

- [ ] **5.5** Verificar que todos os componentes funcionam via hooks

### Fase 6: Limpeza (Baixo Risco)

- [ ] **6.1** Remover codigo duplicado entre gameStore e stores especificos
- [ ] **6.2** Remover re-exports desnecessarios apos migracao completa
- [ ] **6.3** Atualizar documentacao de arquitetura (`architecture.md`)
- [ ] **6.4** Atualizar ADR-001 com status "Implementado"
- [ ] **6.5** Remover referencias deprecadas a `player1`/`player2` hardcoded

---

## Verificacao de Risco (Safety Check)

### Pre-Implementacao

- [x] Adiciona alguma biblioteca npm? **NAO** - Usa apenas Zustand existente
- [x] Cria pastas fora do padrao `structure.md`? **NAO**
- [x] Mistura UI com Logica? **NAO** - Stores sao logica pura

### Testes Manuais Necessarios (por fase)

| Fase | Cenario de Teste | Criticidade |
|------|------------------|-------------|
| 2.1-2.3 | Testes unitarios das funcoes helper | Alta |
| 3.1 | Shield bloqueia dano, Handcuffs pula turno (2-4 jogadores) | Alta |
| 3.2 | Abrir loja, checkout, boosts aplicados (2-4 jogadores) | Alta |
| 3.3 | Consumir pilula, revelar com Scanner, Shuffle funciona | Critica |
| 3.4 | Selecionar/usar itens, Force Feed com target selector | Critica |
| 3.5 | Perder vida, ganhar vida, resistencia zera = perde vida | Critica |
| 3.6 | Transicoes de fase, turnos rotacionando (3+ jogadores) | Critica |
| 4.1-4.4 | Jogo completo com 2, 3 e 4 jogadores | Critica |

### Multiplayer (Validar apos Fase 5)

- [ ] Sincronizacao de efeitos com N jogadores
- [ ] Sincronizacao de consumo de pilula
- [ ] Sincronizacao de uso de itens
- [ ] Reconexao mantem estado consistente

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| Quebrar sincronizacao multiplayer | Alta | Critico | DUAL-WRITE: gameStore continua emitindo eventos |
| Regressao em single player | Media | Alto | Manter testes de 2 jogadores como baseline |
| Performance (N jogadores) | Baixa | Baixo | Zustand e eficiente, stores pequenos |
| Dependencias circulares | Media | Medio | Usar `getState()` em vez de hooks internos |
| UI nao preparada para N jogadores | Alta | Alto | Escopo de UI em spec separada |

---

## Metricas de Sucesso

| Metrica | Atual | Meta | Status |
|---------|-------|------|--------|
| Linhas no `gameStore.ts` | 2359 | < 350 | PENDENTE |
| Stores com > 500 linhas | 1 | 0 | PENDENTE |
| Cobertura de testes (stores/game) | ~10% | > 70% | EM ANDAMENTO |
| Hardcoded `player1`/`player2` | ~56 refs | 0 | PENDENTE |
| Suporte a 3+ jogadores | NAO | SIM | PENDENTE |

---

## Proximos Passos

1. **IMEDIATO:** Fase 2.0-2.3 (Fundacao N-Jogadores)
2. **DEPOIS:** Fase 3.1-3.2 (Generalizar stores existentes)
3. **CONTINUAR:** Fase 3.3-3.6 (Extrair stores restantes)
4. **FUTURO:** Camada de Sincronizacao em spec separada (`mp-sync-refactor`)

---

## Referencias

- [ADR-001: Store Decomposition](.specs/refactor-game-store/ADR-001-store-decomposition.md)
- [Architecture Rules](.cursor/rules/architecture.md)
- [Zustand Best Practices](https://docs.pmnd.rs/zustand/guides/practice-with-no-store-actions)

---

> **NOTA:** Esta refatoracao e incremental. O jogo permanece funcional (modo 2 jogadores) durante todo o processo gracas ao padrao DUAL-WRITE. A UI para N jogadores sera tratada em spec separada.
