# Produto: Dosed (Pill Roulette)

## Conceito
Jogo de estrategia por turnos onde jogadores competem para ser o ultimo sobrevivente atraves do consumo de pilulas com efeitos ocultos.

## Modos de Jogo
- **Single Player:** Humano vs Bot (Local). O Bot é simulado no cliente.
- **Multiplayer:** Humano vs Humano (Online via Supabase). Sincronizado em tempo real.
- **Conceito Unificado:** O sistema trata todos como `Player`, diferenciados apenas pela origem das ações (Local, Remoto ou Bot).

## Mecanicas Implementadas

### Sistema de Vida (2 camadas)
- **Vidas:** 3 por jogador (perder todas = derrota)
- **Resistencia:** 6 pontos (zerar = perde 1 vida e reseta)

### Tipos de Pilulas

| Tipo     | Efeito                    | Cor      | Unlock    |
|----------|---------------------------|----------|-----------|
| SAFE     | Nenhum (placebo)          | Verde    | Rodada 1  |
| DMG_LOW  | -1 a -2 resistencia       | Amarelo  | Rodada 1  |
| DMG_HIGH | -3 a -4 resistencia       | Laranja  | Rodada 1  |
| HEAL     | +2 resistencia            | Ciano    | Rodada 2  |
| FATAL    | Zera resistencia          | Roxo     | Rodada 4  |
| LIFE     | +1 vida                   | Rosa     | Rodada 5  |

### Sistema de Formas (Shapes)

Cada pilula possui uma forma visual independente do tipo de efeito (16 shapes totais).

**Sistema ATIVAS/SAZONAIS:**
- **Shapes ATIVAS:** Aparecem normalmente no jogo
- **Shapes SAZONAIS:** Desabilitadas, ativadas em eventos especiais

| Status   | Shape     | Desbloqueio |
|----------|-----------|-------------|
| ATIVA    | round     | Rodada 1    |
| ATIVA    | flower    | Rodada 1    |
| ATIVA    | fruit     | Rodada 1    |
| ATIVA    | pumpkin   | Rodada 3    |
| ATIVA    | skull     | Rodada 3    |
| ATIVA    | bear      | Rodada 5    |
| SAZONAL  | capsule   | Desabilitada |
| SAZONAL  | triangle  | Desabilitada |
| SAZONAL  | oval      | Desabilitada |
| SAZONAL  | cross     | Desabilitada |
| SAZONAL  | heart     | Desabilitada |
| SAZONAL  | star      | Desabilitada |
| SAZONAL  | coin      | Desabilitada |
| SAZONAL  | gem       | Desabilitada |
| SAZONAL  | domino    | Desabilitada |
| SAZONAL  | pineapple | Desabilitada |

**Renderizacao:** Imagens PNG em `src/assets/shapes/` com fallback CSS.

Ver `.specs/shape-system/` para especificacao completa.

### Shape Quests (Objetivos de Forma)

Sistema de objetivos que concedem Pill Coins:

- Cada jogador recebe um objetivo de sequencia de shapes no inicio da rodada
- Consumir shapes na ordem correta avanca o progresso
- Consumir shape errada reseta o progresso
- Completar o objetivo: +1 Pill Coin
- Novo objetivo apenas na proxima rodada

**Exemplo:** Consumir `flower` -> `round` -> `skull` = +1 Pill Coin

### Pill Coins e Pill Store

**Pill Coins:**
- Moeda obtida ao completar Shape Quests
- Acumulavel entre rodadas
- Gasta na Pill Store

**Pill Store (Loja):**
- Aparece ao fim da rodada (opcional)
- Jogador sinaliza interesse clicando no icone de Pill Coins durante a rodada
- Timer de 30 segundos para fazer compras
- Sistema de carrinho (adicionar/remover antes de confirmar)

**Itens da Loja:**

| Tipo     | Item          | Efeito                          | Custo |
|----------|---------------|---------------------------------|-------|
| Boost    | 1-Up          | +1 Vida (se nao estiver MAX)    | 3     |
| Boost    | Reboot        | Resistencia = MAX               | 2     |
| Boost    | Scanner-2X    | 2 pills reveladas na proxima rodada | 2 |
| Power-Up | Scanner       | Adiciona ao inventario          | 2     |
| Power-Up | Shield        | Adiciona ao inventario          | 2     |
| Power-Up | Pocket Pill   | Adiciona ao inventario          | 2     |
| Power-Up | Discard       | Adiciona ao inventario          | 2     |
| Power-Up | Shape Bomb    | Adiciona ao inventario          | 3     |
| Power-Up | Shape Scanner | Adiciona ao inventario          | 3     |

