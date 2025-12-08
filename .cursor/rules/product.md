# Produto: Dosed (Pill Roulette)

## Conceito
Jogo de estrategia por turnos onde dois jogadores competem para ser o ultimo sobrevivente atraves do consumo de pilulas com efeitos ocultos.

## Modo de Jogo Atual
- **Humano vs IA** (Player 1 vs Player 2)
- Turnos alternados automaticamente
- IA com delay de "pensamento" para UX

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

### Sistema de Progressao

O jogo utiliza um sistema de progressao dinamica:

- **Tipos por rodada:** Pilulas desbloqueiam gradualmente (HEAL na rodada 2, FATAL na rodada 4)
- **Quantidade por rodada:** Comeca com 6 pilulas, aumenta +1 a cada 3 rodadas (max 12)
- **Distribuicao proporcional:** A porcentagem define a quantidade exata de cada tipo no pool

Ver `docs/GAME-BALANCE.md` para detalhes de balanceamento.

### Sistema de Itens (Power-ups)
Cada jogador seleciona 5 itens antes da partida. Itens podem ser usados durante o turno.

| Categoria | Item        | Efeito                                |
|-----------|-------------|---------------------------------------|
| Intel     | Scanner     | Revela tipo de 1 pilula               |
| Intel     | Inverter    | Inverte efeito de 1 pilula            |
| Intel     | Double      | Dobra efeito de 1 pilula              |
| Sustain   | Pocket Pill | Cura +2 resistencia                   |
| Sustain   | Shield      | Imunidade a dano por 1 turno          |
| Control   | Handcuffs   | Oponente perde proximo turno          |
| Control   | Force Feed  | Forca oponente a consumir pilula      |
| Chaos     | Shuffle     | Embaralha pilulas da mesa             |
| Chaos     | Discard     | Remove pilula sem ativar efeito       |

### Fluxo do Jogo
1. **Setup:** Tela inicial com botao "Iniciar Partida"
2. **ItemSelection:** Jogadores selecionam 5 itens cada (IA seleciona automaticamente)
3. **Playing:** Jogadores alternam turnos (podem usar itens e escolher pilulas)
4. **RoundEnding:** Quando pilulas acabam, nova rodada inicia
5. **Ended:** Jogo termina quando um jogador perde todas as vidas

## Funcionalidades Futuras (nao implementadas)
- Modo PvP (multiplayer)
- Sistema de sons
- Leaderboard/ranking
