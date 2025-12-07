# Implementar Feature

## Descricao
Executa a implementacao de uma feature planejada, seguindo as tasks definidas em `.specs/[nome-da-feature]/tasks.md` e mantendo consistencia com a arquitetura do jogo.

## Instrucoes

### 1. Contexto Obrigatorio
Antes de implementar, leia:
- `@.cursor/rules/architecture.md` - Estrutura atual
- `@.cursor/rules/structure.md` - Convencoes de codigo
- `@.cursor/rules/coding-style.md` - Padroes de estilo
- `@.specs/[pasta-da-feature]/design.md` - Design aprovado

### 2. Identificar Proxima Task
Analise o arquivo `@.specs/[pasta-da-feature]/tasks.md`:
- Localize a proxima tarefa marcada como `[ ]` (PENDING)
- Ignore tarefas ja marcadas como `[x]` (CONCLUIDA)

### 3. Plano de Acao
EXPLIQUE detalhadamente o que sera feito:
- Arquivos que serao criados
- Arquivos que serao modificados
- Como se integra com codigo existente
- Cite regras de `.cursor/rules/` que serao seguidas

### 4. Solicitar Aprovacao
**AGUARDE APROVACAO EXPLICITA** do usuario antes de tocar no codigo.
Nao prossiga sem confirmacao.

### 5. Executar Task
Apos aprovacao:
- Implemente seguindo os padroes definidos
- Mantenha componentes pequenos e focados
- Use TypeScript para todas as interfaces
- Siga convencoes de nomenclatura

### 6. Verificacao
Apos implementar:
- Execute `read_lints` nos arquivos alterados
- Corrija erros de lint se houver
- Teste no navegador se aplicavel

### 7. Atualizar Status
**CRITICO:** Marque a tarefa como concluida no `tasks.md`:
- Mude `[ ]` para `[x]`
- Adicione data se relevante

### 8. Proxima Task
Pergunte ao usuario:
> "Task concluida. Deseja aprovar o plano para a proxima task?"

Repita o processo ate todas as tasks estarem concluidas.

### 9. Finalizacao
Quando todas as tasks estiverem concluidas:
- Sugira atualizacoes para `architecture.md` se necessario
- Sugira atualizacoes para `product.md` se necessario
- Proponha mensagem de commit

