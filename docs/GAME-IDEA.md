# Dosed (Pill Roulette): Especificacao de Mecanica

## 1. Visao Geral
Um jogo de estrategia por turnos de soma zero, onde dois jogadores (Humano vs IA ou PvP) competem para ser o ultimo sobrevivente. A mecanica central gira em torno de **Gestao de Risco** e **Informacao Oculta**. O jogo utiliza um sistema de vida de duas camadas (Resistencia e Vidas).

## 2. Estrutura do Jogador (Stats)

Cada entidade (Jogador/Inimigo) possui os seguintes atributos:

### A. Vidas (Lives / Defibrillators)
* **Definicao:** O contador "Real" de sobrevivencia.
* **Valor Tipico:** 3 vidas no inicio da partida.
* **Condicao de Derrota:** Se Vidas chegarem a 0, o jogador e eliminado permanentemente.

### B. Resistencia (Resistance / Tolerance)
* **Definicao:** A "Barra de Escudo" ou HP temporario da rodada atual. Representa o limite de toxicidade que o corpo aguenta antes de colapsar.
* **Valor Tipico:** 6 pontos.
* **Mecanica de Colapso (Critical Failure):**
    1.  Quando a Resistencia atinge <= 0, o jogador sofre um **Colapso**.
    2.  **Penalidade:** -1 Vida.
    3.  **Reset:** A Resistencia e restaurada para o seu valor maximo, permitindo que o jogo continue imediatamente.

### C. Inventario
* **Capacidade:** 5 slots para itens.
* **Aquisicao:** Itens sao selecionados pelo jogador no inicio da partida (fase de selecao).

> **Backlog:** Expansao de slots de inventario (4-8 slots configuraveis).

---

## 3. O Tabuleiro (The Pool)

Diferente de uma arma (pilha LIFO), as pilulas sao dispostas na mesa como um **Conjunto (Pool)**.

* **Estado Oculto:** Todas as pilulas entram na mesa com seus efeitos ocultos para ambos os jogadores.
* **Conhecimento Publico:** A contagem total de tipos e mostrada no inicio (ex: "A mesa contem: 3 Venenos, 1 Cura, 4 Placebos").
* **Permanencia:** As pilulas permanecem na mesa ate serem consumidas ou destruidas por itens.
* **Progressao:** A quantidade de pilulas aumenta conforme as rodadas avancam (6 a 12 pilulas).

---

## 4. Tipos de Pilulas (Arquetipos)

As pilulas devem ser tratadas como objetos com propriedades de efeito.

| Tipo | Nome Comum | Efeito na Resistencia | Efeito Especial | Desbloqueio |
| :--- | :--- | :--- | :--- | :--- |
| **SAFE** | Placebo / Sugar | `0` (Neutro) | Passa a vez sem danos. Seguro. | Rodada 1 |
| **DMG_LOW** | Veneno Comum | `-1` ou `-2` | Dano padrao. Acumulativo. | Rodada 1 |
| **DMG_HIGH** | Toxina / Acido | `-3` ou `-4` | Frequentemente forca um Colapso imediato. | Rodada 1 |
| **HEAL** | Antidoto / Vacina | `+2` | Recupera resistencia. Nao pode exceder o MaxResistance. | Rodada 2 |
| **FATAL** | Morte (Cyanide) | `Infinity` (Zera) | Reduz a Resistencia a 0 instantaneamente. Garante a perda de 1 Vida. | Rodada 4 |
| **LIFE** | Vida Extra | `0` (Neutro) | Restaura +1 Vida perdida (cap no maximo). | Rodada 5 |

---

## 5. Sistema de Formas (Shapes)

Cada pilula possui uma **forma visual** (shape) independente do seu tipo de efeito.

### 5.1 Formas Disponiveis (16 Shapes)

| Shape | Arquivo | Desbloqueio | Descricao |
| :--- | :--- | :--- | :--- |
| `capsule` | shape_1.png | Rodada 1 | Capsula azul horizontal |
| `round` | shape_6.png | Rodada 1 | Pilula redonda azul |
| `triangle` | shape_8.png | Rodada 2 | Triangulo vermelho |
| `oval` | shape_11.png | Rodada 2 | Oval amarela |
| `cross` | shape_2.png | Rodada 3 | Cruz roxa |
| `heart` | shape_9.png | Rodada 3 | Coracao vermelho |
| `flower` | shape_4.png | Rodada 4 | Flor rosa |
| `star` | shape_13.png | Rodada 4 | Estrela verde |
| `pumpkin` | shape_12.png | Rodada 5 | Abobora laranja |
| `coin` | shape_14.png | Rodada 5 | Moeda dourada |
| `bear` | shape_5.png | Rodada 6 | Urso verde |
| `gem` | shape_15.png | Rodada 6 | Gema roxa |
| `skull` | shape_3.png | Rodada 7 | Caveira roxa |
| `domino` | shape_16.png | Rodada 7 | Domino laranja |
| `pineapple` | shape_7.png | Rodada 8 | Abacaxi rosa |
| `fruit` | shape_10.png | Rodada 8 | Fruta rosa |

> **Nota:** Shapes sao renderizadas via imagens PNG com fundo transparente (`src/assets/shapes/`).

### 5.2 Progressao de Shapes

| Rodada | Shapes Disponiveis | Total |
| :--- | :--- | :--- |
| 1 | capsule, round | 2 |
| 2 | + triangle, oval | 4 |
| 3 | + cross, heart | 6 |
| 4 | + flower, star | 8 |
| 5 | + pumpkin, coin | 10 |
| 6 | + bear, gem | 12 |
| 7 | + skull, domino | 14 |
| 8+ | + pineapple, fruit | 16 (todas) |

