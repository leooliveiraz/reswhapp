require("dotenv").config();
const { extractMessageData } = require('./whatsappService');
const mongoose = require("mongoose");
let isUniqueMessagesIndexCreate = false;

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
    const collection = db.collection("last-chat-message");
    if (!isUniqueMessagesIndexCreate) {
        await collection.createIndex({ chatId: 1 }, { unique: true, name: "chat_id_unique" });
        isUniqueMessagesIndexCreate = true;
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


module.exports = { saveLastChatMessageMass };
