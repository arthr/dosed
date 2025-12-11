# Registro de Observacoes

## 🧠 Licoes de Refatoracao (Preencha durante o processo)

Use esta secao para registrar armadilhas encontradas.
Exemplo:
- [Data] **Risco de Render:** Ao refatorar `GameBoard`, descobrimos que o timer dispara re-renders no componente pai. Solucao: O timer foi isolado em um componente filho `TurnTimer`.
- [Data] **Zustand:** Nao desestruture stores dentro de loops ou callbacks. Use seletores granulares (`useStore(s => s.item)`) para evitar renders desnecessarios.

### Decisoes Arquiteturais

- [2024-12-11] **PlayerId vs UserId:** Decidimos separar dois conceitos:
  - `PlayerId` = posicao na partida (`player1`, `player2`), gerado por indice, nao persistente
  - `UserId` = UUID do Supabase Auth, identidade do usuario, persistente
  - Motivo: Permite "Guest-First" (jogar sem cadastro) e simplifica logica de turnos
  - Campo `Player.userId: string | null` sera adicionado na Fase 3.5 do refactor

## Diretrizes para o Agente

### Antes de Qualquer Alteracao
1. Leia `architecture.md` para entender a estrutura atual
2. Leia `tech-stack.md` para garantir consistencia tecnologica
3. Verifique `product.md` para alinhar com o objetivo do jogo

### Ao Implementar Features
- Siga os padroes de `structure.md`
- Mantenha separacao entre UI (componentes) e logica (stores/hooks)
- Use TypeScript para todas as interfaces
- Prefira composicao e reutilizacao de componentes existentes

### Decisoes de Design Importantes
- **State Management:** Zustand com stores modulares (gameStore, overlayStore, toastStore)
- **Animacoes:** Framer Motion com AnimatePresence para transicoes
- **UI Retro:** Componentes 8bit/ui para visual pixelado consistente
- **Overlays:** Sistema de stack com apenas 1 overlay ativo por vez
- **Toasts:** Sistema de fila nao-bloqueante para feedback

### Anti-Patterns a Evitar
- Nao criar novos stores sem necessidade clara
- Nao duplicar estado entre stores
- Nao colocar logica de negocio em componentes
- Nao usar inline styles (preferir Tailwind)
- Nao criar componentes muito grandes (max ~200 linhas)
