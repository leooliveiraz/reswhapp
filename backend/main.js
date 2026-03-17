const { extractMessageData, getContactList, getChatList, getLastMessages } = require('./services/whatsappService');
const { getMessageFromContact } = require('./services/messageDataBase.js');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// server config
const PORT = 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // URL do seu React (Vite)
        methods: ["GET", "POST"]
    }
});
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, 'downloads')));

const MessageProcessor = require('./services/messageProcessor.js');
const processor = new MessageProcessor('./messages/');

//whatsapp config
const CHROMIUM_TIMEOUT= 60 *1000;
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: process.env.CHROMIUM_DATA
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        protocolTimeout: CHROMIUM_TIMEOUT  // Aumenta o timeout para 120 segundos (o padrão é 30s)
    }
});


let clientInfo = {};
let messageList = {};
let isProcessingMessages = false;

async function processMessage(msg) {
    try {
        await mongoose.connect(process.env.MONGO_URI + "_" + clientInfo.number);
        const db = mongoose.connection.db;
        const collection = db.collection(msg.chatId);
        await collection.insertOne(msg)
    } catch (e) {
        console.error('❌ Error:', e);
        throw e;
    } finally {
        await mongoose.disconnect();
    }

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


async function processMessageList() {
    if (isProcessingMessages) {
        return;
    }
    try {
        isProcessingMessages = true;
        const keys = Object.keys(messageList);
        for (const key of keys) {
            console.log("processing ", key)
            try {
                await processMessage(messageList[key]);
                delete messageList[key];
            } catch (error) {
                console.error("Error on message processment:", error)
            }
        }

    } catch (error2) {
        console.error("Error on message processment:", error2)
    } finally {
        isProcessingMessages = false;
    }

}

function addOnMessageProcessList(message) {
    messageList[message.id] = message;
}

client.on('ready', () => {
    clientInfo = {
        name: client.info.pushname,
        number: client.info.wid.user,
        id: client.info.wid._serialized
    }
    console.log(`Whatsapp Client is ready!\n${new Date()}\n${JSON.stringify(clientInfo)} `);
    server.listen(PORT, () => {
        console.log(`🚀 WebSocket server running in http://localhost:${PORT}`);
    });
    setInterval(() => {
        processMessageList().then(() => { });
    }, [10000])
});

client.on('qr', qr => {
    try {
        qrcode.generate(qr, { small: true });
    } catch (error) {
        console.error("Error on generate qrcode");
    }
});

client.on('message_create', async m => {
    try {
        const msgData = await extractMessageData(m, true)
        if (!msgData) return;
        addOnMessageProcessList(msgData);
        processMessageList().then(() => { });
    } catch (error) {
        console.error("Message creation process error:", error);
    }
});


client.initialize();


io.on('connection', (socket) => {
    console.log(`🟢 Client connected: ${socket.id}`);
    console.log(`📊 Total connections: ${io.engine.clientsCount}`);

    socket.on('disconnect', () => {
        console.log(`🔴 Client disconnected: ${socket.id}`);
        console.log(`📊 Total connections: ${io.engine.clientsCount}`);
    });

    socket.on("get-contact-list", () => {
        console.log('Get contacts:');
        getContactList(client).then(contactList => {
            socket.emit("contact-list", contactList)
            socket.emit("cachorro", { a: 1 })
        }).catch(error => console.log(error.message))
    })

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
            if (typeof getLastMessages === 'function') {
                getLastMessages(client, contactId, limit).then(result => {
                    result.messages.forEach(msg => addOnMessageProcessList(msg))
                    console.log("messages has been updated!")
                });
            } else {
                console.error('❌ getLastMessages is not a function');
                socket.emit('last-messages', {
                    success: false,
                    error: 'getLastMessages function not available'
                });
            }
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
                const result = await getMessageFromContact(clientInfo, contactId, limit);
                socket.emit('last-messages', result);
            } else {
                console.error('❌ getLastMessages is not a function');
                socket.emit('last-messages', {
                    success: false,
                    error: 'getLastMessages function not available'
                });
            }
        } catch (error) {
            console.error('❌ Error getting last messages:', error);
            socket.emit('last-messages', {
                success: false,
                error: error.message
            });
        }
    });

    socket.on("get-chat-list", () => {
        console.log('get-chat-list');
        getChatList(client).then(chat => {
            socket.emit("chat-list", chat)
        })
            .catch(error => console.log(error.message))
    })
});
