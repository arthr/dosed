---
description: Revisar implementacao de uma feature para garantir integridade, coerencia e ausencia de bugs
---

# Revisar Feature Implementada

## Descricao

Realiza uma revisao completa de uma feature implementada, garantindo que todas as tasks foram executadas corretamente, o codigo esta coerente com as specs, e nao ha arquivos ou codigo legado/desnecessario.

## Instrucoes

### 1. Identificar Feature

O usuario informara qual feature revisar. Localize:
- `.specs/[nome-da-feature]/requirements.md`
- `.specs/[nome-da-feature]/design.md`
- `.specs/[nome-da-feature]/tasks.md`

### 2. Verificar Completude das Tasks

Analise o `tasks.md` e para cada task marcada como `[x]`:
- Confirme que o codigo correspondente existe
- Verifique se a implementacao atende os requisitos da task
- Identifique tasks marcadas que nao foram realmente implementadas

### 3. Validar Integridade com Specs

Compare a implementacao com `design.md`:
- Tipos/interfaces estao conforme especificado?
- Componentes seguem a arquitetura proposta?
- Actions/hooks estao integrados corretamente?
- Fluxo de dados esta coerente?

Compare com `requirements.md`:
- Todos os requisitos funcionais foram atendidos?
- Requisitos nao-funcionais estao sendo respeitados?

### 4. Identificar Codigo Legado

Procure por:
- Imports nao utilizados
- Funcoes/componentes que nao sao mais chamados
- Arquivos que deveriam ter sido removidos
- Codigo comentado que pode ser deletado
- Duplicacoes que violam DRY

### 5. Verificar Consistencia de Estilo

Consulte `.cursor/rules/coding-style.md`:
- Nomenclatura consistente
- Estrutura de arquivos correta
- Padroes TypeScript seguidos

### 6. Executar Verificacoes Automaticas

Execute read_lints nos arquivos da feature.
Corrija quaisquer erros ou warnings relevantes.

### 7. Teste Manual (se aplicavel)

Se a feature tem componentes visuais:
- Navegue ate a funcionalidade no browser
- Teste o fluxo principal
- Verifique edge cases

### 8. Relatorio de Revisao

Apresente ao usuario um relatorio estruturado:

## Relatorio de Revisao: [nome-da-feature]

### Tasks Verificadas
- TASK-XX: OK/Problema encontrado
- TASK-YY: OK/Problema encontrado

### Problemas Encontrados
1. [Descricao do problema]
   - Arquivo: [caminho]
   - Sugestao: [como corrigir]

### Codigo Legado Identificado
- [arquivo/funcao] - [motivo para remocao]

### Lints
- X erros encontrados
- Y warnings encontrados

### Recomendacoes
1. [Acao recomendada]

### 9. Executar Correcoes

**AGUARDE APROVACAO** do usuario antes de:
- Corrigir problemas identificados
- Remover codigo legado
- Aplicar refatoracoes

### 10. Atualizacao Final

Apos correcoes aprovadas:
- Atualize `tasks.md` se necessario
- Sugira atualizacoes para arquivos em `.cursor/rules/`
- Proponha mensagem de commit

