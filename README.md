
# Node.js Real-Time Chat

Um projeto de chat em tempo real com WebSockets, inspirado nos layouts de aplicativos de mensagens modernos.

## Descrição

Este é um chat em tempo real que utiliza Node.js e WebSockets. Ele possui um único canal de chat geral. O nome de usuário é salvo no armazenamento local do navegador para persistência entre sessões. As mensagens são armazenadas em memória no servidor e apagadas automaticamente após 60 minutos. O projeto foi desenvolvido com o mínimo de dependências e pode ser executado em um container Docker.

## Funcionalidades

- Chat em tempo real com WebSockets.
- Design responsivo inspirado no WhatsApp/Telegram.
- Tema claro e escuro (light/dark mode).
- Persistência do nome de usuário no navegador.
- Armazenamento de mensagens em memória.
- Limpeza automática de mensagens antigas.

## Tecnologias Utilizadas

- **Backend:** Node.js, Express, ws (WebSocket)
- **Frontend:** HTML, CSS, JavaScript (sem frameworks)
- **Containerization:** Docker

## Como Executar

### Localmente

1.  **Clone o repositório:**
    ```sh
    git clone <url-do-repositorio>
    cd <nome-do-diretorio>
    ```

2.  **Instale as dependências:**
    ```sh
    npm install
    ```

3.  **Inicie o servidor:**
    ```sh
    npm start
    ```

4.  Abra seu navegador e acesse `http://localhost:3000`.

### Com Docker

1.  **Construa a imagem Docker:**
    ```sh
    docker build -t node-chat .
    ```

2.  **Execute o container:**
    ```sh
    docker run -p 3030:3000 node-chat
    ```

3.  Abra seu navegador e acesse `http://localhost:3030`.

