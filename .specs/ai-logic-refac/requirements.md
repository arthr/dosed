# Requirements: Refatoracao da AI Logic + Sistema de Dificuldade

## Visao Geral

Esta feature refatora completamente a logica da IA (`aiLogic.ts`) para:
1. Suportar **4 niveis de dificuldade** selecionaveis na tela inicial
2. Considerar as **novas features do jogo** (Shape Quests, Pill Store, novos itens)
3. Implementar **heuristicas contextuais** mais sofisticadas por nivel

> **Objetivo:** Criar uma IA que oferece experiencia desafiadora e personalizada, adaptando-se ao nivel de habilidade do jogador.

---

## Niveis de Dificuldade

| Nivel | ID | Nome Display | Descricao |
| :--- | :--- | :--- | :--- |
| 1 | `easy` | Paciente | IA previsivel, raramente usa itens estrategicamente |
| 2 | `normal` | Cobaia | IA balanceada, comportamento atual (baseline) |
| 3 | `hard` | Sobrevivente | IA agressiva, prioriza itens ofensivos |
| 4 | `insane` | Hofmann | IA calculista, maximiza vantagem a cada turno |

---

## Requisitos Funcionais

### RF-001: Selecao de Dificuldade na Tela Inicial

**EARS:** QUANDO o usuario estiver na tela inicial (phase=setup), o sistema DEVE exibir um seletor de dificuldade posicionado acima do botao "Iniciar Partida".

**Criterios de Aceitacao:**
- [ ] Select/Dropdown com 4 opcoes (Paciente, Cobaia, Sobrevivente, Hofmann)
- [ ] Dificuldade padrao: Cobaia (Normal)
- [ ] Selecao persiste durante a sessao (nao precisa persistir entre reloads)
- [ ] Visual consistente com UI 8bit existente
- [ ] Tooltip ou descricao breve para cada nivel

---

### RF-002: Configuracao de Dificuldade no GameConfig

**EARS:** QUANDO o jogo for iniciado, o sistema DEVE armazenar a dificuldade selecionada no estado global para uso pela AI.

**Novo Campo:**
```typescript
interface GameConfig {
  // ... campos existentes
  difficulty: DifficultyLevel // 'easy' | 'normal' | 'hard' | 'insane'
}
```

**Criterios de Aceitacao:**
- [ ] `DifficultyLevel` type definido em `types/game.ts`
- [ ] `GameState` inclui campo `difficulty`
- [ ] `initGame()` aceita parametro de dificuldade
- [ ] Dificuldade acessivel via selector `useDifficulty()`

---

### RF-003: Parametros de IA por Dificuldade

**EARS:** O sistema DEVE definir parametros de comportamento da IA baseados na dificuldade selecionada.

**Parametros Configuraveis:**

| Parametro | Easy | Normal | Hard | Insane | Descricao |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `itemUseChance` | 15% | 35% | 55% | 80% | Chance base de usar item |
| `thinkingDelayMin` | 1500ms | 1000ms | 800ms | 500ms | Delay minimo |
| `thinkingDelayMax` | 3500ms | 3000ms | 2000ms | 1200ms | Delay maximo |
| `usesTypeCounts` | false | true | true | true | Usa contagem publica para calculos |
| `usesRevealedPills` | false | false | true | true | Usa pilulas reveladas na decisao |
| `avoidsRevealedDanger` | false | false | true | true | Evita perigosas reveladas |
| `usesDeduction` | false | false | false | true | Deduz tipos impossiveis |
| `prioritizesShapeQuest` | false | false | false | true | Prioriza completar quest |
| `usesStoreStrategically` | false | false | true | true | Compra estrategica na loja |
| `targetsWeakPlayer` | false | false | true | true | Foca em atacar jogador fraco |

**Legenda de Inteligencia:**
- **Easy:** IA "burra", ignora todas informacoes publicas
- **Normal:** IA usa `typeCounts` para itens defensivos (Shield se risco alto)
- **Hard:** IA usa `typeCounts` + `revealedPills` para decisoes
- **Insane:** IA usa tudo + deducao logica (ex: se todas FATAL reveladas, outras nao sao FATAL)

**Criterios de Aceitacao:**
- [ ] Interface `AIConfig` definida com todos parametros
- [ ] `AI_CONFIGS: Record<DifficultyLevel, AIConfig>` com valores tabelados
- [ ] Funcao `getAIConfig(difficulty)` retorna configuracao atual

---

### RF-004: Selecao de Pilulas Inteligente

**EARS:** QUANDO a dificuldade for Hard ou Insane, a IA DEVE considerar informacoes conhecidas (pilulas reveladas + typeCounts) para escolher pilulas.