> **Nota:** Algumas shapes podem estar desabilitadas na versao atual e serao liberadas em fases futuras do jogo.

### 5.3 Mecanicas de Shape

**A. Shapes Aleatorias:**
* A forma de cada pilula e atribuida **aleatoriamente** na geracao do pool.
* Nao ha correlacao entre shape e tipo de efeito (adiciona camada de incerteza).
* Distribuicao usa sistema de progressao similar ao de tipos de pilulas.

**B. Itens Baseados em Shape:**
* Novos itens podem interagir com shapes (ex: "Shape Bomb" - elimina todas pilulas de uma forma).
* Permite estrategias baseadas em informacao visual.

**C. Sistema de Objetivos (Shape Combos):**
* Jogadores recebem objetivos de sequencia de shapes a consumir.
* Completar um objetivo concede bonus aleatorio.
* Novo objetivo e atribuido apenas no inicio de cada rodada.

### 5.4 Objetivos de Shape (Shape Quests)

| Exemplo de Objetivo | Recompensa Possivel |
| :--- | :--- |
| Consumir: Triangle -> Round -> Capsule | +1 Vida |
| Consumir: Flower -> Star | Reabastecer 1 Item usado |
| Consumir: Oval -> Heart | +2 Resistencia |

**Regras:**
* Apenas UM objetivo ativo por vez.
* Objetivo concluido = bonus aplicado, aguarda proxima rodada para novo objetivo.
* Objetivos sao pessoais (cada jogador tem o seu).
* Bonus sao aleatorios dentro de um pool definido.
* Sequencia gerada apenas com shapes disponiveis no pool atual.

> **Nota:** Sistema de objetivos sera detalhado em `.specs/shape-system/`.

---

## 6. Loop de Jogo (Game Loop)

### Fase 1: Selecao de Itens
1. Jogadores selecionam 5 itens cada do catalogo.
2. IA seleciona automaticamente.
3. Ambos confirmam para iniciar.

### Fase 2: Setup (Distribuicao)
1. Verifica se ambos tem Vidas > 0.
2. Preenche a mesa com pilulas aleatorias (quantidade e tipos baseados na rodada).
3. Atribui shapes aleatorias a cada pilula.
4. Atribui objetivo de shape a cada jogador.

### Fase 3: Turno do Jogador (Sequencia)
Um turno e composto por **Acoes Livres** seguidas de uma **Acao Obrigatoria**.

1. **Status Check:** Verifica se o jogador esta impedido (ex: Algemado). Se sim, pula para o fim do turno.
2. **Fase de Itens (Opcional & Ilimitada):**
    * O jogador pode usar qualquer quantidade de itens do inventario.
    * Itens podem revelar pilulas, curar a si mesmo, ou alterar o estado do oponente.
3. **Fase de Consumo (Obrigatoria):**
    * O jogador **DEVE** selecionar uma pilula da mesa.
    * *Excecao:* Se um item permitiu pular a vez ou forcar o oponente.
4. **Resolucao:**
    * O efeito da pilula e aplicado.
    * Verifica progresso do objetivo de shape.
    * Verifica-se `Resistencia <= 0`. Se verdadeiro -> Processa `Perda de Vida` e `Reset`.
5. **Fim do Turno:** Passa a vez para o oponente.

### Fase 4: Fim de Rodada
1. Quando pool esvazia, nova rodada inicia.
2. Shields sao removidos.
3. Novos objetivos de shape podem ser atribuidos.

---

## 7. Sistema de Itens (Power-ups)

Cada jogador seleciona 5 itens antes da partida.

### 7.1 Itens Implementados

| Categoria | Item | Efeito |
| :--- | :--- | :--- |
| **Intel** | Scanner | Revela o tipo de 1 pilula alvo ao jogador. |
| **Intel** | Inverter | Inverte o efeito de 1 pilula alvo (dano vira cura, cura vira dano). |
| **Intel** | Double | Dobra o efeito de 1 pilula alvo. |
| **Sustain** | Pocket Pill | Cura +4 de Resistencia imediatamente (sem gastar turno). |
| **Sustain** | Shield | Imunidade a efeitos de pilulas e itens por 1 rodada. |
| **Control** | Handcuffs | O oponente perde o proximo turno. |
| **Control** | Force Feed | Escolha uma pilula e obrigue o oponente a come-la agora. |
| **Chaos** | Shuffle | Embaralha as pilulas da mesa (reseta informacao de Scanners). |
| **Chaos** | Discard | Remove uma pilula da mesa sem ativar seu efeito. |

### 7.2 Backlog de Itens Futuros

| Categoria | Item | Efeito Proposto |
| :--- | :--- | :--- |
| **Control** | Give Me | Obriga oponente a trocar 1 item com o jogador. |
| **Chaos** | Shape Shift | Muda a forma de 1 pilula alvo. |
| **Chaos** | Shape Bomb | Remove todas pilulas de uma forma especifica. |

---

## 8. Sistema de Progressao

### 8.1 Progressao de Tipos
* Tipos de pilulas desbloqueiam gradualmente por rodada.
* Probabilidades interpolam de `startPct` para `endPct` ao longo das rodadas.

### 8.2 Progressao de Quantidade (Pool Scaling)
| Rodadas | Pilulas |
| :--- | :--- |
| 1-3 | 6 |
| 4-6 | 7 |
| 7-9 | 8 |
| 10-12 | 9 |
| 13-15 | 10 |
| 16-18 | 11 |
| 19+ | 12 (max) |

> **Referencia:** Detalhes de balanceamento em `docs/GAME-BALANCE.md`
