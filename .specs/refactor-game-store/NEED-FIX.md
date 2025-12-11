# BUG's

1. *Item* - **Scanner X2:** não revela as pilulas igualmente para os jogadores. Cada um vê pilulas reveladas diferentes.
2. *UI/State* - **Wants Store Toggle:** jogador pode clicar em ambos toggles ativando indevidamente o Wants Store do adversário.


# Pontos de Atenção para Revisão

1. *Multiplayer* - **GameOver:** Ao final da partida, refatorar fluxo de sair/nova partida entre jogadores.
> Atualmente quando jogador "Guest" clica em jogar novamente ou no "X" ele é enviado para tela inicial (reseta gameState), enquanto o "Host" visualiza a tela de "Iniciando partida... Aguarde enquanto o jogo e preparado". Quando o "Guest" tenta iniciar uma nova partida é exibida a tela de oponente "Conexão perdida. Tentando reconectar..." e não consegue se conectar corretamente enquanto não clicar em "Encerrar" e tentar conectar na sala novamente com o código. Após a reconexão o game entra na fase de escolha de itens inicial o guest recebe os eventos corretamente após confirmar a escolha e o host também, a partida para ele se inicia corretamente mas para o Host não, ele não recebe a confirmação de escolha de itens do oponente e fica preso aguardando a confirmação dele.