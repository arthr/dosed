# Plano de Refatoracao - Core Loop N-Jogadores

**Data de Criacao:** 2024-12-11  
**Ultima Atualizacao:** 2024-12-11  
**Status:** Em Andamento

---

## Objetivo

Refatorar o Core Loop para:

1. **Decompor `gameStore.ts`** (~2359 linhas) em stores menores (~200-350 linhas cada)
2. **Generalizar para N jogadores** (2 a MAX_ROOM_PLAYERS), eliminando logica hardcoded `player1`/`player2`
3. **Preparar para Multiplayer** usando padrao "Optimistic UI + Authority" conforme `architecture.md`

> **Conceito Unificado (product.md):** O sistema trata todos como `Player`, diferenciados apenas pela origem das acoes (Local, Remoto ou Bot).

---

## Arquivos Afetados

### Criacao

| Arquivo | Descricao | Linhas Est. |
|---------|-----------|-------------|
| `src/utils/turnManager.ts` | Funcoes puras para rotacao de turnos | ~50 |
| `src/utils/playerManager.ts` | Helpers para N jogadores | ~80 |
| `src/stores/game/pillPoolStore.ts` | Pool de pilulas, consumo, reveal | ~250 |
| `src/stores/game/inventoryStore.ts` | Itens, selecao, uso | ~200 |
| `src/stores/game/playerStore.ts` | Vidas, resistencia | ~200 |
| `src/stores/game/gameFlowStore.ts` | Fases, turnos, rodadas | ~300 |

### Modificacao

| Arquivo | Mudanca |
|---------|---------|
| `src/types/player.ts` | `PlayerId` -> `string` (dinamico) |
| `src/types/game.ts` | `players: Record<string, Player>` |
| `src/utils/constants.ts` | Adicionar `MAX_ROOM_PLAYERS`, `MIN_PLAYERS` |
| `src/stores/game/effectsStore.ts` | Generalizar para N jogadores |
| `src/stores/game/shopStore.ts` | Generalizar para N jogadores |
| `src/stores/gameStore.ts` | Reduzir para orquestracao (~350 linhas) |

### Adaptacao

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useItemUsage.ts` | Usar novos stores |
| `src/hooks/usePillConsumption.ts` | Usar novos stores |
| `src/hooks/useGameActions.ts` | Usar gameFlowStore |

---

## Diagnostico

### Violacao de Fronteiras
- [x] **OK** - UI acessa apenas Hooks, nao Stores diretamente

### Acoplamento Oculto
- [!] `gameStore.ts` tem 2359 linhas - mudancas em qualquer area afetam todo o arquivo
- [!] Logica de turnos hardcoded quebra ao adicionar 3+ jogadores

### Complexidade Desnecessaria
- [!] `player1`/`player2` hardcoded em ~56 locais
- [!] Stores extraidos (`effectsStore`, `shopStore`) ainda usam estrutura fixa

### Codigo Hardcoded (player1/player2)

```typescript
// gameStore.ts:627 - Turnos binarios
currentTurn === 'player1' ? 'player2' : 'player1'

// effectsStore.ts:75-78 - Estado inicial fixo
activeEffects: { player1: [], player2: [] }

