# Plano de Refatoracao - Arquitetura do Jogo (Multiplayer-First)

**Data:** 2024-12-11
**Autor:** Senior Web Game Developer Review
**Escopo:** Revisao completa da arquitetura com foco em multiplayer

---

## 1. Diagnostico Geral

### 1.1 Pontos Fortes (Manter)

| Area | Descricao |
|------|-----------|
| **Estrutura de Pastas** | Separacao clara por dominio (components, hooks, stores, types, utils) |
| **Estado Centralizado** | Zustand bem aplicado com stores dedicados |
| **Tipagem TypeScript** | Modo strict, interfaces claras, types separados |
| **Sistema de Eventos** | `GameEventType` bem definido com union types |
| **Hooks Customizados** | Boa separacao de responsabilidades (usePillConsumption, useItemUsage) |
| **Pattern Multiplayer** | Flag `isSyncingFromRemote` evita loops de sincronizacao |
| **Progressao de Jogo** | Sistema de rodadas, quests e loja bem estruturado |

### 1.2 Problemas Identificados (Code Smells)

#### A. `gameStore.ts` - God Object (~2300 linhas)
- **Violacao:** Single Responsibility Principle (SRP)
- **Impacto:** Dificil de manter, testar e debugar
- **Sintomas:**
  - Mistura logica de jogo single-player com multiplayer
  - Gerencia pilulas, itens, loja, efeitos, sync em um unico arquivo
  - Switch gigante em `applyRemoteEvent()` (~200 linhas)
  - Import dinamico para evitar dependencia circular

#### B. Acoplamento Circular
- **Violacao:** Dependency Inversion Principle (DIP)
- **Impacto:** Fragilidade arquitetural, dificil refatorar
- **Sintomas:**
  ```
  gameStore.ts ──(import dinamico)──> multiplayerStore.ts
  multiplayerStore.ts ──(import)──> gameStore.ts
  ```

