# Requirements: Sistema de Itens (Power-ups)

## Visao Geral
Sistema de itens consumiveis que adiciona camada estrategica ao jogo, permitindo aos jogadores usar power-ups durante a partida para obter vantagens taticas.

---

## Requisitos Funcionais

### RF-001: Catalogo de Itens
**EARS:** O sistema DEVE fornecer um catalogo de itens dividido em 4 categorias.

#### Categorias e Itens:

| Categoria | Item | Efeito | Alvo |
|-----------|------|--------|------|
| **Intel** | Scanner | Revela o tipo de 1 pilula | Pilula |
| **Intel** | Inverter | Inverte o efeito de 1 pilula | Pilula |
| **Intel** | Double | Dobra o efeito de 1 pilula | Pilula |
| **Sustain** | Pocket Pill | Cura +2 resistencia (sem gastar turno) | Self |
| **Sustain** | Shield | Imunidade a efeitos por 1 rodada  (sem gastar turno) | Self |
| **Control** | Handcuffs | Oponente perde proximo turno | Oponente |
| **Control** | Force Feed | Obriga oponente a comer pilula escolhida | Oponente + Pilula |
| **Chaos** | Shuffle | Embaralha pilulas da mesa | Mesa |
| **Chaos** | Discard | Remove 1 pilula sem ativar efeito | Pilula |

---

### RF-002: Fase de Selecao de Itens
**EARS:** QUANDO o jogador clicar em "Iniciar Partida", O sistema DEVE exibir uma tela de selecao de itens ANTES de iniciar a fase de jogo.

**Criterios:**
- Cada jogador pode selecionar ate 5 itens
- Itens disponiveis devem ser exibidos por categoria
- Selecao deve mostrar contador (X/5)
- Botao "Confirmar" so ativa quando ambos jogadores confirmarem
- IA seleciona automaticamente 5 itens aleatorios

---

### RF-003: Inventario do Jogador
**EARS:** DURANTE a fase de jogo, O sistema DEVE exibir o inventario do jogador com os itens selecionados.

**Criterios:**
- Inventario visivel na area do jogador (AnimatedPlayerArea)
- Cada item deve ser clicavel para uso
- Itens usados devem ser removidos do inventario
- Quantidade restante de itens deve ser visivel

---

### RF-004: Uso de Itens
**EARS:** QUANDO o jogador clicar em um item no inventario, O sistema DEVE executar o efeito do item conforme sua categoria.

**Fluxos por tipo de alvo:**

#### Itens Self (Pocket Pill, Shield):
1. Clica no item
2. Efeito aplicado imediatamente
3. Item removido do inventario
4. Toast de feedback
5. **NAO** consome turno

#### Itens com Alvo Pilula (Scanner, Inverter, Double, Discard):
1. Clica no item
2. Sistema entra em modo "selecao de alvo"
3. Pilulas ficam destacadas como alvos validos
4. Jogador clica na pilula alvo
5. Efeito aplicado
6. Item removido do inventario
7. Toast de feedback
8. **NAO** consome turno

#### Itens com Alvo Oponente (Handcuffs):
1. Clica no item
2. Efeito aplicado ao oponente
3. Item removido
4. Toast de feedback
5. **NAO** consome turno

#### Itens Especiais (Force Feed):
1. Clica no item
2. Seleciona pilula
3. Efeito forca oponente a consumir
4. Fluxo normal de consumo ativado (PillReveal e Toas de feedback)

---

### RF-005: Efeitos Visuais
**EARS:** QUANDO um item for usado, O sistema DEVE exibir feedback visual apropriado.

**Criterios:**
- Scanner: Pilula alvo revela seu tipo temporariamente (borda brilhante)
- Inverter: Animacao de inversao na pilula (smallest badge com icon de 'reverso' no top right da pill)
- Shield: Muda cor dos icones de resistência para dourado e adiciona glow nos icones de live
- Handcuffs: Icone de algema no oponente
- Shuffle: Animacao de embaralhamento nas pilulas

---

### RF-006: IA e Itens
**EARS:** QUANDO for turno da IA, O sistema DEVE permitir que a IA use itens estrategicamente.

**Criterios:**
- IA pode usar 1 item por turno (aleatorio ou baseado em heuristica simples)
- IA prioriza: Shield se baixa vida, Scanner se muitas pilulas, Handcuffs se oponente perigoso
- IA tem 35% de chance de usar item antes de escolher pilula 
- Criar arquivo configurações da IA para fácil ajuste no seu comportamento

---

## Requisitos Nao-Funcionais

### RNF-001: Performance
- Animacoes de item nao devem bloquear UI por mais de 500ms
- Selecao de alvo deve ter feedback visual imediato (<100ms)

### RNF-002: UX
- Itens devem ter icones distintos e reconheciveis
- Tooltips devem explicar efeito de cada item
- Feedback de uso deve ser claro (toast + animacao)

### RNF-003: Consistencia Visual
- Itens devem seguir estetica 8bit do jogo
- Cores por categoria: Intel=Azul, Sustain=Verde, Control=Amarelo, Chaos=Roxo

---

## Criterios de Aceitacao

- [x] Jogador pode selecionar ate 5 itens antes da partida
- [x] Inventario e visivel durante o jogo
- [x] Todos os 9 itens funcionam conforme especificado
- [x] IA usa itens de forma coerente
- [x] Feedback visual para cada tipo de item
- [x] Itens com alvo permitem selecao de alvo
- [x] Itens consumidos sao removidos do inventario

