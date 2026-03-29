/**
 * Rotas WebSocket (Socket.io)
 */

function socketRoutes(io, whatsappClient, getMessageFromContact, saveLastChatMessageMass) {
    io.on('connection', (socket) => {
        console.log(`🟢 Client connected: ${socket.id}`);
        console.log(`📊 Total connections: ${io.engine.clientsCount}`);

        socket.on('disconnect', () => {
            console.log(`🔴 Client disconnected: ${socket.id}`);
            console.log(`📊 Total connections: ${io.engine.clientsCount}`);
        });

        // Obter lista de contatos
        socket.on('get-contact-list', () => {
            console.log('Get contacts:');
            whatsappClient.getContactList().then(contactList => {
                socket.emit('contact-list', contactList);
            }).catch(error => console.log(error.message));
        });

        // Obter últimas mensagens (deprecated)
        socket.on('get-last-messages', async (data) => {
            console.log('📨 Get last messages request:', data);
            const { contactId, limit = Infinity } = data;

            if (!contactId) {
                socket.emit('last-messages', {
                    success: false,
                    error: 'contactId is required'
                });
                return;
            }

            try {
                whatsappClient.getLastMessages(contactId, limit).then(result => {
                    result.messages.forEach(msg => {
                        whatsappClient._addToMessageQueue(msg);
                    });
                    console.log('messages has been updated!');
                    socket.emit('last-messages', result);
                }).catch(error => {
                    console.error('❌ Error in getLastMessages:', error);
                    socket.emit('last-messages', {
                        success: false,
                        error: error.message
                    });
                });
            } catch (error) {
                console.error('❌ Error getting last messages:', error);
                socket.emit('last-messages', {
                    success: false,
                    error: error.message
                });
            }
        });

        // Obter histórico de mensagens
        socket.on('get-message-historic', async (data) => {
            console.log('📨 Get message historic request:', data);
            const { contactId, limit = 50 } = data;

            if (!contactId) {
                socket.emit('last-messages', {
                    success: false,
                    error: 'contactId is required'
                });
                return;
            }

            try {
                if (typeof getMessageFromContact === 'function') {
                    const result = await getMessageFromContact(whatsappClient.getClientInfo(), contactId, limit);
                    socket.emit('last-messages', result);
                } else {
                    console.error('❌ getMessageFromContact is not a function');
                    socket.emit('last-messages', {
                        success: false,
                        error: 'getMessageFromContact function not available'
                    });
                }
            } catch (error) {
                console.error('❌ Error getting message historic:', error);
                socket.emit('last-messages', {
                    success: false,
                    error: error.message
                });
            }
        });

        // Obter lista de chats
        socket.on('get-chat-list', () => {
            console.log('get-chat-list');
            whatsappClient.getChatList().then(chatList => {
                saveLastChatMessageMass(chatList, whatsappClient.getClientInfo().number).then(() => { });
                socket.emit('chat-list', chatList);
            }).catch(error => console.error('error', error.message));
        });
    });
}

module.exports = socketRoutes;
