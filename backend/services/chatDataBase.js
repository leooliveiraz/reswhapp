require("dotenv").config();
const { WhatsAppClient } = require('./whatsappClient');
const mongoose = require("mongoose");
let isUniqueMessagesIndexCreate = false;
const LAST_CHAT_MESSAGE = "last-chat-message"

async function saveLastChatMessageMass(chatList, clientNumber) {
    chatParsedList = []
    for (const chat of chatList) {
        let newMessage = null;
        if (chat.lastMessage) {
            // Cria instância temporária ou usa cliente existente para extrair dados
            // Nota: extractMessageData precisa de uma instância do cliente WhatsApp
            // Para esta função, vamos extrair os dados diretamente sem usar o método completo
            try {
                newMessage = await extractMessageDataFromChat(chat.lastMessage, false);
            } catch (e) {
                console.error("Erro ao extrair dados da mensagem:", e);
            }
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

/**
 * Extrai dados básicos de uma mensagem do chat (versão simplificada)
 * Não requer instância do cliente WhatsApp
 */
async function extractMessageDataFromChat(message, realizeDownload = false) {
    if (!message) return null;
    
    // Nota: esta é uma versão simplificada que não baixa mídia
    // e não acessa métodos completos do cliente WhatsApp
    const msgData = {
        id: message.id?._serialized,
        timestamp: message.timestamp,
        dateTime: message.timestamp ? new Date(message.timestamp * 1000).toLocaleString() : null,
        type: message.type,
        body: message.body,
        from: message.from,
        to: message.to,
        isForwarded: message.isForwarded,
        hasMedia: message.hasMedia,
        // Dados do chat
        chatId: message.chatId?._serialized || message.from,
    };
    
    // Tenta extrair nome do contato se disponível
    try {
        if (message.contact) {
            msgData.contactName = message.contact.pushname || message.contact.name || message.contact.number || 'Unknown';
        }
    } catch (e) {
        msgData.contactName = 'Unknown';
    }
    
    return msgData;
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
