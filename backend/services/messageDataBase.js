require('dotenv').config();
const mongoose = require('mongoose');

async function getMessageFromContact(clientInfo, contactId, limit = 50) {
    await mongoose.connect(process.env.MONGO_URI + "_" + clientInfo.number);
    const db = mongoose.connection.db;
    const collection = db.collection(contactId);
    const messageList = await collection.find({}).sort({ timestamp: -1 }).limit(limit).toArray()
    return {
        success: true,
        contactId: contactId,
        contactName: null,
        unreadCount: 0,
        messages: messageList,
        total: messageList.length
    };
}

module.exports = { getMessageFromContact };