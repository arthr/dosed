# Checklist de Migracao - gameStore.ts

Este checklist deve ser seguido na ordem. Apos cada item, rodar testes.

---

## Pre-Requisitos

- [x] Stores modulares criados (effectsStore, shopStore, pillPoolStore, itemUsageStore, playerStore, gameFlowStore)
- [x] 224 testes passando
- [x] Barrel export configurado (`src/stores/game/index.ts`)
- [ ] Backup do gameStore.ts atual

---

## Batch 1: Delegacao Simples (Baixo Risco)

**Status:** CONCLUIDO - 15/22 funcoes delegadas (7 NAO DELEGAR ou MOVIDAS)

### 1.1 Revealed Pills -> pillPoolStore

- [x] `addRevealedPill` - delegado com dual-write
- [x] `removeRevealedPill` - delegado com dual-write
- [x] `clearRevealedPills` - delegado com dual-write
- [x] **TESTE:** 224 testes passando

### 1.2 Pill Modifiers -> pillPoolStore

- [x] `invertPill` - delegado com dual-write
- [x] `doublePill` - delegado com dual-write
- [x] `clearPillModifiers` - delegado com dual-write
- [x] **TESTE:** 224 testes passando

### 1.3 Player Effects -> effectsStore

- [x] `applyPlayerEffect` - ja tinha dual-write
- [x] `removePlayerEffect` - ja tinha dual-write
- [x] `decrementEffectRounds` - ja tinha dual-write
- [x] **TESTE:** 224 testes passando

### 1.4 Item Usage Basico -> itemUsageStore

- [x] `startItemUsage` - delegado com dual-write
- [x] `cancelItemUsage` - delegado com dual-write
- [x] **TESTE:** 224 testes passando

### 1.5 Selectors Simples

- [x] `getPillById` -> pillPoolStore.getPill com fallback
- [x] `isPillPoolEmpty` -> pillPoolStore.isEmpty
- [x] `getCurrentPlayer` -> playerStore.getPlayer com fallback
- [x] `getOpponent` marcado como @deprecated
- [x] **TESTE:** 224 testes passando

### 1.6 Shop Basico -> shopStore

- [~] `addToCart` - MOVIDO para Batch 2.3 (Shopping Flow)
- [~] `removeFromCart` - MOVIDO para Batch 2.3 (Shopping Flow)
- [~] `purchaseStoreItem` - MOVIDO para Batch 2.3 (Shopping Flow)

### 1.7 Player Basico -> playerStore

- [~] `toggleWantsStore` - MOVIDO para Batch 2.3 (Shopping Flow)
- [x] `removeItemFromInventory` - NAO DELEGAR (playerStore nao inicializado durante jogo)
- [x] `selectItem` - NAO DELEGAR (playerStore nao inicializado durante itemSelection)
- [x] `deselectItem` - NAO DELEGAR (playerStore nao inicializado durante itemSelection)
- [x] **DECISAO:** Funcoes de itemSelection permanecem no gameStore (playerStore nao inicializado)

**Checkpoint Batch 1:** CONCLUIDO - 224 testes passando.

---

## Batch 2: Orquestracao Media

### 2.1 Game Flow -> gameFlowStore

- [x] `nextTurn` (linha 628) - delegado com DUAL-WRITE
- [x] `endGame` (linha 754) - delegado com DUAL-WRITE
- [x] `startItemSelectionPhase` (linha 784) - delegado com DUAL-WRITE
- [x] **TESTE:** 224 testes passando

### 2.2 Item Selection Confirm -> itemUsageStore + gameFlowStore

- [x] `confirmItemSelection` (linha 881) - delegado com DUAL-WRITE
  - itemUsageStore.confirmSelection() para marcar jogador
  - gameFlowStore.startGame() quando todos confirmam
  - TODO: Usar isAllConfirmed() quando initializeForPlayers integrado (Batch 3.1)
- [x] **TESTE:** 224 testes passando

### 2.3 Shopping Flow

- [x] `checkAndStartShopping` (linha 1532) - delegado com DUAL-WRITE
  - shopStore.openShop() para iniciar loja
- [x] `processCart` (linha 1736) - NAO DELEGAR (orquestracao)
  - Le carrinho de shopStore, aplica em players
- [x] `confirmStorePurchases` (linha 1838) - delegado com DUAL-WRITE
  - shopStore.confirmPlayer() + shopStore.isConfirmed()
- [x] `checkShoppingComplete` (linha 1917) - delegado com DUAL-WRITE
  - shopStore.isConfirmed() para verificar confirmacoes
- [x] `applyPendingBoosts` (linha 1958) - delegado com DUAL-WRITE
  - shopStore.getPendingBoosts() + shopStore.closeShop()
- [x] **TESTE:** 224 testes passando

### 2.4 Round Management

- [x] `resetRound` (linha 649) - delegado com DUAL-WRITE
  - effectsStore.removeEffectFromAll('shield')
  - pillPoolStore.setPool() + clearRevealedPills() + addRevealedPill()