### Sistema de Progressao

O jogo utiliza um sistema de progressao dinamica:

- **Tipos por rodada:** Pilulas desbloqueiam gradualmente (HEAL na rodada 2, FATAL na rodada 4)
- **Shapes por rodada:** Shapes ATIVAS desbloqueiam gradualmente
- **Quantidade por rodada:** Comeca com 6 pilulas, aumenta +1 a cada 3 rodadas (max 12)
- **Distribuicao proporcional:** A porcentagem define a quantidade exata de cada tipo/shape no pool

Ver `docs/GAME-BALANCE.md` para detalhes de balanceamento.

### Sistema de Itens (Power-ups)

Cada jogador seleciona 5 itens antes da partida (inventario fixo de 5 slots). Itens podem ser usados durante o turno.

| Categoria | Item          | Efeito                                |
|-----------|---------------|---------------------------------------|
| Intel     | Scanner       | Revela tipo de 1 pilula               |
| Intel     | Inverter      | Inverte efeito de 1 pilula            |
| Intel     | Double        | Dobra efeito de 1 pilula              |
| Intel     | Shape Scanner | Revela TODAS pilulas de uma forma     |
| Sustain   | Pocket Pill   | Cura +4 resistencia                   |
| Sustain   | Shield        | Imunidade a efeitos por 1 rodada      |
| Control   | Handcuffs     | Oponente perde proximo turno          |
| Control   | Force Feed    | Forca oponente a consumir pilula      |
| Chaos     | Shuffle       | Embaralha pilulas da mesa             |
| Chaos     | Discard       | Remove pilula sem ativar efeito       |
| Chaos     | Shape Bomb    | Elimina TODAS pilulas de uma forma    |

**Nota:** Shape Bomb e Shape Scanner sao exclusivos da Pill Store (nao aparecem na selecao inicial).

### Fluxo do Jogo

1. **Setup:** Tela inicial com botao "Iniciar Partida"
2. **ItemSelection:** Jogadores selecionam 5 itens cada (IA seleciona automaticamente)
3. **Playing:** Jogadores alternam turnos (podem usar itens e escolher pilulas)
4. **RoundEnding:** Quando pilulas acabam, verifica Game Over
5. **Shopping:** Se alguem sinalizou interesse na loja E tem coins (opcional, 30s)
6. **ResetRound:** Aplica boosts, gera novo pool, novos Shape Quests
7. **Ended:** Jogo termina quando um jogador perde todas as vidas

## Backlog de Funcionalidades

### Prioridade Alta (Pre-Producao)
- [ ] Sistema de Autenticacao (Supabase Auth)
  - Login social (Google, Discord, Twitch)
  - Guest-First: jogar sem cadastro
  - `Player.userId` para persistencia
- [ ] Multiplayer Online (Supabase Realtime)
  - Salas de 2-4 jogadores
  - Matchmaking basico
- [ ] Leaderboard/Ranking (requer auth)
- [ ] Sistema de sons

### Prioridade Media
- [ ] Conquistas e badges (requer auth)
- [ ] Estatisticas globais do jogo
- [ ] Ativar mais shapes SAZONAIS (eventos tematicos)
- [ ] Item "Give Me" (troca de itens entre jogadores)
- [ ] Item "Shape Shift" (muda forma de pilula)

### Prioridade Baixa
- [ ] Expansao de slots de inventario (4-8 configuraveis)
- [ ] Temporadas competitivas
- [ ] Sistema de referral/convites

### Sistema de Dificuldade da IA
- 4 niveis: `easy` (Paciente), `normal` (Cobaia), `hard` (Sobrevivente), `insane` (Hofmann)
- Selecionavel na tela de setup antes de iniciar partida
- Cada nivel altera: uso de typeCounts, deducao logica, chance de usar itens, delay de pensamento
- Ver `utils/aiConfig.ts` para configuracao detalhada
