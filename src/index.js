
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const MESSAGE_EXPIRATION_MINUTES = 60;

let messages = [];

app.use(express.static(path.join(__dirname, '..', 'public')));

const connectedUsers = new Set();

function broadcastUserList() {
    const userList = Array.from(connectedUsers);
    const message = JSON.stringify({ type: 'userListUpdate', payload: userList });
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(message);
        }
    });
}

wss.on('connection', (ws) => {
    // Envia o histórico de mensagens para o novo cliente
    ws.send(JSON.stringify({ type: 'history', payload: messages }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'userConnected':
                    ws.username = data.payload.username;
                    connectedUsers.add(ws.username);
                    broadcastUserList();
                    break;

                case 'newMessage':
                    // Validação simples
                    if (typeof data.payload.username !== 'string' || typeof data.payload.text !== 'string') {
                        return;
                    }
                    const newMessage = {
                        id: Date.now() + Math.random().toString(36).substr(2, 9), // ID único mais robusto
                        username: data.payload.username,
                        text: data.payload.text,
                        timestamp: new Date(),
                        seenBy: []
                    };
                    messages.push(newMessage);

                    // Envia a nova mensagem para todos
                    wss.clients.forEach((client) => {
                        if (client.readyState === client.OPEN) {
                            client.send(JSON.stringify({ type: 'newMessage', payload: newMessage }));
                        }
                    });
                    break;

                case 'messageSeen':
                    const { messageId, username } = data.payload;
                    const messageToUpdate = messages.find(m => m.id === messageId);

                    if (messageToUpdate && !messageToUpdate.seenBy.some(u => u.username === username)) {
                        messageToUpdate.seenBy.push({
                            username: username,
                            timestamp: new Date()
                        });

                        // Notifica todos que a mensagem foi atualizada
                        wss.clients.forEach((client) => {
                            if (client.readyState === client.OPEN) {
                                client.send(JSON.stringify({ type: 'messageUpdated', payload: messageToUpdate }));
                            }
                        });
                    }
                    break;
            }
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
        }
    });

    ws.on('close', () => {
        if (ws.username) {
            connectedUsers.delete(ws.username);
            broadcastUserList();
        }
        console.log('Cliente desconectado');
    });
});

// Limpeza periódica de mensagens
setInterval(() => {
    const expirationTime = new Date(Date.now() - MESSAGE_EXPIRATION_MINUTES * 60 * 1000);
    messages = messages.filter(msg => new Date(msg.timestamp) > expirationTime);
    
    // Notifica os clientes que as mensagens foram limpas (opcional)
    // Poderia ser um tipo de mensagem especial para o cliente tratar
    console.log('Mensagens antigas foram limpas.');
}, MESSAGE_EXPIRATION_MINUTES * 60 * 1000);


server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