// shopStore.ts:107-112 - Estrutura fixa
confirmed: { player1: false, player2: false }
```

---

## Passo a Passo (Checklist)

### Fase 1: Preparacao (Types e Interfaces)

- [x] **1.1** Criar pasta `stores/game/` com `index.ts`
- [x] **1.2** Criar pasta `stores/multiplayer/` com `index.ts`
- [x] **1.3** Criar pasta `services/sync/` e `services/realtime/` com placeholders
- [x] **1.4** Testes unitarios para `pillGenerator.ts` e `questGenerator.ts`
- [x] **1.5** Definir constantes em `utils/constants.ts`:
  ```typescript
  export const MIN_PLAYERS = 2
  export const MAX_ROOM_PLAYERS = 4  // Limite razoavel para UX
  ```
- [x] **1.6** Atualizar `types/player.ts`, depois migrar para `utils/playerManager.ts` (local correto):
  ```typescript
  // DE: export type PlayerId = 'player1' | 'player2'
  // PARA:
  export type PlayerId = string
  export function isValidPlayerId(id: string): boolean
  export function generatePlayerId(index: number): PlayerId
  ```

### Fase 2: Migracao (Funcoes Puras para Utils)

- [x] **2.1** Criar `utils/turnManager.ts` (funcoes puras):
  ```typescript
  /** Retorna proximo jogador na rotacao */
  export function getNextTurn(
    currentTurn: PlayerId,
    playerOrder: PlayerId[],
    alivePlayers?: PlayerId[]
  ): PlayerId

  /** Retorna jogadores que podem ser alvos */
  export function getTargetablePlayers(
    currentPlayer: PlayerId,
    allPlayers: PlayerId[]
  ): PlayerId[]
  ```
- [x] **2.2** Criar `utils/playerManager.ts` (funcoes puras):
  ```typescript
  /** Gera ID unico para jogador */
  export function generatePlayerId(index: number): PlayerId

  /** Cria estado inicial para N jogadores */
  export function createInitialPlayersState(
    playerConfigs: PlayerConfig[]
  ): Record<PlayerId, Player>
  ```
- [x] **2.3** Criar testes unitarios para `turnManager.ts` (20 testes)
- [x] **2.4** Criar testes unitarios para `playerManager.ts` (26 testes)

### Fase 3: Extracao de Stores

**Estrategia DUAL-WRITE:** gameStore continua sendo fonte da verdade durante migracao.

- [x] **3.1** Generalizar `effectsStore.ts` para N jogadores:
  - Mudar `activeEffects` para `Record<string, PlayerEffect[]>`
  - Adicionar `initializeForPlayers(playerIds: PlayerId[])`
  - Atualizar testes (28 testes passando)

- [x] **3.2** Generalizar `shopStore.ts` para N jogadores:
  - Parametrizar `openShop(timerDuration, playerIds: PlayerId[])`
  - Mudar `confirmed`, `pendingBoosts`, `cart` para dinamicos
  - Atualizar testes (39 testes passando)

- [x] **3.3** Extrair `pillPoolStore.ts`:
  - Estado: `pillPool`, `revealedPills`, `typeCounts`, `shapeCounts`
  - Actions: `generatePool`, `setPool`, `consumePill`, `revealPillById`, `invertPill`, `doublePill`, `clearPillModifiers`
  - Criar testes unitarios (35 testes passando)

- [ ] **3.4** Extrair `inventoryStore.ts`:
  - Estado: `inventory` (por jogador), `selectedItems`, `targetSelection`
  - Actions: `selectItem`, `deselectItem`, `useItem`, `addItem`, `removeItem`
  - Criar testes unitarios

- [ ] **3.5** Extrair `playerStore.ts`:
  - Estado: `players` (vidas, resistencia, maxResistance)
  - **IMPORTANTE:** Adicionar campo `userId: string | null` ao tipo `Player`
    - `null` = Guest ou Bot (sem persistencia)
    - `string` = UUID do Supabase Auth (com persistencia)
  - Actions: `applyDamage`, `heal`, `loseLife`, `gainLife`, `resetResistance`
  - Criar testes unitarios

- [ ] **3.6** Extrair `gameFlowStore.ts`:
  - Estado: `phase`, `round`, `currentTurn`, `playerOrder`, `winner`
  - Actions: `startGame`, `endGame`, `nextTurn`, `nextRound`
  - Usar `turnManager.getNextTurn()` internamente
  - Criar testes unitarios

### Fase 4: Integracao (Conectar via Hooks)

- [ ] **4.1** Refatorar `gameStore.ts` para orquestracao:
  - Delegar para stores especificos
  - Manter retrocompatibilidade via re-exports
  - Meta: < 350 linhas

- [ ] **4.2** Atualizar `useItemUsage.ts`:
  - Usar `getTargetablePlayers()` para validTargets
  - Retornar array de alvos (nao apenas 1)

- [ ] **4.3** Atualizar `usePillConsumption.ts`:
  - Usar `getNextTurn()` para rotacao
  - Suportar N jogadores

- [ ] **4.4** Criar hook `useTargetablePlayers()`:
  - Substituir `useOpponent()` (deprecar, nao remover)
  - Retornar `PlayerId[]`

### Fase 5: Limpeza

- [ ] **5.1** Remover codigo duplicado entre gameStore e stores especificos
- [ ] **5.2** Remover re-exports desnecessarios apos validacao
- [ ] **5.3** Atualizar `architecture.md` com novos stores
- [ ] **5.4** Marcar `useOpponent()` como `@deprecated`
- [ ] **5.5** Atualizar ADR-001 com status "Implementado"

---

## Verificacao de Risco (Safety Check)

### Pre-Implementacao

- [x] Adiciona biblioteca npm? **NAO**
- [x] Cria pastas fora do padrao `structure.md`? **NAO**
- [x] Mistura UI com Logica? **NAO** - Stores sao logica pura

### Testes Manuais Necessarios

| Fase | Cenario | Criticidade |
|------|---------|-------------|
| 2.1-2.4 | Testes unitarios das funcoes helper | Alta |
| 3.1-3.2 | Shield/Handcuffs/Shop funcionam (2 jogadores) | Alta |
| 3.3-3.6 | Fluxo completo single player | Critica |
| 4.1-4.4 | Jogo completo com 2 jogadores (regressao) | Critica |
| 4.1-4.4 | Jogo com 3-4 jogadores (novo) | Alta |

### Multiplayer (Validar Separadamente)

- [ ] Sincronizacao de efeitos
- [ ] Sincronizacao de consumo
- [ ] Sincronizacao de turnos N jogadores
- [ ] Reconexao mantem estado

---

## Riscos e Mitigacoes

| Risco | Prob. | Impacto | Mitigacao |
|-------|-------|---------|-----------|
| Quebrar single player | Media | Critico | DUAL-WRITE: manter gameStore funcional |
| Quebrar multiplayer | Alta | Critico | Testar sync apos cada fase |
| Performance N jogadores | Baixa | Baixo | Zustand e eficiente |
| UI nao preparada | Alta | Alto | UI em spec separada |

---

## Metricas de Sucesso

| Metrica | Atual | Meta |
|---------|-------|------|
| Linhas `gameStore.ts` | 2359 | < 350 |
| Stores > 500 linhas | 1 | 0 |
| Refs hardcoded `player1`/`player2` | ~56 | 0 |
| Cobertura testes stores/game | ~10% | > 70% |
| Suporte 3+ jogadores | NAO | SIM |

---

## Proximos Passos

1. **IMEDIATO:** Fase 1.5-1.6 (Constantes e Types)
2. **DEPOIS:** Fase 2.1-2.4 (Funcoes puras em utils)
3. **CONTINUAR:** Fase 3.1-3.6 (Generalizar e extrair stores)
4. **FUTURO:** UI para N jogadores (spec separada)

---

## Referencias

- [ADR-001: Store Decomposition](.specs/refactor-game-store/ADR-001-store-decomposition.md)
- [Architecture Rules](.cursor/rules/architecture.md) - Padrao "Optimistic UI + Authority"
- [Product Rules](.cursor/rules/product.md) - Conceito Unificado de Player
- [Structure Rules](.cursor/rules/structure.md) - Localizacao de arquivos

---

> **NOTA:** O jogo permanece funcional (2 jogadores) durante todo o processo. A UI para N jogadores sera tratada em spec separada.

---

## Consideracoes Futuras (Producao)

### Sistema de Autenticacao (Spec Futura: `user-auth-system`)

Durante este refactor, estamos preparando a arquitetura para futuro sistema de auth:

#### Separacao de Conceitos

| Conceito | Tipo | Fonte | Persistente | Uso |
|----------|------|-------|-------------|-----|
| **PlayerId** | `string` | Gerado na partida | Nao | Turnos, logica de jogo |
| **UserId** | UUID | Supabase Auth | Sim | Perfil, historico, ranking |

#### Campo `Player.userId`

Sera adicionado na **Fase 3.5** com valor `string | null`:
- `null` = Guest ou Bot (joga sem cadastro, sem persistencia)
- `string` = Usuario autenticado (stats, ranking, conquistas)

#### Funcionalidades por Tipo de Usuario

| Funcionalidade | Guest (`null`) | Autenticado (UUID) |
|----------------|:--------------:|:------------------:|
| Jogar Single Player | Sim | Sim |
| Jogar Multiplayer | Sim | Sim |
| Salvar progresso | Nao | Sim |
| Ranking/Leaderboard | Nao | Sim |
| Conquistas | Nao | Sim |
| Partidas "ranked" | Nao | Sim |
| Estatisticas globais | Nao | Sim |

#### Beneficios para Producao

- **Login social** (Google, Discord, Twitch) via Supabase Auth
- **Guest-First** - Jogador experimenta sem cadastro, converte depois
- **Compartilhamento** em redes sociais
- **Gamificacao** - Temporadas, badges, rewards
- **Anti-cheat** - Partidas ranked exigem auth
- **Viral loop** - Convites, referrals

> **IMPORTANTE:** Nao implementar auth agora. Apenas garantir que `PlayerId` (sessao) e `UserId` (identidade) sejam conceitos separados.
