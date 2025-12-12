# Nice to Have

### Sistema de Autenticacao (Spec Futura: `user-auth-system`)

Durante este refactor, estamos preparando a arquitetura para futuro sistema de auth:

#### Separacao de Conceitos

| Conceito | Tipo | Fonte | Persistente | Uso |
|----------|------|-------|-------------|-----|
| **PlayerId** | `string` | Gerado na partida | Nao | Turnos, logica de jogo |
| **UserId** | UUID | Supabase Auth | Sim | Perfil, historico, ranking |

#### Campo `Player.userId`

Foi adicionado na **Fase 3.5** de `Game State Refactor` com valor `string | null`:
- `null` = Guest ou Bot (joga sem cadastro, sem persistencia)
- `string` = Usuario autenticado (stats, ranking, conquistas)

#### Funcionalidades por Tipo de Usuario

| Funcionalidade | Guest (`null`) | Autenticado (UUID) |
|----------------|:--------------:|:------------------:|
| Jogar Single Player | Sim | Sim |
| Jogar Multiplayer | Sim | Sim |
| Salvar progresso | Nao | Sim |
| Ranking/Leaderboard | Nao | Sim |
| Conquistas | Nao | Sim |
| Partidas "ranked" | Nao | Sim |
| Estatisticas globais | Nao | Sim |

#### Beneficios para Producao

- **Login social** (Google, Discord, Twitch) via Supabase Auth
- **Guest-First** - Jogador experimenta sem cadastro, converte depois
- **Compartilhamento** em redes sociais
- **Gamificacao** - Temporadas, badges, rewards
- **Anti-cheat** - Partidas ranked exigem auth
- **Viral loop** - Convites, referrals

> **IMPORTANTE:** Nao implementar auth agora. Apenas garantir que `PlayerId` (sessao) e `UserId` (identidade) sejam conceitos separados.

---

> **NOTA:** O jogo permanece funcional (2 jogadores) durante todo o processo. A UI para N jogadores sera tratada em spec separada.

---