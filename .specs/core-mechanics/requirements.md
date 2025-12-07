# Requisitos: Mecânica Central - Dosed (Pill Roulette)

## Visão Geral
Este documento especifica os requisitos para a mecânica central do jogo "Dosed", focando no sistema de Resistência, Vidas e na lógica das Pílulas Ocultas.

---

## REQ-001: Sistema de Vidas (Lives)

### Descrição
O sistema de vidas representa a sobrevivência final do jogador.

### Critérios de Aceitação (EARS)

**EARS-001.1 - Estado Inicial**
> QUANDO o jogo iniciar, ENTÃO cada jogador DEVE ter entre 2 a 3 vidas configuráveis.

**EARS-001.2 - Perda de Vida**
> QUANDO a Resistência de um jogador atingir 0 ou menos, ENTÃO o jogador DEVE perder 1 vida.

**EARS-001.3 - Condição de Derrota**
> QUANDO as vidas de um jogador chegarem a 0, ENTÃO o jogador DEVE ser eliminado e o jogo DEVE declarar o oponente como vencedor.

**EARS-001.4 - Exibição Visual**
> O sistema DEVE exibir o número atual de vidas de forma clara para ambos os jogadores.

---

## REQ-002: Sistema de Resistência (Resistance)

### Descrição
A resistência funciona como HP temporário/escudo que protege as vidas.

### Critérios de Aceitação (EARS)

**EARS-002.1 - Estado Inicial**
> QUANDO uma nova rodada iniciar, ENTÃO a Resistência de cada jogador DEVE ser restaurada ao valor máximo (4-6 configurável).

**EARS-002.2 - Aplicação de Dano**
> QUANDO um jogador consumir uma pílula com dano, ENTÃO a Resistência DEVE ser reduzida pelo valor de dano da pílula.

**EARS-002.3 - Aplicação de Cura**
> QUANDO um jogador consumir uma pílula de cura, ENTÃO a Resistência DEVE aumentar pelo valor de cura, SEM exceder o valor máximo.

**EARS-002.4 - Mecânica de Colapso (Critical Failure)**
> QUANDO a Resistência atingir <= 0, ENTÃO:
> 1. O jogador DEVE sofrer um "Colapso"
> 2. O jogador DEVE perder 1 vida
> 3. A Resistência DEVE ser restaurada ao valor máximo (ou máximo - 1 como penalidade)

**EARS-002.5 - Exibição Visual**
> O sistema DEVE exibir a Resistência atual e máxima como uma barra de progresso visível.

---

## REQ-003: Pool de Pílulas (The Table)

### Descrição
As pílulas são dispostas na mesa como um conjunto acessível, não uma pilha.

### Critérios de Aceitação (EARS)

**EARS-003.1 - Geração do Pool**
> QUANDO a fase de distribuição iniciar, ENTÃO o sistema DEVE gerar um conjunto de pílulas baseado em probabilidades configuráveis.

**EARS-003.2 - Estado Oculto**
> QUANDO uma pílula for adicionada ao pool, ENTÃO ela DEVE estar com `isRevealed: false` por padrão.

**EARS-003.3 - Conhecimento Público**
> O sistema DEVE exibir a contagem total de cada tipo de pílula no pool (ex: "3 Venenos, 1 Cura, 4 Placebos") SEM revelar quais pílulas específicas são de qual tipo.

**EARS-003.4 - Seleção de Pílula**
> QUANDO for o turno de um jogador, ENTÃO ele DEVE poder selecionar qualquer pílula disponível no pool.

**EARS-003.5 - Consumo de Pílula**
> QUANDO uma pílula for consumida, ENTÃO ela DEVE ser removida do pool permanentemente.

---

## REQ-004: Tipos de Pílulas

### Descrição
As pílulas possuem diferentes tipos com efeitos específicos.

### Critérios de Aceitação (EARS)

**EARS-004.1 - Tipo SAFE (Placebo)**
> QUANDO um jogador consumir uma pílula SAFE, ENTÃO nenhum dano ou cura DEVE ser aplicado.

**EARS-004.2 - Tipo DMG_LOW (Veneno Comum)**
> QUANDO um jogador consumir uma pílula DMG_LOW, ENTÃO a Resistência DEVE ser reduzida em 1 ou 2 pontos.

**EARS-004.3 - Tipo DMG_HIGH (Toxina)**
> QUANDO um jogador consumir uma pílula DMG_HIGH, ENTÃO a Resistência DEVE ser reduzida em 3 ou 4 pontos.

**EARS-004.4 - Tipo FATAL (Cyanide)**
> QUANDO um jogador consumir uma pílula FATAL, ENTÃO a Resistência DEVE ser zerada instantaneamente, garantindo perda de 1 vida.

**EARS-004.5 - Tipo HEAL (Antídoto)**
> QUANDO um jogador consumir uma pílula HEAL, ENTÃO a Resistência DEVE aumentar em +2 ou até o máximo.

---

## REQ-005: Revelação de Pílulas

### Descrição
Pílulas podem ser reveladas através de mecânicas de jogo.

### Critérios de Aceitação (EARS)

**EARS-005.1 - Revelação Individual**
> QUANDO uma pílula for revelada, ENTÃO `isRevealed` DEVE mudar para `true` e os visuais DEVEM refletir o tipo real.

**EARS-005.2 - Revelação ao Consumir**
> QUANDO uma pílula for consumida, ENTÃO seu tipo DEVE ser revelado a ambos os jogadores antes de aplicar o efeito.

**EARS-005.3 - Persistência da Revelação**
> SE uma pílula foi revelada, ENTÃO ela DEVE permanecer revelada até ser consumida ou removida.

---

## REQ-006: Interface do Usuário

### Critérios de Aceitação (EARS)

**EARS-006.1 - Área do Jogador**
> O sistema DEVE exibir para cada jogador: vidas, barra de resistência e inventário.

**EARS-006.2 - Mesa de Pílulas**
> O sistema DEVE exibir o pool de pílulas de forma interativa, permitindo seleção.

**EARS-006.3 - Contador de Tipos**
> O sistema DEVE exibir um resumo dos tipos de pílulas restantes na mesa.

**EARS-006.4 - Indicador de Turno**
> O sistema DEVE indicar claramente de quem é o turno atual.

**EARS-006.5 - Feedback de Ações**
> QUANDO uma ação ocorrer (consumo, dano, cura, colapso), ENTÃO o sistema DEVE fornecer feedback visual/animação.

---

## Requisitos Não-Funcionais

**RNF-001 - Performance**
> O sistema DEVE responder a interações do usuário em menos de 100ms.

**RNF-002 - Responsividade**
> A interface DEVE ser responsiva para desktop (1024px+).

**RNF-003 - Acessibilidade**
> Elementos interativos DEVEM ter estados de foco visíveis e suporte a teclado.

