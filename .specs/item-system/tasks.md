# Tasks: Sistema de Itens (Power-ups)

## Fase 1: Fundacao (Types e Catalogo)

- [x] TASK-IS-001: Criar arquivo `src/types/item.ts` com tipos base
  - ItemCategory, ItemType, ItemTargetType
  - ItemDefinition, InventoryItem, PlayerInventory
  - TargetSelectionState, ItemEffectResult

- [x] TASK-IS-002: Criar arquivo `src/utils/itemCatalog.ts`
  - ITEM_CATALOG com todos os 9 itens
  - ITEMS_BY_CATEGORY para agrupamento
  - Cores e icones por categoria

- [x] TASK-IS-003: Atualizar `src/types/player.ts`
  - Adicionar `inventory: PlayerInventory` ao Player
  - Adicionar `effects: PlayerEffect[]` ao Player
  - Criar interface PlayerEffect e PlayerEffectType

- [x] TASK-IS-004: Atualizar `src/types/game.ts`
  - Adicionar fase `itemSelection` ao GamePhase
  - Adicionar `targetSelection: TargetSelectionState`
  - Adicionar `revealedPills: string[]`

- [x] TASK-IS-005: Atualizar barrel exports em `src/types/index.ts`

---

## Fase 2: Logica de Itens (Utils)

- [x] TASK-IS-006: Criar `src/utils/itemLogic.ts`
  - Funcao `applyItemEffect(item, player, target?)`
  - Logica individual para cada tipo de item
  - Retorno padronizado ItemEffectResult

- [x] TASK-IS-007: Implementar efeitos Intel
  - Scanner: revela tipo da pilula
  - Inverter: inverte efeito da pilula
  - Double: dobra efeito da pilula

- [x] TASK-IS-008: Implementar efeitos Sustain
  - Pocket Pill: cura +2 resistencia
  - Shield: imunidade por 1 turno

- [x] TASK-IS-009: Implementar efeitos Control
  - Handcuffs: pula turno do oponente
  - Force Feed: oponente consome pilula

- [x] TASK-IS-010: Implementar efeitos Chaos
  - Shuffle: embaralha pilulas
  - Discard: remove pilula sem efeito

---

## Fase 3: Store (Estado)

- [x] TASK-IS-011: Atualizar `src/stores/gameStore.ts` - Estado inicial
  - Adicionar inventario vazio aos players
  - Adicionar targetSelection ao estado
  - Adicionar revealedPills ao estado

- [x] TASK-IS-012: Implementar actions de selecao de itens
  - `selectItem(playerId, itemType)`
  - `deselectItem(playerId, itemId)`
  - `confirmItemSelection(playerId)`
  - `startItemSelectionPhase()`

- [x] TASK-IS-013: Implementar actions de uso de itens
  - `startItemUsage(itemId)`
  - `cancelItemUsage()`
  - `executeItem(itemId, targetId?)`
  - `removeItemFromInventory(playerId, itemId)`

- [x] TASK-IS-014: Implementar actions de efeitos
  - `applyPlayerEffect(playerId, effect)`
  - `removePlayerEffect(playerId, effectType)`
  - `decrementEffectRounds(playerId)`
  - `addRevealedPill(pillId)` / `removeRevealedPill(pillId)` / `clearRevealedPills()`

- [x] TASK-IS-015: Implementar logica de pilula invertida/dobrada
  - Flag `inverted` e `doubled` na Pill
  - Ajustar `applyPillEffect` para considerar flags
  - Actions: `invertPill`, `doublePill`, `clearPillModifiers`

---

## Fase 4: Hooks

- [x] TASK-IS-016: Criar `src/hooks/useItemSelection.ts`
  - Selectors para inventario atual
  - Actions de selecao encapsuladas
  - Validacao de limite (5 itens)

- [x] TASK-IS-017: Criar `src/hooks/useItemUsage.ts`
  - Estado de selecao de alvo
  - Actions de uso encapsuladas
  - Integracao com fluxo de turno

- [x] TASK-IS-018: Atualizar `src/hooks/useAIPlayer.ts`
  - Logica de decisao de uso de item
  - Heuristica simples (35% chance, prioridades)
  - Selecao automatica de alvo

- [x] TASK-IS-019: Atualizar barrel exports `src/hooks/index.ts`