- [x] `resetGame` (linha 782) - delegado
  - Chama reset() de todos os stores modulares
- [x] **TESTE:** 224 testes passando

**Checkpoint Batch 2:** CONCLUIDO - Teste manual OK!

### Bug Fix: processCart (descoberto em teste manual)

- [x] `processCart` nao delegava para shopStore ao adicionar boosts
  - Causa: `applyPendingBoosts` usava `shopStore.getPendingBoosts()` que retornava vazio
  - Fix: Adicionado `shopStore.addPendingBoost()` e `shopStore.clearCart()` no processCart
  - **Teste manual:** 100% OK (Scanner X2, Life Up funcionando)

---

## Batch 3: Orquestracao Alta (Fazer com Cuidado)

### 3.1 initGame (linha 269)

Esta e a funcao mais critica. Inicializa todo o estado.

- [ ] Extrair inicializacao de players -> playerStore.initializePlayers
- [ ] Extrair geracao de pool -> pillPoolStore.generatePool
- [ ] Extrair estado de flow -> gameFlowStore.initialize
- [ ] Extrair estado de shop -> shopStore (nao aberto ainda)
- [ ] Extrair estado de effects -> effectsStore.initializeForPlayers
- [ ] Extrair estado de itemUsage -> itemUsageStore.initializeForPlayers
- [ ] Manter: shapeQuests, actionHistory inicial
- [ ] **TESTE:** `pnpm tsc --noEmit && pnpm test`
- [ ] **TESTE MANUAL:** Iniciar nova partida, verificar todos os estados

### 3.2 consumePill (linha 346)

Funcao mais complexa (~250 linhas). Orquestra:
- Consumo da pilula (pillPoolStore)
- Aplicacao de efeito (playerStore)
- Verificacao de efeitos ativos (effectsStore)
- Progressao de turno (gameFlowStore)
- Verificacao de fim de rodada
- Eventos multiplayer

- [ ] Extrair consumo -> pillPoolStore.consumePill
- [ ] Extrair aplicacao de efeito -> usar applyPillEffect puro
- [ ] Extrair update de player -> playerStore
- [ ] Extrair update de quests (manter inline)
- [ ] Extrair progressao de turno -> gameFlowStore.nextTurn
- [ ] Manter orquestracao e eventos multiplayer
- [ ] **TESTE:** `pnpm tsc --noEmit && pnpm test`
- [ ] **TESTE MANUAL:** Consumir pilulas, verificar dano/cura/colapso

### 3.3 executeItem (linha 966)

Switch com 10+ tipos de itens. Cada tipo tem logica diferente.

- [ ] Extrair logica comum (remover item, registrar acao)
- [ ] Manter switch de tipos (cada tipo orquestra stores diferentes)
- [ ] Scanner -> pillPoolStore.addRevealedPill
- [ ] Inverter/Double -> pillPoolStore
- [ ] Shield/Handcuffs -> effectsStore
- [ ] Pocket Pill -> playerStore
- [ ] Force Feed -> consumePill com forcedTarget
- [ ] Shuffle/Discard -> pillPoolStore
- [ ] Shape items -> manter inline (quests)
- [ ] **TESTE:** `pnpm tsc --noEmit && pnpm test`
- [ ] **TESTE MANUAL:** Usar cada tipo de item

### 3.4 applyRemoteEvent (linha 1989)

Handler de eventos multiplayer. Deve chamar os stores apropriados.

- [ ] Mapear cada tipo de evento para stores
- [ ] pill_consumed -> pillPoolStore + playerStore
- [ ] item_used -> delegar para executeItem
- [ ] player_confirmed -> itemUsageStore
- [ ] round_reset -> pillPoolStore + gameFlowStore
- [ ] Etc.
- [ ] **TESTE:** `pnpm tsc --noEmit && pnpm test`
- [ ] **TESTE MANUAL:** Partida multiplayer

**Checkpoint Batch 3:** Teste manual completo (single + multiplayer).

---

## Limpeza Final

- [ ] Remover estado duplicado do gameStore (usar getters dos stores)
- [ ] Remover funcoes auxiliares nao mais necessarias
- [ ] Atualizar imports nos consumers (se necessario)
- [ ] Verificar linhas do gameStore < 350
- [ ] **TESTE FINAL:** Todos os 224+ testes passando
- [ ] **TESTE MANUAL FINAL:** Fluxo completo do jogo

---

## Comandos Uteis

```bash
# Verificar tipos
pnpm tsc --noEmit

# Rodar testes dos stores
pnpm test src/stores/game/__tests__/

# Contar linhas do gameStore
wc -l src/stores/gameStore.ts

# Verificar imports quebrados
pnpm build
```

---

## Rollback

Se algo der errado:

1. `git stash` para salvar progresso
2. `git checkout src/stores/gameStore.ts` para restaurar
3. Analisar o que quebrou
4. Tentar novamente com abordagem diferente

