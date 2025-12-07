# Dosed (Pill Roulette): Especificação de Mecânica

## 1. Visão Geral
Um jogo de estratégia por turnos de soma zero, onde dois jogadores (Humano vs IA ou PvP) competem para ser o último sobrevivente. A mecânica central gira em torno de **Gestão de Risco** e **Informação Oculta**. O jogo utiliza um sistema de vida de duas camadas (Resistência e Vidas).

## 2. Estrutura do Jogador (Stats)

Cada entidade (Jogador/Inimigo) possui os seguintes atributos:

### A. Vidas (Lives / Defibrillators)
* **Definição:** O contador "Real" de sobrevivência.
* **Valor Típico:** 2 a 3 vidas no início da partida.
* **Condição de Derrota:** Se Vidas chegarem a 0, o jogador é eliminado permanentemente.

### B. Resistência (Resistance / Tolerance)
* **Definição:** A "Barra de Escudo" ou HP temporário da rodada atual. Representa o limite de toxicidade que o corpo aguenta antes de colapsar.
* **Valor Típico:** 4 a 6 pontos (varia conforme a dificuldade).
* **Mecânica de Colapso (Critical Failure):**
    1.  Quando a Resistência atinge ≤ 0, o jogador sofre um **Colapso**.
    2.  **Penalidade:** -1 Vida.
    3.  **Reset:** A Resistência é restaurada para o seu valor máximo (ou um valor penalizado, ex: Max - 1), permitindo que o jogo continue imediatamente.

### C. Inventário
* **Capacidade:** 4 a 8 slots para itens.
* **Aquisição:** Itens são distribuídos no início de cada "Rodada de Distribuição" (Deal Phase).

---

## 3. O Tabuleiro (The Pool)

Diferente de uma arma (pilha LIFO), as pílulas são dispostas na mesa como um **Conjunto (Pool)**.

* **Estado Oculto:** Todas as pílulas entram na mesa com seus efeitos ocultos para ambos os jogadores.
* **Conhecimento Público:** A contagem total de tipos é mostrada no início (ex: "A mesa contém: 3 Venenos, 1 Cura, 4 Placebos").
* **Permanência:** As pílulas permanecem na mesa até serem consumidas ou destruídas por itens.

---

## 4. Tipos de Pílulas (Arquétipos)

As pílulas devem ser tratadas como objetos com propriedades de efeito.

| Tipo | Nome Comum | Efeito na Resistência | Efeito Especial |
| :--- | :--- | :--- | :--- |
| **SAFE** | Placebo / Sugar | `0` (Neutro) | Passa a vez sem danos. Seguro. |
| **DMG_LOW** | Veneno Comum | `-1` ou `-2` | Dano padrão. Acumulativo. |
| **DMG_HIGH** | Toxina / Ácido | `-3` ou `-4` | Frequentemente força um Colapso imediato se a resistência não estiver cheia. |
| **FATAL** | Morte (Cyanide) | `Infinity` (Zera) | Reduz a Resistência a 0 instantaneamente, independentemente do valor atual. Garante a perda de 1 Vida. |
| **HEAL** | Antídoto / Vacina | `+2` ou `MAX` | Recupera resistência. Não pode exceder o MaxResistance. |

---

## 5. Loop de Jogo (Game Loop)

### Fase 1: Setup (Distribuição)
1.  Verifica se ambos têm Vidas > 0.
2.  Preenche a mesa com um novo set de pílulas aleatórias (baseado em probabilidades configuráveis).
3.  Distribui itens aleatórios para os jogadores (até encher slots vazios).

### Fase 2: Turno do Jogador (Sequência)
Um turno é composto por **Ações Livres** seguidas de uma **Ação Obrigatória**.

1.  **Status Check:** Verifica se o jogador está impedido (ex: Algemado). Se sim, pula para o fim do turno.
2.  **Fase de Itens (Opcional & Ilimitada):**
    * O jogador pode usar qualquer quantidade de itens do inventário.
    * Itens podem revelar pílulas, curar a si mesmo, ou alterar o estado do oponente.
3.  **Fase de Consumo (Obrigatória):**
    * O jogador **DEVE** selecionar uma pílula da mesa.
    * *Exceção:* Se um item permitiu pular a vez ou forçar o oponente.
4.  **Resolução:**
    * O efeito da pílula é aplicado.
    * Verifica-se `Resistência <= 0`. Se verdadeiro -> Processa `Perda de Vida` e `Reset`.
5.  **Fim do Turno:** Passa a vez para o oponente.

---

## 6. Sistema de Itens (Power-ups)

Para recriar a estratégia, você precisa destas categorias de itens:

1.  **Intel (Informação):**
    * *Scanner:* Revela o tipo de 1 pílula alvo ao jogador.
    * *Inverter:* Inverte o efeito de 1 pílula alvo.
    * *Double:* Dobra o efeito de 1 pílula alvo.
2.  **Sustain (Sobrevivência):**
    * *Pílula de Bolso:* Cura +1 ou +2 de Resistência imediatamente (sem gastar turno).
    * *Blindagem:* Fica ímune a qualquer efeito de pílulas e itens de adversários durante 1 turno.
3.  **Control (Controle):**
    * *Handcuffs (Algemas):* O oponente perde o próximo turno (passa turno para o próximo jogador).
    * *Force Feed:* Escolha uma pílula e obrigue um oponente a comê-la agora.
    * *Give Me:* Obriga um oponente a trocar 1 item com o jogador.
4.  **Chaos (Manipulação):**
    * *Shuffle:* Embaralha as pílulas da mesa (reseta qualquer informação obtida por Scanners anteriores).
    * *Discard:* Remove uma pílula da mesa sem ativar seu efeito.