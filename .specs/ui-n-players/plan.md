# Plano - UI N-Jogadores (2-4) (Revisado)

**Data:** 2024-12-12  
**Status:** Planejado (pronto para execucao)  

---

## Objetivo

Adaptar a UI do `GameBoard.tsx` para suportar **2 a 4 jogadores** com a menor carga cognitiva possivel para um dev solo.

---

## Escopo

### Incluido
- Layout dinamico para 2-4 jogadores no `GameBoard.tsx`
- Mantem componentes filhos existentes (ex: `AnimatedPlayerArea`, `PillPool`, `TurnIndicator`)
- Testes manuais (2/3/4 jogadores + responsividade basica)

### Nao incluido
- Criacao de novos componentes de grid dedicados (ex: `PlayerGrid.tsx`)
- Criacao de utilitarios de layout (ex: `layoutCalculator.ts`)
- Multiplayer 3-4 players (spec separada)

---

## Arquivos Afetados

### Modificacao (1 arquivo)
- `src/components/game/GameBoard.tsx`

### Criacao (0 arquivos)
- Nenhum.

---

## Passo a Passo (Checklist)

### Fase Unica: Refatorar `GameBoard.tsx`

- [x] **0** Sincronizar este `plan.md` com `PLANO-REVISADO.md` (remover plano antigo)
- [x] **1** Preparacao: extrair `playerOrder` / `playerCount` e derivar `localPid` (perspectiva do jogador local)
- [ ] **2** Substituir logica hardcoded local/remote por lista dinamica baseada em `playerOrder`
- [ ] **3** Atualizar logica de `opponentId` para N jogadores (usar `useTargetablePlayers()` + fallback seguro)
- [ ] **4** Refatorar JSX para grid N-jogadores (Tailwind + CSS Grid), mantendo `PillPool` no centro
- [ ] **5** Limpeza: remover codigo morto/guardas hardcoded e garantir imports consistentes

---

## Verificacao Imediata (por passo)

Depois de cada passo:
- Rodar linter/type-checker
- Validar que nenhuma dependencia nova foi adicionada
- Validar que a UI nao acessa stores diretamente (somente via hooks), conforme `architecture.md`

---

## Testes Manuais Necessarios (final)

- [ ] 2 jogadores (single player) - regressao
- [ ] 2 jogadores (multiplayer) - perspectiva local correta
- [ ] 3 jogadores (via DevTool / estado simulado) - layout 2 no topo + 1 no bottom central
- [ ] 4 jogadores (via DevTool / estado simulado) - layout 2x2
- [ ] Responsividade basica (mobile/tablet/desktop)

---

## Referencias

- `.specs/ui-n-players/PLANO-REVISADO.md` (detalhes e exemplos)
- `.specs/ui-n-players/DIAGNOSTICO.md` (diagnostico e justificativa)
- `.cursor/rules/architecture.md`
- `.cursor/rules/tech-stack.md`
- `.cursor/rules/structure.md`