---

## Fase 5: Componentes de Selecao

- [x] TASK-IS-020: Criar `src/components/game/ItemCard.tsx`
  - Card visual do item (8bit style)
  - Estados: disponivel, selecionado, desabilitado
  - Tooltip com descricao
  - Animacao de selecao

- [x] TASK-IS-021: Criar `src/components/game/ItemSelectionScreen.tsx`
  - Grid de itens por categoria
  - Contador de selecao (X/5)
  - Botao confirmar
  - Layout responsivo

- [x] TASK-IS-022: Integrar ItemSelectionScreen no App.tsx
  - Renderizar quando phase === 'itemSelection'
  - Transicao para 'playing' apos confirmacao

- [x] TASK-IS-023: Implementar selecao automatica da IA
  - Selecionar 5 itens aleatorios
  - Auto-confirmar apos delay

---

## Fase 6: Componentes de Inventario

- [x] TASK-IS-024: Criar `src/components/game/InventorySlot.tsx`
  - Slot individual de item
  - Estados: vazio, preenchido, usando
  - Clicavel para uso
  - Tooltip

- [x] TASK-IS-025: Criar `src/components/game/InventoryBar.tsx`
  - Barra com 5 slots
  - Horizontal abaixo do card do jogador
  - Animacao de remocao de item

- [x] TASK-IS-026: Integrar InventoryBar no AnimatedPlayerArea.tsx
  - Posicionar abaixo das stats
  - Passar handlers de uso
  - Desabilitar durante turno do oponente

---

## Fase 7: Selecao de Alvo e Efeitos

- [x] TASK-IS-027: Criar `src/components/game/ItemTargetSelector.tsx`
  - Overlay de selecao de alvo
  - Highlight em alvos validos
  - Botao cancelar
  - Instrucoes contextuais

- [x] TASK-IS-028: Atualizar Pill.tsx para estados de item
  - Estado "revealed" (Scanner)
  - Estado "target" (selecao de alvo)
  - Estado "inverted" / "doubled" (visual)

- [x] TASK-IS-029: Criar `src/components/overlays/ItemEffectOverlay.tsx`
  - Animacao de efeito por tipo
  - Auto-dismiss apos animacao
  - Integracao com overlayStore

- [x] TASK-IS-030: Atualizar overlayStore para ItemEffect
  - Adicionar tipo 'itemEffect' ao OverlayType
  - Adicionar `openItemEffect(itemType, target)`

---

## Fase 8: Integracao e GameBoard

- [x] TASK-IS-031: Atualizar GameBoard.tsx
  - Integrar ItemTargetSelector
  - Handlers de uso de item
  - Estado de "usando item"

- [x] TASK-IS-032: Integrar efeitos de turno
  - Verificar Shield antes de aplicar dano
  - Aplicar Handcuffs (pular turno)
  - Decrementar efeitos no fim do turno

- [x] TASK-IS-033: Atualizar usePillConsumption para Force Feed
  - Aceitar parametro de "forcado"
  - Aplicar no oponente ao inves do jogador atual

---

## Fase 9: Polish e Feedback

- [ ] TASK-IS-034: Criar toasts especificos para itens
  - Toast por tipo de item usado
  - Incluir icone do item
  - Mensagem contextual

- [ ] TASK-IS-035: Adicionar animacoes de inventario
  - Entrada de item na selecao
  - Saida de item ao usar
  - Pulse quando disponivel

- [ ] TASK-IS-036: Implementar feedback visual de Shield
  - Borda especial no AnimatedPlayerArea
  - Indicador de turnos restantes

- [ ] TASK-IS-037: Implementar feedback visual de Handcuffs
  - Icone no oponente
  - Mensagem "Turno pulado"

---

## Fase 10: Finalizacao

- [ ] TASK-IS-038: Testes manuais completos
  - Testar cada item individualmente
  - Testar combinacoes de itens
  - Testar IA usando itens

- [ ] TASK-IS-039: Atualizar documentacao
  - Atualizar architecture.md
  - Atualizar product.md
  - Atualizar FLUXO.md

- [ ] TASK-IS-040: Review e ajustes finais
  - Verificar lints
  - Otimizar re-renders
  - Balancear gameplay se necessario

