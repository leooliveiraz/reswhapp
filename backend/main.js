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

// ============================================
// GLOBAL ERROR HANDLERS - Previne crash da aplicação
// ============================================

// Previne crash por erros não capturados em Promises
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ [UNHANDLED REJECTION] at:', promise, 'reason:', reason);
    // NÃO encerra o processo - mantém a aplicação rodando
});

// Previne crash por exceções não capturadas
process.on('uncaughtException', (error) => {
    console.error('❌ [UNCAUGHT EXCEPTION]:', error);
    // NÃO encerra o processo - mantém a aplicação rodando
});

// Previne crash por erros de ECONNRESET, EPIPE, etc.
process.on('error', (error) => {
    console.error('❌ [PROCESS ERROR]:', error);
    // NÃO encerra o processo - mantém a aplicação rodando
});

// Graceful shutdown (opcional - apenas se realmente precisar encerrar)
let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
    if (isShuttingDown) {
        console.warn(`⚠️ Already shutting down, ignoring duplicate ${signal} signal`);
        return;
    }

    isShuttingDown = true;
    console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);

    try {
        // Fecha servidor HTTP
        if (server) {
            await new Promise((resolve) => {
                server.close(resolve);
                setTimeout(resolve, 5000); // Force close after 5s
            });
            console.log('✅ HTTP server closed');
        }

        // Fecha cliente WhatsApp
        if (whatsappClient && whatsappClient.getClient()) {
            await whatsappClient.getClient().destroy();
            console.log('✅ WhatsApp client destroyed');
        }

        // Fecha conexões do MongoDB (se existir)
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('✅ MongoDB connection closed');
        }

        console.log('✅ Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// server config
const PORT = process.env.PORT || 3000;
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
        }).catch(error => {
            console.error('Error getting chat list on startup:', error);
        });

        // Processa fila de mensagens a cada 10 segundos
        setInterval(() => {
            whatsappClient.processMessageQueue().catch(error => {
                console.error('Error processing message queue:', error);
            });
        }, 10 * 1000);

        // Atualiza lista de chats a cada 5 minutos
        setInterval(() => {
            whatsappClient.getChatList().then(chatList => {
                saveLastChatMessageMass(chatList, clientInfo.number).then(() => { });
            }).catch(error => {
                console.error('Error updating chat list:', error);
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
        try {
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
        } catch (error) {
            console.error('Error processing new message:', error);
        }
    }
});

// Inicializa o cliente WhatsApp
whatsappClient.initialize();

// Socket.io routes
socketRoutes(io, whatsappClient, getMessageFromContact, saveLastChatMessageMass);