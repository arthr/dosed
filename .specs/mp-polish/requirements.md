# Requisitos: MP-Polish (Multiplayer Polish & Visual Sync)

## Visao Geral

Polimento do modo multiplayer com tres frentes:
1. **Room Exit**: Refatoracao do sistema de saida de sala
2. **Visual Sync**: Sincronizacao de feedbacks visuais entre jogadores
3. **GameOver & Rematch**: Tela de fim de jogo contextualizada e sistema de revanche

> **Nota:** Sistema de reconexao automatica foi movido para fase futura (backlog).
> O sistema atual de `DisconnectedOverlay` com countdown de 60s ja cobre desconexoes abruptas.

## Requisitos Funcionais

### RF-001: Identificacao de Role no Evento de Saida

**EARS:** WHEN um jogador sai voluntariamente da sala, THEN o evento `player_left` MUST incluir o `role` (host/guest) de quem saiu.

**Criterios de Aceitacao:**
- [ ] Payload de `player_left` inclui campo `role: 'host' | 'guest'`
- [ ] Campo `role` e obrigatorio para novos eventos
- [ ] Eventos legados (sem role) sao tratados com fallback

---

### RF-002: Comportamento Quando Host Sai

**EARS:** WHEN o host sai voluntariamente, THEN a sala MUST ser encerrada e o guest MUST receber feedback visual.

**Fluxo:**
1. Host clica em "Sair da Partida"
2. Host envia `player_left` com `role: 'host'`
3. Guest recebe evento e ve overlay "Sala Encerrada"
4. Guest clica "Voltar ao Menu" e retorna a tela inicial

**Criterios de Aceitacao:**
- [ ] `DisconnectedOverlay` expandido para tratar caso `hostLeftVoluntarily`
- [ ] Exibe mensagem: "O host encerrou a partida"
- [ ] Botao "Voltar ao Menu" reseta multiplayer e game stores
- [ ] Guest nao fica "preso" em tela intermediaria

**Implementacao:** Expandir `DisconnectedOverlay` existente com novo estado (nao criar componente separado).

---

### RF-003: Comportamento Quando Guest Sai

**EARS:** WHEN o guest sai voluntariamente, THEN o host MUST retornar ao WaitingRoom com o codigo da sala preservado.

**Fluxo:**
1. Guest clica em "Sair da Partida"
2. Guest envia `player_left` com `role: 'guest'`
3. Host recebe evento
4. Host volta para `WaitingRoom` com codigo da sala visivel
5. Host pode compartilhar codigo para novo jogador

**Criterios de Aceitacao:**
- [ ] Host volta para `WaitingRoom` (nao para tela inicial)
- [ ] Codigo da sala permanece o mesmo
- [ ] Dados do guest anterior sao limpos (`guestId`, `guestName`)
- [ ] gameStore e resetado para permitir novo jogo

---

### RF-004: Toast de Notificacao Para Host

**EARS:** WHEN o guest sai da sala, THEN o host MUST receber um toast informativo.

**Criterios de Aceitacao:**
- [ ] Toast exibe "Jogador saiu da sala"
- [ ] Toast usa tipo apropriado (info, nao item)
- [ ] Toast desaparece apos 3 segundos

---

## Requisitos Nao-Funcionais

### RNF-001: Retrocompatibilidade

Eventos `player_left` sem o campo `role` devem ser tratados com fallback para comportamento legado (status `abandoned`).

### RNF-002: Consistencia de Estado

Apos qualquer operacao de saida, os stores (`multiplayerStore`, `gameStore`, `overlayStore`) devem estar em estado consistente, sem dados orfaos.

### RNF-003: UX Sem Bloqueio

O usuario nunca deve ficar "preso" em uma tela sem opcao de acao. Sempre deve haver um botao ou acao disponivel.

---

## Dependencias

### Features Existentes Afetadas
- `ForfeitDialog` - ja implementado, funciona corretamente
- `DisconnectedOverlay` - EXPANDIR para tratar saida voluntaria do host
- `WaitingRoom` - reutilizado para host aguardar novo jogador

### Stores Afetados
- `multiplayerStore` - handler de `player_left`, `leaveRoom`, novo campo `hostLeftVoluntarily`
- `gameStore` - `resetGame` (ja existe)
- `toastStore` - `show` para notificacoes

### Tipos Afetados
- `PlayerLeftEvent` em `types/events.ts` - adicionar campo `role`
- `RoomStatus` em `types/multiplayer.ts` (uso existente)

---

---

## Requisitos de Visual Sync

### RF-005: Overlay de Item Usado pelo Oponente

**EARS:** WHEN o oponente usa um item, THEN o jogador local MUST ver o `ItemEffectOverlay` correspondente.

**Criterios de Aceitacao:**
- [ ] Ao receber evento `item_used`, abre `ItemEffectOverlay` com `itemType`
- [ ] Overlay auto-dismiss em 1.5s (mesmo tempo do local)
- [ ] Mensagem indica que foi acao do oponente (ex: "Oponente usou Scanner")

