require("dotenv").config();
const mongoose = require("mongoose");
const collectionUniqueIndexCreate = {};
let isUniqueMessagesIndexCreate = false;

async function getMessageFromContact(clientInfo, contactId, limit = 50) {
    await mongoose.connect(process.env.MONGO_URI + "_" + clientInfo.number);
    const db = mongoose.connection.db;
    const collection = db.collection(contactId);
    const messageList = await collection
        .find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    messageList.reverse();
    return {
        success: true,
        contactId: contactId,
        contactName: null,
        unreadCount: 0,
        messages: messageList,
        total: messageList.length,
    };
}

async function saveMessage(msg, clientNumber) {
    try {
        await mongoose.connect(process.env.MONGO_URI + "_" + clientNumber);
        const db = mongoose.connection.db;
        const collection = db.collection(msg.chatId);
        if (!collectionUniqueIndexCreate[msg.chatId]) {
            await collection.createIndex({ id: 1 }, { unique: true, name: "message_id_unique" });
            collectionUniqueIndexCreate[msg.chatId] = true;
        }

        await collection.insertOne(msg);
    } catch (e) {
        throw e;
    } finally {
        await mongoose.disconnect();
    }
}

async function saveLastChatMessage(msg, clientNumber) {
    try {
        const lastMsg = { chatId: msg.chatId, message: msg, timestamp: msg.timestamp,name: msg.contactName }
        await mongoose.connect(process.env.MONGO_URI + "_" + clientNumber);
        const db = mongoose.connection.db;
        const collection = db.collection("last-chat-message");
        if (!isUniqueMessagesIndexCreate) {

            await collection.createIndex({ chatId: 1 }, { unique: true, name: "chat_id_unique" });
            isUniqueMessagesIndexCreate = true;
        }
        await collection.updateOne({ chatId: msg.chatId }, { $set: lastMsg }, { upsert: true });
    } catch (e) {
        throw e;
    } finally {
        await mongoose.disconnect();
    }
}

module.exports = { getMessageFromContact, saveMessage, saveLastChatMessage };
