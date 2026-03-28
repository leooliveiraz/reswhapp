require("dotenv").config();
const { extractMessageData } = require('./whatsappService');
const mongoose = require("mongoose");
let isUniqueMessagesIndexCreate = false;
const LAST_CHAT_MESSAGE = "last-chat-message"

async function saveLastChatMessageMass(chatList, clientNumber) {
    chatParsedList = []
    for (const chat of chatList) {
        let newMessage = null;
        if (chat.lastMessage) {
            newMessage = await extractMessageData(chat.lastMessage, false)
        }
        chatParsedList.push({ timestamp: chat.timestamp, chatId: chat.id._serialized, message: newMessage, name: newMessage ? newMessage.contactName : chat.name });
    }

    await mongoose.connect(process.env.MONGO_URI + "_" + clientNumber);
    const db = mongoose.connection.db;
    const collection = db.collection(LAST_CHAT_MESSAGE);
    if (!isUniqueMessagesIndexCreate) {
        try {
            await collection.createIndex({ chatId: 1 }, { unique: true, name: "chat_id_unique" });
            isUniqueMessagesIndexCreate = true;
        } catch (e) {
            console.log(e.message, "chatDataBase.js", e.lineNumber)
        }
    }
    try {
        for (const chat of chatParsedList) {
            await collection.updateOne({ chatId: chat.chatId }, { $set: chat }, { upsert: true });
        }
    } catch (e) {
        console.log("Erro ao atualizar lastchat", e)
    } finally {
        await mongoose.disconnect();
    }
}


async function getChatListDB(clientInfo, limit = 500) {
    try {
        await mongoose.connect(process.env.MONGO_URI + "_" + clientInfo.number);
        const db = mongoose.connection.db;
        const collection = db.collection(LAST_CHAT_MESSAGE);
        const messageList = await collection
            .find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
        return {
            success: true,
            contactId: contactId,
            contactName: null,
            unreadCount: 0,
            messages: messageList,
            total: messageList.length,
        };
        
    } catch (error) {
        console.error(error);
        return  {
            success: false,
            contactId: null,
            contactName: null,
            unreadCount: 0,
            messages: [],
            total: 0
        };
    }
}


module.exports = { saveLastChatMessageMass, getChatListDB };
