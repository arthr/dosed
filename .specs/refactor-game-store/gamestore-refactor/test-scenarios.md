# Cenarios de Teste Manual

Executar apos cada batch de migracao e no final.

---

## Cenario 1: Partida Single Player Basica

**Pre-condicao:** Nenhuma partida em andamento

### Passos

1. [x] Iniciar nova partida vs IA
2. [x] Verificar que ambos jogadores tem 3 vidas e 6 resistencia
3. [x] Selecionar 2 itens na fase de selecao
4. [x] Confirmar selecao
5. [x] Verificar que jogo iniciou (fase "playing")
6. [x] Consumir uma pilula
7. [x] Verificar que turno passou para IA
8. [x] Aguardar IA jogar
9. [x] Repetir ate fim da rodada

**Resultado esperado:** Pool esvazia, nova rodada inicia ou shopping abre.

---

## Cenario 2: Uso de Itens

**Pre-condicao:** Partida em andamento, jogador tem itens

### Scanner
1. [x] Usar Scanner
2. [x] Selecionar pilula
3. [x] Verificar que pilula mostra tipo (revelada)
4. [x] Verificar que item foi consumido do inventario

### Inverter
1. [x] Usar Inverter
2. [x] Selecionar pilula
3. [x] Consumir a pilula
4. [x] Verificar que efeito foi invertido (dano virou cura ou vice-versa)

### Shield
1. [x] Usar Shield
2. [x] Verificar icone de shield no jogador
3. [x] Consumir pilula de dano
4. [x] Verificar que dano foi bloqueado

### Handcuffs
1. [x] Usar Handcuffs no oponente
2. [x] Verificar que oponente pula proximo turno
3. [x] Verificar que efeito expira

### Pocket Pill
1. [x] Usar Pocket Pill
2. [x] Verificar que resistencia aumentou

### Force Feed
1. [x] Usar Force Feed
2. [x] Selecionar pilula
3. [x] Verificar que oponente consumiu a pilula

### Shuffle
1. [x] Usar Shuffle
2. [x] Verificar que pool foi re-embaralhado (posicoes mudaram)

### Discard
1. [x] Usar Discard
2. [x] Selecionar pilula
3. [x] Verificar que pilula foi removida do pool

### Double
1. [x] Usar Double
2. [x] Selecionar pilula
3. [x] Consumir a pilula
4. [x] Verificar que efeito foi dobrado (dano ou cura x2)

### Shape Scanner
1. [x] Usar Shape Scanner
2. [x] Selecionar pilula
3. [x] Verificar que todas pilulas da mesma shape foram reveladas

### Shape Bomb
1. [x] Usar Shape Bomb
2. [x] Selecionar pilula
3. [x] Verificar que todas pilulas da mesma shape foram removidas

---

## Cenario 3: Colapso e Eliminacao

**Pre-condicao:** Partida em andamento

### Colapso
1. [x] Tomar dano suficiente para resistencia chegar a 0
2. [x] Verificar animacao de colapso
3. [x] Verificar que perdeu 1 vida
4. [x] Verificar que resistencia resetou para maximo

### Eliminacao
1. [x] Repetir colapsos ate vidas chegarem a 0
2. [x] Verificar tela de fim de jogo
3. [x] Verificar que oponente e declarado vencedor

---

## Cenario 4: Pill Store

**Pre-condicao:** Fim de rodada, pelo menos 1 jogador com pillCoins

### Acessar Loja
1. [x] Marcar "Ir para loja" antes do fim da rodada
2. [x] Verificar que loja abre apos pool esvaziar
3. [x] Verificar timer da loja

### Comprar Item
1. [x] Adicionar item ao carrinho
2. [x] Verificar que pillCoins sao suficientes
3. [x] Confirmar compra
4. [x] Verificar que item aparece no inventario
5. [x] Verificar que pillCoins foram debitados

### Comprar Boost
1. [x] Comprar "Life Up" (se disponivel)
2. [x] Verificar que vida aumentou na proxima rodada

### Scanner X2 (Boost)
1. [x] Comprar Scanner X2
2. [x] Verificar que 2 pills sao reveladas no inicio da proxima rodada

---

## Cenario 5: Rodadas

**Pre-condicao:** Partida em andamento

### Nova Rodada
1. [ ] Completar rodada (esvaziar pool)
2. [ ] Verificar overlay de nova rodada
3. [ ] Verificar que novo pool foi gerado
4. [ ] Verificar que contador de rodada incrementou
5. [ ] Verificar que contagens de tipos atualizaram

### Progressao de Dificuldade
1. [ ] Jogar ate rodada 3+
2. [ ] Verificar que pool tem mais pilulas
3. [ ] Verificar que novos tipos/shapes aparecem

---

## Cenario 6: Fim de Jogo

**Pre-condicao:** Partida em andamento

### Vitoria
1. [ ] Eliminar oponente
2. [ ] Verificar tela de vitoria
3. [ ] Verificar estatisticas (rodadas, pilulas, etc)

### Derrota
1. [ ] Ser eliminado
2. [ ] Verificar tela de derrota
3. [ ] Verificar que pode iniciar nova partida

---

## Cenario 7: Multiplayer (se aplicavel)

**Pre-condicao:** Dois dispositivos/abas

### Criar Sala
1. [ ] Host cria sala
2. [ ] Guest entra com codigo
3. [ ] Verificar que ambos veem a sala

### Sincronizacao
1. [ ] Host inicia partida
2. [ ] Verificar que Guest ve mesma fase
3. [ ] Host consome pilula
4. [ ] Verificar que Guest ve resultado
5. [ ] Guest usa item
6. [ ] Verificar que Host ve efeito

### Reconexao
1. [ ] Guest fecha aba
2. [ ] Guest reabre e entra na sala
3. [ ] Verificar que estado foi recuperado

---

## Checklist Rapido (Smoke Test)

Executar apos cada mudanca significativa:

- [ ] Iniciar partida
- [ ] Consumir 3 pilulas
- [ ] Usar 1 item
- [ ] Verificar que IA joga
- [ ] Verificar que nao ha erros no console

---

## Problemas Comuns

| Sintoma | Possivel Causa | Solucao |
|---------|----------------|---------|
| Turno nao passa | nextTurn nao chamado | Verificar gameFlowStore |
| Pilula nao some | consumePill nao chamado | Verificar pillPoolStore |
| Efeito nao aplica | playerStore nao atualizado | Verificar delegacao |
| Item nao consome | removeItemFromInventory falhou | Verificar playerStore |
| Loja nao abre | checkAndStartShopping quebrado | Verificar orquestracao |

