# Adicionar Nova Feature

## Descricao
Adiciona uma nova funcionalidade ao jogo Dosed, garantindo que o agente compreenda a arquitetura atual e mantenha consistencia com o codigo existente.

## Instrucoes

### 1. Contexto Obrigatorio
Antes de qualquer acao, leia e compreenda:
- `@.cursor/rules/architecture.md` - Estrutura atual do jogo
- `@.cursor/rules/tech-stack.md` - Tecnologias utilizadas
- `@.cursor/rules/product.md` - Mecanicas implementadas
- `@docs/FLUXO.md` - Fluxo completo da aplicacao

### 2. Analise de Impacto
Identifique quais partes do codigo serao afetadas:
- [ ] Stores (gameStore, overlayStore, toastStore)
- [ ] Hooks existentes
- [ ] Componentes de UI
- [ ] Types/interfaces
- [ ] Utils/logica de negocio

### 3. Planejamento
Apresente um plano detalhado incluindo:
1. **O que sera criado** (novos arquivos/componentes)
2. **O que sera modificado** (arquivos existentes)
3. **Integracao** (como se conecta com a arquitetura atual)
4. **Riscos** (possiveis quebras ou side effects)

### 4. Aprovacao
**SOLICITE APROVACAO** explicita do usuario antes de implementar.

### 5. Implementacao
Execute seguindo os padroes de `@.cursor/rules/structure.md`:
- Componentes em `src/components/` (pasta adequada)
- Hooks em `src/hooks/`
- Types em `src/types/`
- Logica em `src/utils/`

### 6. Verificacao
Apos implementar:
- Verifique lints (`read_lints`)
- Teste no navegador se possivel
- Documente mudancas significativas

### 7. Atualizacao de Docs
Se a feature for significativa, sugira atualizacoes para:
- `architecture.md` (novos componentes/stores)
- `product.md` (novas mecanicas)
- `FLUXO.md` (novos fluxos)

