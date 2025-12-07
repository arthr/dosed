# Planejar Nova Feature

## Descricao
Gera um plano de desenvolvimento estruturado para uma nova funcionalidade do jogo Dosed, garantindo alinhamento com a arquitetura existente.

## Instrucoes

### 1. Contexto Obrigatorio
Antes de planejar, leia e compreenda:
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

### 3. Criacao da Especificacao
Crie uma nova pasta em `.specs/[nome-da-feature]/` com tres arquivos:

#### `requirements.md`
- Descreva os requisitos usando notacao EARS
- Liste criterios de aceitacao claros
- Identifique dependencias com features existentes

#### `design.md`
- Proponha como a feature se integra na arquitetura atual
- Defina novos componentes/stores/hooks necessarios
- Documente mudancas em arquivos existentes
- Liste riscos e possiveis side effects

#### `tasks.md`
- Crie lista de tarefas discretas e sequenciadas
- Use formato: `- [ ] TASK-XXX: Descricao da tarefa`
- Agrupe por area (Types, Store, Hooks, Components, Integration)
- Inclua tarefa final de verificacao/teste

### 4. Revisao
Apresente um resumo do plano ao usuario:
1. O que a feature adiciona ao jogo
2. Principais mudancas na arquitetura
3. Estimativa de complexidade (baixa/media/alta)
4. Riscos identificados

### 5. Aprovacao
Informe ao usuario que o plano esta pronto para revisao.
**AGUARDE APROVACAO** antes de iniciar implementacao.
Use `/implement-feature` apos aprovacao para executar as tasks.

