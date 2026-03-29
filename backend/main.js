const { WhatsAppClient } = require('./services/whatsappClient');
const { getMessageFromContact, saveMessage, saveLastChatMessage } = require('./services/messageDataBase.js');
const { saveLastChatMessageMass, getChatListDB } = require('./services/chatDataBase.js');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

// server config
const PORT = 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    path: '/socket.io',
    transports: ['websocket', 'polling']
});
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, 'downloads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'WhatsApp API',
        clientReady: whatsappClient.isClientReady()
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        clientInfo: whatsappClient.getClientInfo(),
        connections: io.engine.clientsCount
    });
});

const MessageProcessor = require('./services/messageProcessor.js');
const processor = new MessageProcessor('./messages/');

// Inicializa cliente WhatsApp encapsulado
const whatsappClient = new WhatsAppClient({
    chromeTimeout: 60 * 1000,
    chromiumDataPath: process.env.CHROMIUM_DATA,
    
    // Callback quando o cliente está pronto
    onReady: (clientInfo) => {
        console.log(`Whatsapp Client is ready!\n${new Date()}\n${JSON.stringify(clientInfo)} `);

        server.listen(PORT, () => {
            console.log(`🚀 WebSocket server running in http://localhost:${PORT}`);
        });

        whatsappClient.getChatList().then(chatList => {
            saveLastChatMessageMass(chatList, clientInfo.number).then(() => { });
        });

        // Processa fila de mensagens a cada 10 segundos
        setInterval(() => {
            whatsappClient.processMessageQueue().then(() => { });
        }, 10 * 1000);

        // Atualiza lista de chats a cada 5 minutos
        setInterval(() => {
            whatsappClient.getChatList().then(chatList => {
                saveLastChatMessageMass(chatList, clientInfo.number).then(() => { });
            });
        }, 5 * 60 * 1000);
    },
    
    // Callback para QR Code (usa terminal por padrão)
    onQRCode: (qr) => {
        try {
            const qrcode = require('qrcode-terminal');
            qrcode.generate(qr, { small: true });
        } catch (error) {
            console.error("Error on generate qrcode");
        }
    },
    
    // Callback para novas mensagens
    onMessage: async (msg) => {
        await saveMessage(msg, whatsappClient.getClientInfo().number);
        await saveLastChatMessage(msg, whatsappClient.getClientInfo().number);

        console.log("New message", msg.from, msg.body);
        const sockets = await io.fetchSockets();
        console.log(`4️⃣ Sockets encontrados: ${sockets.length}`);

        sockets.forEach((socket, i) => {
            console.log(`   Socket ${i}: ${socket.id}`);
            socket.emit("new-message", msg);
            console.log(`   ✅ Emitido para socket ${socket.id}`);
        });

        console.log("5️⃣ Finalizado emissão");
    }
});

// Inicializa o cliente WhatsApp
whatsappClient.initialize();

io.on('connection', (socket) => {
    console.log(`🟢 Client connected: ${socket.id}`);
    console.log(`📊 Total connections: ${io.engine.clientsCount}`);

    socket.on('disconnect', () => {
        console.log(`🔴 Client disconnected: ${socket.id}`);
        console.log(`📊 Total connections: ${io.engine.clientsCount}`);
    });

    socket.on("get-contact-list", () => {
        console.log('Get contacts:');
        whatsappClient.getContactList().then(contactList => {
            socket.emit("contact-list", contactList);
        }).catch(error => console.log(error.message));
    });

    //deprecated
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
                    // Adiciona à fila de processamento do cliente WhatsApp
                    whatsappClient._addToMessageQueue(msg);
                });
                console.log("messages has been updated!");
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

    socket.on("get-chat-list", () => {
        console.log('get-chat-list');
        whatsappClient.getChatList().then(chatList => {
            saveLastChatMessageMass(chatList, whatsappClient.getClientInfo().number).then(() => { });
            socket.emit("chat-list", chatList);
        }).catch(error => console.error("error", error.message));
    });
});