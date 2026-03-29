const { WhatsAppClient } = require('./services/whatsappClient');
const { getMessageFromContact, saveMessage, saveLastChatMessage } = require('./services/messageDataBase.js');
const { saveLastChatMessageMass, getChatListDB } = require('./services/chatDataBase.js');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const healthRoutes = require('./routes/healthRoutes');
const socketRoutes = require('./routes/socketRoutes');

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

const MessageProcessor = require('./services/messageProcessor.js');
const processor = new MessageProcessor('./messages/');

// Inicializa cliente WhatsApp encapsulado
const whatsappClient = new WhatsAppClient({
    chromeTimeout: 60 * 1000,
    chromiumDataPath: process.env.CHROMIUM_DATA,

    // Callback quando o cliente está pronto
    onReady: (clientInfo) => {
        console.log(`Whatsapp Client is ready!\n${new Date()}\n${JSON.stringify(clientInfo)} `);

        // Health check routes
        healthRoutes(app, whatsappClient, io);

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

// Socket.io routes
socketRoutes(io, whatsappClient, getMessageFromContact, saveLastChatMessageMass);