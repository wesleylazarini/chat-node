
document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcher = document.getElementById('theme-switcher');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const usernameModal = document.getElementById('username-modal');
    const usernameForm = document.getElementById('username-form');
    const usernameInput = document.getElementById('username-input');
    const userListBtn = document.getElementById('user-list-btn');
    const userListModal = document.getElementById('user-list-modal');
    const userList = document.getElementById('user-list');
    const closeUserListBtn = document.getElementById('close-user-list');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const confirmClearModal = document.getElementById('confirm-clear-modal');
    const confirmClearYes = document.getElementById('confirm-clear-yes');
    const confirmClearNo = document.getElementById('confirm-clear-no');

    let username = localStorage.getItem('username');
    let ws;

    // Theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(currentTheme);
    themeSwitcher.innerText = currentTheme === 'light' ? '🌙' : '☀️';

    themeSwitcher.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark');
        document.body.classList.toggle('light', !isDark);
        const newTheme = isDark ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        themeSwitcher.innerText = newTheme === 'light' ? '🌙' : '☀️';
    });

    // Username
    if (username) {
        usernameModal.style.display = 'none';
        connectToChat();
    } else {
        usernameModal.style.display = 'flex';
    }

    usernameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newUsername = usernameInput.value.trim();
        if (newUsername) {
            username = newUsername;
            localStorage.setItem('username', username);
            usernameModal.style.display = 'none';
            connectToChat();
        }
    });

    // User List Modal
    userListBtn.addEventListener('click', () => {
        userListModal.style.display = 'flex';
    });

    closeUserListBtn.addEventListener('click', () => {
        userListModal.style.display = 'none';
    });

    // Clear Chat Modal
    clearChatBtn.addEventListener('click', () => {
        confirmClearModal.style.display = 'flex';
    });

    confirmClearNo.addEventListener('click', () => {
        confirmClearModal.style.display = 'none';
    });

    confirmClearYes.addEventListener('click', () => {
        chatMessages.innerHTML = '';
        confirmClearModal.style.display = 'none';
    });

    // Copy message listener
    chatMessages.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-btn');
        if (copyBtn) {
            const messageText = copyBtn.closest('.message').querySelector('.text').innerText;
            
            // Fallback function for copying to clipboard
            const fallbackCopyTextToClipboard = (text) => {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                
                // Avoid scrolling to bottom
                textArea.style.top = "0";
                textArea.style.left = "0";
                textArea.style.position = "fixed";

                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                try {
                    const successful = document.execCommand('copy');
                    if (successful) {
                        copyBtn.innerText = 'Copiado!';
                        setTimeout(() => {
                            copyBtn.innerText = '📋';
                        }, 1500);
                    } else {
                        console.error('Fallback: Falha ao copiar texto');
                    }
                } catch (err) {
                    console.error('Fallback: Erro ao copiar texto', err);
                }

                document.body.removeChild(textArea);
            };

            // Use modern clipboard API if available, otherwise use fallback
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(messageText).then(() => {
                    copyBtn.innerText = 'Copiado!';
                    setTimeout(() => {
                        copyBtn.innerText = '📋';
                    }, 1500);
                }).catch(err => {
                    console.error('Erro ao copiar texto com a API moderna, usando fallback: ', err);
                    fallbackCopyTextToClipboard(messageText);
                });
            } else {
                fallbackCopyTextToClipboard(messageText);
            }
        }
    });

    // WebSocket
    function connectToChat() {
        ws = new WebSocket(`ws://${window.location.host}`);

        ws.onopen = () => {
            console.log('Conectado ao servidor de chat.');
            // Envia o nome de usuário para o servidor
            ws.send(JSON.stringify({ type: 'userConnected', payload: { username } }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'history':
                    chatMessages.innerHTML = '';
                    data.payload.forEach(addMessageToUI);
                    break;
                case 'newMessage':
                    addMessageToUI(data.payload);
                    break;
                case 'messageUpdated':
                    updateMessageInUI(data.payload);
                    break;
                case 'userListUpdate':
                    updateUserListUI(data.payload);
                    break;
            }
        };

        ws.onclose = () => {
            console.log('Desconectado do servidor de chat. Tentando reconectar...');
            setTimeout(connectToChat, 3000);
        };

        ws.onerror = (error) => {
            console.error('Erro no WebSocket:', error);
        };
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message && ws && ws.readyState === WebSocket.OPEN) {
            const data = {
                type: 'newMessage',
                payload: {
                    username: username,
                    text: message,
                }
            };
            ws.send(JSON.stringify(data));
            messageInput.value = '';
        }
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const messageElement = entry.target;
                const messageId = messageElement.dataset.id;
                
                // Evita marcar as próprias mensagens como vistas por si mesmo logo ao enviar
                if (messageElement.classList.contains('in')) {
                    ws.send(JSON.stringify({
                        type: 'messageSeen',
                        payload: { messageId, username }
                    }));
                }
                observer.unobserve(messageElement); // Observa apenas uma vez
            }
        });
    }, { threshold: 1.0 });

    function addMessageToUI(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(message.username === username ? 'out' : 'in');
        messageElement.dataset.id = message.id;

        const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageElement.innerHTML = `
            <div class="meta">
                <span class="username">${message.username}  >> </span><span class="time">${time}</span>
                <button class="copy-btn" title="Copiar mensagem">📋</button>
            </div>
            <div class="text">
                ${message.text}
            </div>
            <div class="seen-status" title="Enviado">
                ✓
            </div>
        `;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        updateSeenStatus(messageElement, message.seenBy);

        // Adiciona ao observer se for uma mensagem de entrada que ainda não foi vista pelo usuário atual
        if (message.username !== username && !message.seenBy.some(u => u.username === username)) {
            observer.observe(messageElement);
        }
    }

    function updateMessageInUI(message) {
        const messageElement = document.querySelector(`.message[data-id='${message.id}']`);
        if (messageElement) {
            updateSeenStatus(messageElement, message.seenBy);
        }
    }

    function updateSeenStatus(element, seenBy) {
        const seenStatus = element.querySelector('.seen-status');
        if (!seenStatus) return;

        const currentUserIsSender = element.classList.contains('out');

        if (currentUserIsSender) {
            if (seenBy && seenBy.length > 0) {
                seenStatus.innerHTML = '✓✓';
                seenStatus.classList.add('seen');
                const seenByText = seenBy.map(u => 
                    `${u.username} às ${new Date(u.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                ).join('\n');
                seenStatus.title = `Visto por:\n${seenByText}`;
            } else {
                seenStatus.innerHTML = '✓';
                seenStatus.classList.remove('seen');
                seenStatus.title = 'Enviado';
            }
        } else {
            // Para mensagens recebidas, o status de "visto" não é relevante da mesma forma
            seenStatus.style.display = 'none';
        }
    }

    function updateUserListUI(users) {
        userList.innerHTML = ''; // Limpa a lista atual
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user;
            userList.appendChild(li);
        });
    }
});
