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
1. [ ] Usar Scanner
2. [ ] Selecionar pilula
3. [ ] Verificar que pilula mostra tipo (revelada)
4. [ ] Verificar que item foi consumido do inventario

### Inverter
1. [ ] Usar Inverter
2. [ ] Selecionar pilula
3. [ ] Consumir a pilula
4. [ ] Verificar que efeito foi invertido (dano virou cura ou vice-versa)

### Shield
1. [ ] Usar Shield
2. [ ] Verificar icone de shield no jogador
3. [ ] Consumir pilula de dano
4. [ ] Verificar que dano foi bloqueado

### Handcuffs
1. [ ] Usar Handcuffs no oponente
2. [ ] Verificar que oponente pula proximo turno
3. [ ] Verificar que efeito expira

### Pocket Pill
1. [ ] Usar Pocket Pill
2. [ ] Verificar que resistencia aumentou

### Force Feed
1. [ ] Usar Force Feed
2. [ ] Selecionar pilula
3. [ ] Verificar que oponente consumiu a pilula

### Shuffle
1. [ ] Usar Shuffle
2. [ ] Verificar que pool foi re-embaralhado (posicoes mudaram)

### Discard
1. [ ] Usar Discard
2. [ ] Selecionar pilula
3. [ ] Verificar que pilula foi removida do pool

---

## Cenario 3: Colapso e Eliminacao

**Pre-condicao:** Partida em andamento

### Colapso
1. [ ] Tomar dano suficiente para resistencia chegar a 0
2. [ ] Verificar animacao de colapso
3. [ ] Verificar que perdeu 1 vida
4. [ ] Verificar que resistencia resetou para maximo

### Eliminacao
1. [ ] Repetir colapsos ate vidas chegarem a 0
2. [ ] Verificar tela de fim de jogo
3. [ ] Verificar que oponente e declarado vencedor

---

## Cenario 4: Pill Store

**Pre-condicao:** Fim de rodada, pelo menos 1 jogador com pillCoins

### Acessar Loja
1. [ ] Marcar "Ir para loja" antes do fim da rodada
2. [ ] Verificar que loja abre apos pool esvaziar
3. [ ] Verificar timer da loja

### Comprar Item
1. [ ] Adicionar item ao carrinho
2. [ ] Verificar que pillCoins sao suficientes
3. [ ] Confirmar compra
4. [ ] Verificar que item aparece no inventario
5. [ ] Verificar que pillCoins foram debitados

### Comprar Boost
1. [ ] Comprar "Life Up" (se disponivel)
2. [ ] Verificar que vida aumentou na proxima rodada

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