---

### RF-006: Indicador Visual de Turno do Oponente

**EARS:** WHEN e turno do oponente, THEN o jogador local SHOULD ver feedback visual de "aguardando".

**Estado Atual:** `TurnIndicator` JA possui prop `showWaitingForOpponent` implementada.

**Criterios de Aceitacao:**
- [ ] Prop `showWaitingForOpponent` passada corretamente pelo `GameBoard`
- [ ] Animacao sutil (pulse ou dots) indica que esta aguardando acao
- [ ] Consistente com mensagem ja existente para IA

---

### RF-007: Sincronizacao de Toast de Selecao de Item

**EARS:** WHEN o oponente seleciona/confirma itens na fase `itemSelection`, THEN o jogador local SHOULD ver feedback.

**Criterios de Aceitacao:**
- [ ] Toast quando oponente confirma selecao: "Oponente pronto!"
- [ ] Indicador visual de que oponente ainda esta selecionando

---

### RF-008: Feedback de Pill Consumida Melhorado

**EARS:** WHEN o oponente consome uma pill, THEN o jogador local MUST ver feedback visual contextualizado.

**Estado Atual:** Toast simples implementado (HOTFIX-MP-008)

**Melhorias:**
- [ ] Toast exibe icone da pill consumida (shape)
- [ ] Animacao no card do oponente (shake se dano, glow se cura)
- [ ] Toast contextualiza quem foi afetado (consumidor vs forcedTarget)

---

### RF-009: GameOver Diferenciado por Jogador

**EARS:** WHEN o jogo termina, THEN cada jogador MUST ver resultado contextualizado (vitoria/derrota).

**Problema Atual:** Ambos jogadores veem tela de "VENCEDOR!", independente de quem ganhou.

**Criterios de Aceitacao:**
- [ ] Jogador vencedor ve: "VENCEDOR!" com trofeu
- [ ] Jogador perdedor ve: "DERROTA!" com icone apropriado
- [ ] Stats sao exibidos para ambos (rodadas, pilulas, overdoses)
- [ ] Nome do vencedor e exibido para ambos

---

### RF-010: Fluxo de Rematch (Jogar Novamente)

**EARS:** WHEN um jogador clica "Jogar Novamente" em multiplayer, THEN o sistema MUST aguardar confirmacao do outro jogador.

**Fluxo Desejado:**
1. Jogador A clica "Jogar Novamente"
2. Jogador A ve: "Aguardando oponente..."
3. Jogador B ve: botoes "Jogar Novamente" / "Sair"
4. **Se ambos confirmam:** Nova partida inicia (mesma sala)
5. **Se um recusa ou timeout:** Sala finalizada, ambos voltam ao menu

**Criterios de Aceitacao:**
- [ ] Novo evento `rematch_requested` enviado quando jogador clica "Jogar Novamente"
- [ ] Novo evento `rematch_accepted` enviado quando segundo jogador aceita
- [ ] Novo evento `rematch_declined` enviado quando jogador clica "Sair"
- [ ] Estado `rematchState` no multiplayerStore
- [ ] UI mostra "Aguardando oponente..." para quem ja confirmou
- [ ] Timeout de 30s para decisao de rematch
- [ ] Se timeout: sala encerrada automaticamente

---

### RF-011: Botao "Sair" no GameOver Multiplayer

**EARS:** WHEN jogador esta no GameOver multiplayer, THEN MUST haver opcao explicita de sair.

**Criterios de Aceitacao:**
- [ ] Botao "Sair" visivel ao lado de "Jogar Novamente"
- [ ] Clicar "Sair" envia `rematch_declined` e volta ao menu
- [ ] Oponente e notificado e tambem volta ao menu

---

## Casos de Borda

### CB-001: Saida Durante Selecao de Itens
Se um jogador sair durante `phase: 'itemSelection'`, o comportamento deve ser identico a sair durante `phase: 'playing'`.

### CB-002: Saida Simultanea
Se ambos jogadores clicarem "Sair" ao mesmo tempo, cada um processa sua propria saida independentemente.

### CB-003: Evento Chega Apos Saida Local
Se o jogador local ja saiu e recebe `player_left` do outro, o evento e ignorado (estado ja resetado).

### CB-004: Overlay Durante Acao Remota
Se o jogador local tiver um overlay aberto quando recebe evento remoto, o feedback remoto aguarda ou e simplificado (toast ao inves de overlay).

---

## Backlog (Fase Futura)

Os seguintes requisitos foram movidos para implementacao futura:

- **Reconexao Automatica**: Persistencia de sala em localStorage, reconexao ao recarregar pagina
- **Heartbeat Customizado**: Sistema de heartbeat para deteccao de desconexao (atual usa Supabase Presence)

O sistema atual (`DisconnectedOverlay` com countdown de 60s) ja cobre adequadamente o cenario de desconexao abrupta.
