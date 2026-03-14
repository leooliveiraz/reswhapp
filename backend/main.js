const { extractMessageData, getContactList, getChatList, getLastMessages } = require('./services/whatsappService');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
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
const MessageProcessor = require('./services/messageProcessor.js');
const processor = new MessageProcessor('./messages/');

//whatsapp config
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: '.reswhapp-data/'
    })
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
    io.fetchSockets().then(socketList => {
        socketList.forEach(_socket => {
            _socket.emit("new-message", msg)
        })
    })
}


async function processMessageList() {
    if(isProcessingMessages){
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
            } catch (e) {
                console.error("Error on message processment:", e)
            }
        }
        
    } catch (f) {
        console.error("Error on message processment:", e)
    } finally {
        isProcessingMessages = false;
    }

}

client.on('ready', () => {
    clientInfo = {
        name: client.info.pushname,
        number: client.info.wid.user,
        id: client.info.wid._serialized
    }
    console.log(`Whatsapp Client is ready!\n${JSON.stringify(clientInfo)}`);
    server.listen(PORT, () => {
        console.log(`🚀 WebSocket server running in http://localhost:${PORT}`);
    });
    setInterval(() => {
        processMessageList();
    }, [10000])
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('message_create', async m => {
    const msgData = await extractMessageData(m)
    if (!msgData) return;
    messageList[msgData.id] = msgData;
    processMessageList();
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
            io.emit("contact-list", contactList)
        }).catch(error => console.log(error.message))
    })

    socket.on('get-last-messages', async (data) => {
        console.log('📨 Get last messages request:', data);
        const { contactId, limit = 50 } = data;
        console.log("contactId", contactId)

        if (!contactId) {
            socket.emit('last-messages', {
                success: false,
                error: 'contactId is required'
            });
            return;
        }

        try {
            if (typeof getLastMessages === 'function') {
                const result = await getLastMessages(client, contactId, limit);
                socket.emit('last-messages', result);
                console.log("send last messages")
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
            io.emit("chat-list", chat)
        })
            .catch(error => console.log(error.message))
    })
});
