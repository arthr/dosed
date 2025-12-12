# Implementar Refatoracao

## Descricao
Executa o plano de refatoracao definido em `.specs/[nome]/plan.md`, garantindo estabilidade, localizacao correta de arquivos e atualizacao da base de conhecimento.

## Instrucoes

### 1. Contexto de Execucao
Antes de iniciar, carregue na memoria:
- O plano: `.specs/[nome]/plan.md`
- O mapa do projeto: `@.cursor/rules/structure.md` (CRITICO: Nao crie arquivos fora das pastas permitidas).
- As restricoes: `@.cursor/rules/tech-stack.md` (Nao instale pacotes nao planejados).
- O historico: `@.cursor/rules/observation-log.md`.

### 2. Selecao de Tarefa Atomica
Localize a proxima tarefa `[ ]` no `plan.md`.
- Execute APENAS uma tarefa por vez.
- Nao pule etapas.

### 3. Proposta de Implementacao
Antes de escrever codigo, explique brevemente:
1. "Vou mover a logica X para `src/utils/` conforme Regra de Ouro".
2. "Vou criar o hook em `src/hooks/`".
3. Pergunte: "Posso executar?"

### 4. Execucao e Regra de Ouro
Apos aprovacao:
- Realize a mudanca.
- **Regra de Bugs:** Se encontrar um bug logico nao relacionado a refatoracao, APENAS adicione um comentario `// TODO: Bug [descrição]` e continue.
- **Regra de Imports:** Garanta que nao restaram imports relativos quebrados (ex: `../../`).

### 5. Verificacao Imediata
Apos cada passo:
- Rode o linter/type-checker.
- Valide: O arquivo novo esta na pasta exata definida em `structure.md`?

### 6. Atualizar Progresso
- Marque `[x]` no `plan.md`.
- Pergunte: "Passo concluido. Deseja verificar o diff ou ir para o proximo?"

### 7. Finalizacao e Aprendizado
Quando todo o plano estiver `[x]`:
1. Delete a pasta `.specs/[nome]/`.
2. IMPORTANTE: Se voce aprendeu algo novo sobre o sistema (ex: "O store X reseta quando Y acontece"), sugira adicionar ao `@.cursor/rules/observation-log.md`.
3. Atualize `@.cursor/rules/architecture.md` se a estrutura mudou.
4. Sugira o commit final.