# Refatorar Codigo

## Descricao
Planeja a refatoracao de componentes ou modulos, visando sustentabilidade do codigo para um DESENVOLVEDOR SOLO. Prioriza legibilidade, simplicidade e obediencia estrita as Regras de Ouro.

## Instrucoes

### 1. Analise de Contexto (Critico)
Antes de analisar o codigo, leia obrigatoriamente:
- `@.cursor/rules/architecture.md` - Atencao as "Regras de Ouro" e "Fronteiras Rigidas".
- `@.cursor/rules/tech-stack.md` - Atencao as "Restricoes de Dependencias" (Zero Novas Libs).
- `@.cursor/rules/structure.md` - Atencao a "Localizacao Obrigatoria".
- `@.cursor/rules/product.md` - Regras de negocio imutaveis.

### 2. Diagnostico e Simplificacao
Analise o codigo alvo buscando problemas que aumentam a Carga Cognitiva:
- **Violacao de Fronteiras:** UI acessando Logic/Stores diretamente?
- **Acoplamento Oculto:** Mudancas em A quebram B?
- **Complexidade Desnecessaria:** Abstracoes que nao trazem valor claro.

### 3. Definir Estrategia (Strategy)
Crie o arquivo `.specs/[nome]/plan.md`.
**IMPORTANTE:** Para um dev solo, a melhor refatoracao e aquela que torna o codigo obvio.

O plano deve conter:
- **Objetivo:** O que sera melhorado.
- **Arquivos Afetados:** Lista completa.
- **Passo a Passo (Checklist):**
  - [ ] Passo 1: Preparacao (Criar types, interfaces).
  - [ ] Passo 2: Migracao (Mover funcoes puras para `utils/`).
  - [ ] Passo 3: Integracao (Conectar UI via `hooks/`).
  - [ ] Passo 4: Limpeza (Remover codigo morto).
- **Verificacao de Risco:** Testes manuais necessarios.

### 4. Validacao de Regras (Safety Check)
Antes de pedir aprovacao, verifique se o plano:
- [ ] Adiciona alguma biblioteca npm? (Se sim, PARE e justifique).
- [ ] Cria pastas fora do padrao `structure.md`? (Se sim, corrija).
- [ ] Mistura UI com Logica? (Se sim, separe).

### 5. Solicitar Aprovacao
Apresente o resumo:
> "Plano de refatoracao validado contra as Regras de Ouro criado em `.specs/[nome]/plan.md`. Podemos prosseguir?"