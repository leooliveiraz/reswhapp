const { extractMessageData, getContactList } = require('./services/whatsappService');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

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

server.listen(PORT, () => {
    console.log(`🚀 WebSocket server running in http://localhost:${PORT}`);
});


//whatsapp config
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: '.reswhapp-data/'
    })
});

client.on('ready', () => {
    console.log('Whatsapp Client is ready!');
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('message_create', async m => {
    const msgData = await extractMessageData(m);
    console.log("New message", msgData);
});


client.initialize();


io.on('connection', (socket) => {
    console.log(`🟢 Client connected: ${socket.id}`);
    console.log(`📊 Total connections: ${io.engine.clientsCount}`);

    socket.on('disconnect', () => {
        console.log(`🔴 Client disconnected: ${socket.id}`);
        console.log(`📊 Total connections: ${io.engine.clientsCount}`);
    });
    socket.on("get-contacts", () => {
        console.log('Get contacts:');
        getContactList(client).then(contactList => {
            io.emit("contact-list", contactList)
        })
    })
});
