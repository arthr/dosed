# Bugs Identificados: Sistema de Itens

## Bug #1: IA trava apos usar Handcuffs

**Status:** CORRIGIDO
**Severidade:** Alta
**Arquivo:** `src/hooks/useAIPlayer.ts`

### Descricao
Quando a IA usa Handcuffs no jogador humano, ela pode travar e nao jogar mais.

### Causa Raiz
O reset das flags `hasScheduledRef` e `hasUsedItemRef` so ocorre quando o turno muda para humano (`!currentPlayer.isAI`). Quando o Handcuffs faz o turno "pular" de volta para a IA, as flags nao sao resetadas.

### Solucao Aplicada
Adicionados dois novos useEffects para resetar flags:
1. Reset quando `pillPool.length` muda (indica pilula consumida = novo turno)
2. Reset quando `phase` volta para 'idle' e ainda e turno da IA

```typescript
// Reset flags quando uma pilula e consumida (novo turno)
useEffect(() => {
  if (pillPool.length !== lastPillCountRef.current) {
    lastPillCountRef.current = pillPool.length
    hasScheduledRef.current = false
    hasUsedItemRef.current = false
  }
}, [pillPool.length])

// Reset quando phase volta para idle
useEffect(() => {
  if (phase === 'idle' && currentPlayer.isAI) {
    hasScheduledRef.current = false
  }
}, [phase, currentPlayer.isAI])
```

---

## Bug #2: Stale closure no Force Feed (e outros itens)

**Status:** CORRIGIDO
**Severidade:** Media
**Arquivo:** `src/hooks/useAIPlayer.ts`

### Descricao
Quando a IA usa um item que modifica o pillPool (ex: Force Feed, Discard), o setTimeout para consumir pilula usava o `pillPool` antigo (stale closure).

### Causa Raiz
O `pillPool` capturado no closure do setTimeout era o valor antes do item ser executado. Se o item removia uma pilula, o `selectRandomPill` poderia tentar selecionar uma pilula inexistente.

### Solucao Aplicada
Alterado para pegar `pillPool` diretamente do store dentro do setTimeout:

```typescript
setTimeout(() => {
  const currentPillPool = useGameStore.getState().pillPool
  const selectedPillId = selectRandomPill(currentPillPool)
  // ...
}, delay)
```

---

## Bug #3: Force Feed sem feedback visual

**Status:** CORRIGIDO
**Severidade:** Baixa (UX)
**Arquivos:** `src/stores/gameStore.ts`, `src/components/game/GameBoard.tsx`

### Descricao
Quando Force Feed e usado, o `consumePill` era chamado diretamente no store, sem abrir o overlay PillReveal. O oponente consumia a pilula "silenciosamente".

### Comportamento Antigo
1. IA usa Force Feed
2. `executeItem` chamava `consumePill` diretamente
3. Pilula era aplicada no oponente sem animacao de revelacao
4. Apenas toast aparecia

### Solucao Aplicada
1. O case `force_feed` no gameStore agora apenas remove o item do inventario (nao chama `consumePill`)
2. O GameBoard detecta quando o item e `force_feed` e chama `startConsumption(pillId, opponentId)` com forcedTarget
3. Isso garante que o fluxo completo do PillReveal seja usado, mostrando a animacao de revelacao para o oponente

---

## Bug #4: (A investigar) Outros comportamentos inesperados da IA

**Status:** VERIFICADO - Nenhum bug adicional encontrado
**Severidade:** Media

### Descricao
Usuario reportou que "alguns itens estao causando comportamentos inesperados na IA". Bugs #1, #2, #3 e #5 foram identificados e corrigidos.

### Itens Verificados
- [x] Handcuffs - CORRIGIDO (Bug #1)
- [x] Force Feed - Stale closure CORRIGIDO (Bug #2), feedback visual CORRIGIDO (Bug #3)
- [x] Scanner/Inverter/Double - Funcionando corretamente
- [x] Shield - Funcionando corretamente
- [x] Discard - CORRIGIDO (Bug #5: nao iniciava nova rodada quando pool esvaziava)
- [x] Shuffle - Funcionando corretamente
- [x] Pocket Pill - Funcionando corretamente

### Conclusao
Todos os itens foram testados e estao funcionando conforme especificado.

---

## Bug #5: Discard na ultima pilula nao inicia nova rodada

**Status:** CORRIGIDO
**Severidade:** Alta
**Arquivo:** `src/stores/gameStore.ts`

### Descricao
Quando o item Discard e usado na ultima pilula do pool, o jogo fica travado porque nao inicia uma nova rodada.

### Causa Raiz
No `consumePill`, quando o pool esvazia, ha verificacao que dispara a transicao de rodada:
```typescript
if (newPillPool.length === 0) {
  set({ phase: 'roundEnding' })
  setTimeout(() => {
    get().resetRound()
  }, ROUND_TRANSITION_DELAY)
}
```

Porem, no case `discard` do `executeItem`, essa verificacao NAO existia. O Discard removia a pilula mas nao verificava se o pool ficou vazio.

### Solucao Aplicada
Adicionada verificacao de pool vazio no case `discard`, similar ao `consumePill`:
```typescript
case 'discard': {
  if (targetId) {
    const newPillPool = state.pillPool.filter((p) => p.id !== targetId)
    // ... codigo existente ...
    
    // Verifica se pool esvaziou - inicia transicao de rodada
    if (newPillPool.length === 0) {
      newState.phase = 'roundEnding'
      setTimeout(() => {
        get().resetRound()
      }, ROUND_TRANSITION_DELAY)
    }
  }
  break
}
```

---

## Checklist de Correcoes

- [x] Fix #1: Refatorar reset de flags em useAIPlayer
- [x] Fix #2: Corrigir stale closure no setTimeout
- [x] Fix #3: Adicionar feedback visual para Force Feed
- [x] Fix #5: Discard na ultima pilula inicia nova rodada
- [x] Investigar outros itens que podem causar travamento
- [x] Testar cenarios de edge case (handcuffs + shield, etc)

---

## Status Final

**Feature item-system: CONCLUIDA**

Todos os bugs identificados foram corrigidos e todos os itens estao funcionando conforme especificado.