**Comportamento por Nivel:**
- **Easy:** Selecao aleatoria pura
- **Normal:** Selecao aleatoria, mas considera typeCounts para decisao de itens
- **Hard:** Evita pilulas reveladas perigosas + usa typeCounts para calcular risco
- **Insane:** Maximiza informacao, deduz tipos, calcula probabilidades

**Heuristicas Baseadas em typeCounts (Hard/Insane):**

```typescript
// Calcular probabilidade de cada tipo no pool nao-revelado
function calculateTypeOdds(typeCounts, revealedPills, pillPool): Record<PillType, number> {
  // Desconta reveladas do count
  // Divide pelo total nao-revelado
  // Retorna % de chance de cada tipo
}
```

**Exemplos de Decisao:**
1. Se `typeCounts.FATAL = 1` e `pillPool.length = 3` -> 33% de FATAL -> RISCO ALTO
2. Se `typeCounts.SAFE = 0` e `typeCounts.HEAL = 0` -> 100% dano -> USAR SHIELD
3. Se `typeCounts.SAFE = 3` e `pillPool.length = 4` -> 75% safe -> SEGURO
4. Se pilula revelada e FATAL e `typeCounts.FATAL = 1` -> 0% FATAL nas outras

**Heuristicas Baseadas em Reveladas (Hard/Insane):**
1. Se tem pilula SAFE revelada -> seleciona ela (100%)
2. Se tem pilula HEAL revelada e resistencia < 50% -> seleciona ela (80%)
3. Se todas reveladas sao perigosas -> seleciona pilula NAO revelada
4. **DEDUCAO:** Se `typeCounts.FATAL = 1` e uma revelada e FATAL, as outras NAO sao FATAL

**Criterios de Aceitacao:**
- [ ] Funcao `calculateTypeOdds()` implementada
- [ ] Funcao `selectSmartPill()` usa odds calculadas
- [ ] Considera `revealedPills` + `typeCounts` do estado global
- [ ] Logica de deducao para Insane
- [ ] Respeita nivel de dificuldade

---

### RF-004B: Analise de Risco Baseada em typeCounts

**EARS:** O sistema DEVE calcular nivel de risco do pool atual baseado em typeCounts.

**Niveis de Risco:**
| Nivel | Condicao | Acao Recomendada |
| :--- | :--- | :--- |
| CRITICO | FATAL > 0 e pool <= 3 | Shield, Handcuffs, Force Feed |
| ALTO | (DMG_HIGH + FATAL) / pool > 50% | Shield, Pocket Pill |
| MEDIO | SAFE / pool < 30% | Scanner, cautela |
| BAIXO | SAFE / pool > 50% | Pode arriscar |

**Uso do Nivel de Risco:**
- **Decisao de Item:** IA prioriza itens defensivos em risco ALTO/CRITICO
- **Decisao de Pilula:** IA mais conservadora em risco alto
- **Force Feed:** Usar quando risco e alto (prejudica oponente)
- **Handcuffs:** Usar quando risco e critico (forca oponente a risco)

**Criterios de Aceitacao:**
- [ ] Funcao `calculatePoolRisk(typeCounts, poolSize)` implementada
- [ ] Retorna nivel de risco (CRITICO, ALTO, MEDIO, BAIXO)
- [ ] Heuristicas de item usam nivel de risco

---

### RF-005: Uso Estrategico de Itens

**EARS:** O sistema DEVE ajustar heuristicas de uso de itens baseado na dificuldade.

**Comportamento por Nivel:**

#### Easy (Paciente):
- Raramente usa itens (15% chance)
- Sem logica contextual (aleatorio)
- Nao prioriza itens por situacao

#### Normal (Cobaia):
- Chance moderada (35%)
- Prioriza Shield se vida <= 1
- Prioriza Pocket Pill se resistencia < 50%

#### Hard (Sobrevivente):
- Chance alta (55%)
- Toda logica do Normal +
- Usa Force Feed quando oponente tem baixa resistencia
- Usa Handcuffs para garantir turno extra em situacoes criticas
- Usa Scanner quando pool >= 5 pilulas
- Usa Shape Bomb/Scanner na shape com mais pilulas

#### Insane (Hofmann):
- Chance muito alta (80%)
- Toda logica do Hard +
- Calcula "valor esperado" de cada item
- Considera Shape Quest proprio (usa itens que ajudam completar)
- Prioriza itens que maximizam vantagem liquida
- Usa Inverter em pilulas reveladas como HEAL se oponente vai pegar
- Usa Double em pilulas reveladas como FATAL se vai forcar oponente

**Criterios de Aceitacao:**
- [ ] Funcao `calculateItemValue()` com score contextual
- [ ] Heuristicas documentadas por nivel
- [ ] Respeita parametros de `AIConfig`

---

