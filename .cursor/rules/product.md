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
| Tipo     | Efeito                    | Cor      |
|----------|---------------------------|----------|
| SAFE     | Nenhum (placebo)          | Verde    |
| DMG_LOW  | -1 a -2 resistencia       | Amarelo  |
| DMG_HIGH | -3 a -4 resistencia       | Laranja  |
| FATAL    | Zera resistencia          | Roxo     |
| HEAL     | +2 resistencia            | Ciano    |

### Fluxo do Jogo
1. **Setup:** Pool de pilulas gerado aleatoriamente
2. **Playing:** Jogadores alternam turnos escolhendo pilulas
3. **RoundEnding:** Quando pilulas acabam, nova rodada inicia
4. **Ended:** Jogo termina quando um jogador perde todas as vidas

## Funcionalidades Futuras (nao implementadas)
- Sistema de inventario e itens
- Modo PvP (multiplayer)
- Sistema de sons
- Leaderboard/ranking