#### C. Logica de Sincronizacao Espalhada
- **Violacao:** DRY (Don't Repeat Yourself)
- **Impacto:** Dificil garantir consistencia entre clientes
- **Sintomas:**
  - `emitMultiplayerEvent()` chamado em 15+ lugares
  - Cada action precisa "saber" que esta em multiplayer
  - Nenhuma camada de abstracao para sync

#### D. `realtimeService.ts` - Muito Basico
- **Violacao:** Robustez para producao
- **Impacto:** Desconexoes nao tratadas graciosamente
- **Sintomas:**
  - Sem retry automatico
  - Sem queue de eventos offline
  - Sem reconciliacao de estado apos reconexao

#### E. `multiplayerStore.ts` - Responsabilidades Mistas
- **Violacao:** SRP
- **Impacto:** Dificil testar e evoluir
- **Sintomas:**
  - Estado de conexao + Estado de sala + Heartbeat + Event handlers
  - ~850 linhas com muita logica de negocio

#### F. Tipagem Incompleta em Eventos
- **Violacao:** Type Safety
- **Impacto:** Runtime errors, casts desnecessarios
- **Sintomas:**
  - `payload as Record<string, unknown>` em varios lugares
  - Discriminated unions nao usadas consistentemente

---

## 2. Objetivo da Refatoracao

Transformar a arquitetura em um design **Multiplayer-First** onde:

1. **Sincronizacao e transparente** - Actions nao precisam saber se estao em multiplayer
2. **Estado e previsivel** - Qualquer acao leva ao mesmo estado em ambos clientes
3. **Testabilidade** - Stores pequenos e focados, facil de mockar
4. **Robustez** - Reconexao, retry e reconciliacao automaticos

---

## 3. Arquitetura Proposta

### 3.1 Nova Estrutura de Stores

```
stores/
├── game/
│   ├── index.ts              # Re-export + combined hooks
│   ├── gameFlowStore.ts      # Fases, turnos, rodadas, winner
│   ├── pillPoolStore.ts      # Pool de pilulas, consumo, reveal
│   ├── playerStore.ts        # Estado dos jogadores, vidas, resistencia
│   ├── inventoryStore.ts     # Inventario, selecao de itens, uso
│   ├── effectsStore.ts       # Efeitos de jogador (shield, handcuffs)
│   └── shopStore.ts          # Pill Store, carrinho, boosts
├── multiplayer/
│   ├── index.ts              # Re-export
│   ├── connectionStore.ts    # Status de conexao, reconnect
│   ├── roomStore.ts          # Estado da sala, jogadores
│   └── syncStore.ts          # Fila de eventos, reconciliacao
└── ui/
    ├── overlayStore.ts       # (manter)
    └── toastStore.ts         # (manter)
```

### 3.2 Nova Estrutura de Servicos

```
services/
├── index.ts
├── realtime/
│   ├── realtimeService.ts    # Conexao WebSocket (refatorado)
│   ├── eventQueue.ts         # Queue de eventos offline
│   └── heartbeatService.ts   # Heartbeat extraido
├── sync/
│   ├── syncService.ts        # Orquestra sincronizacao
│   ├── eventEmitter.ts       # Emissao de eventos
│   └── eventHandler.ts       # Recepcao e aplicacao
└── game/
    ├── pillService.ts        # Geracao de pilulas
    └── questService.ts       # Geracao de quests
```

### 3.3 Diagrama de Fluxo (Multiplayer-First)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ACAO DO USUARIO                               │
│                   (click pill, use item, etc)                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         HOOK (useXxx)                                │
│              Valida acao, prepara payload                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SYNC SERVICE                                   │
│                                                                      │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│   │ Single Player│    │  Multiplayer │    │  Multiplayer │          │
│   │   (local)    │    │    (host)    │    │   (guest)    │          │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘          │
│          │                   │                   │                   │
│          │                   │                   │                   │
│          ▼                   ▼                   ▼                   │
│   Aplica local        Aplica local +      Envia para host           │
│                       Emite evento         (aguarda sync)            │
└──────────┬───────────────────┬───────────────────┬──────────────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      STORES (Estado)                                 │
│                                                                      │
│   gameFlow │ pillPool │ player │ inventory │ effects │ shop         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Plano de Execucao

### Fase 1: Preparacao (Baixo Risco)

- [x] **1.1** Criar pasta `stores/game/` e `stores/multiplayer/`
- [x] **1.2** Criar pasta `services/sync/` e `services/realtime/`
- [x] **1.3** Extrair tipos/interfaces duplicados para arquivos dedicados
- [x] **1.4** Adicionar testes unitarios para `pillGenerator.ts` e `questGenerator.ts`

### Fase 2: Extracao de Stores (Medio Risco)

- [ ] **2.1** Extrair `effectsStore.ts` do gameStore (menor acoplamento)
- [ ] **2.2** Extrair `shopStore.ts` do gameStore
- [ ] **2.3** Extrair `pillPoolStore.ts` do gameStore
- [ ] **2.4** Extrair `inventoryStore.ts` do gameStore
- [ ] **2.5** Extrair `playerStore.ts` do gameStore
- [ ] **2.6** Refatorar `gameStore.ts` para `gameFlowStore.ts` (orquestracao)

### Fase 3: Camada de Sincronizacao (Alto Risco)

- [ ] **3.1** Criar `syncService.ts` - abstracao de emissao/recepcao
- [ ] **3.2** Criar `eventHandler.ts` - handler centralizado de eventos remotos
- [ ] **3.3** Criar `eventEmitter.ts` - emissao com tipagem forte
- [ ] **3.4** Refatorar `multiplayerStore.ts` para usar syncService
- [ ] **3.5** Remover `emitMultiplayerEvent()` do gameStore

### Fase 4: Robustez (Medio Risco)

- [ ] **4.1** Extrair `heartbeatService.ts` do multiplayerStore
- [ ] **4.2** Criar `eventQueue.ts` para eventos offline
- [ ] **4.3** Implementar retry automatico no realtimeService
- [ ] **4.4** Implementar reconciliacao de estado apos reconexao

### Fase 5: Limpeza (Baixo Risco)

- [ ] **5.1** Remover codigo morto
- [ ] **5.2** Atualizar documentacao de arquitetura
- [ ] **5.3** Remover types `any` e `unknown` restantes
- [ ] **5.4** Atualizar FLUXO.md com novos diagramas

---

## 5. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| Quebrar sincronizacao multiplayer | Alta | Critico | Testar cada passo em ambiente isolado |
| Regressao em single player | Media | Alto | Manter testes manuais apos cada fase |
| Dependencias circulares | Media | Medio | Usar pattern de mediator/event bus |
| Aumento de complexidade | Baixa | Medio | Manter stores pequenos (<300 linhas) |

---

## 6. Arquivos Impactados

### Criacao (~15 arquivos)
- `stores/game/*.ts` (6 arquivos)
- `stores/multiplayer/*.ts` (3 arquivos)
- `services/sync/*.ts` (3 arquivos)
- `services/realtime/*.ts` (2 arquivos)

### Refatoracao (~8 arquivos)
- `stores/gameStore.ts` -> dividido em 6 stores
- `stores/multiplayerStore.ts` -> dividido em 3 stores
- `services/realtimeService.ts` -> melhorado
- `hooks/*.ts` -> adaptar para novos stores

### Remocao (~2 arquivos)
- `stores/gameStore.ts` (antigo)
- `stores/multiplayerStore.ts` (antigo)

---

## 7. Decisao Arquitetural (ADR Recomendada)

**Recomendo criar uma ADR** para documentar:

1. **Por que dividir o gameStore?**
   - Razoes: testabilidade, manutenibilidade, SRP

2. **Por que criar camada de sync?**
   - Razoes: transparencia multiplayer, robustez

3. **Trade-offs aceitos:**
   - Mais arquivos = mais imports
   - Curva de aprendizado inicial
   - Migracao exige cuidado

---

## 8. Proximos Passos

1. **AGUARDAR APROVACAO** do usuario para prosseguir
2. Se aprovado, iniciar pela **Fase 1.1** (criacao de pastas)
3. Validar cada fase com testes no browser antes de prosseguir

---

> **NOTA:** Esta refatoracao e incremental e pode ser pausada a qualquer momento.
> O jogo continuara funcional durante todo o processo.