### RF-006: Selecao Automatica de Itens (Pre-Jogo)

**EARS:** QUANDO na fase de selecao de itens, a IA DEVE selecionar itens baseado na dificuldade.

**Comportamento por Nivel:**
- **Easy:** 5 itens aleatorios (atual)
- **Normal:** Prioriza variedade (1 de cada categoria se possivel)
- **Hard:** Prioriza itens ofensivos (Force Feed, Handcuffs, Shape Bomb)
- **Insane:** Composicao otimizada (2 Intel, 2 Sustain, 1 Control)

**Criterios de Aceitacao:**
- [ ] `selectAIInitialItems(difficulty)` implementada
- [ ] Respeita restricoes de itens disponiveis (Shape Bomb/Scanner so na loja)
- [ ] Comportamento diferenciado por nivel

---

### RF-007: Comportamento na Pill Store (Fase Shopping)

**EARS:** QUANDO a fase for shopping e a IA tiver Pill Coins, a IA DEVE decidir compras baseado na dificuldade.

**Comportamento por Nivel:**
- **Easy:** Nunca sinaliza interesse na loja
- **Normal:** Sinaliza se tiver >= 3 coins, compra itens aleatorios
- **Hard:** Sinaliza se tiver >= 2 coins, prioriza Power-Ups
- **Insane:** Sempre sinaliza se tiver coins, maximiza valor/custo

**Prioridades de Compra (Insane):**
1. 1-Up se vida = 1 (custo 3, valor altissimo)
2. Scanner-2X se nao tem reveladas (custo 2, valor alto)
3. Shield se nao tem no inventario (custo 2, valor alto)
4. Shape Bomb se shapes repetidas no pool (custo 3, valor medio)

**Criterios de Aceitacao:**
- [ ] `shouldAIUseStore(difficulty, pillCoins)` implementada
- [ ] `selectAIStoreItems(difficulty, pillCoins, currentInventory)` implementada
- [ ] Timeout adequado para "pensar" antes de comprar

---

### RF-008: Consideracao de Shape Quests

**EARS:** QUANDO a dificuldade for Insane, a IA DEVE considerar seu Shape Quest ao tomar decisoes.

**Heuristicas:**
- Se proximo shape do quest esta no pool, prioriza consumi-la
- Evita itens que eliminem shapes do quest (Shape Bomb na shape errada)
- Se quest esta prestes a completar (1 shape restante), dobra esforco

**Criterios de Aceitacao:**
- [ ] IA acessa `shapeQuests[aiPlayerId]` do estado
- [ ] Logica de priorizacao implementada
- [ ] Apenas ativo no nivel Insane

---

## Requisitos Nao-Funcionais

### RNF-001: Tempo de Resposta
- IA deve "pensar" por tempo variavel (delay configuravel por nivel)
- Delays menores em niveis mais dificeis (parece mais "agressiva")

### RNF-002: Previsibilidade
- Niveis mais faceis devem ter comportamento mais previsivel
- Niveis mais dificeis podem ser "imprevisveis" dentro das heuristicas

### RNF-003: Balanceamento
- IA no nivel Normal deve ter ~50% win rate contra jogador medio
- IA no nivel Hard deve ter ~65% win rate
- IA no nivel Insane deve ser desafiadora mesmo para jogadores experientes

### RNF-004: Retrocompatibilidade
- Comportamento atual deve ser mapeado para nivel Normal
- Nenhuma quebra de funcionalidade existente

---

## Dependencias

### Features Existentes Utilizadas:
- Shape Quests (`shapeQuests` no GameState)
- Pill Store (`storeState`, `wantsStore`)
- Sistema de Itens (todos os 11 itens)
- Pilulas Reveladas (`revealedPills`)
- Progressao de Pills e Shapes

### Arquivos Afetados:
- `src/types/game.ts` - Adicionar DifficultyLevel
- `src/utils/aiLogic.ts` - Refatoracao completa
- `src/utils/constants.ts` - Adicionar AI_CONFIGS
- `src/stores/gameStore.ts` - Campo difficulty, selectors
- `src/hooks/useAIPlayer.ts` - Usar nova aiLogic
- `src/hooks/useAIItemSelection.ts` - Selecao por dificuldade
- `src/App.tsx` - Seletor de dificuldade na UI
- `src/components/game/InfoPanel.tsx` - Possivel atualizacao

---

## Glossario

| Termo | Definicao |
| :--- | :--- |
| AIConfig | Objeto com parametros de comportamento da IA |
| DifficultyLevel | Enum/union type dos 4 niveis |
| Heuristica | Regra de decisao baseada em contexto |
| Valor Esperado | Calculo de beneficio medio de uma acao |
| Shape Quest | Objetivo de sequencia de shapes para ganhar Pill Coins |

