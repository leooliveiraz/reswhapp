require("dotenv").config();
const mongoConnection = require('./mongoConnection');
let isUniqueMessagesIndexCreate = false;
const LAST_CHAT_MESSAGE = "last-chat-message"

async function saveLastChatMessageMass(chatList, clientNumber) {
    try {
        const conn = await mongoConnection.getConnection(clientNumber);
        const db = conn.db;
        const collection = db.collection(LAST_CHAT_MESSAGE);

        chatParsedList = []
        for (const chat of chatList) {
            let newMessage = null;
            if (chat.lastMessage) {
                try {
                    newMessage = await extractMessageDataFromChat(chat.lastMessage, false);
                } catch (e) {
                    console.error("Erro ao extrair dados da mensagem:", e);
                }
            }
            chatParsedList.push({ timestamp: chat.timestamp, chatId: chat.id._serialized, message: newMessage, name: newMessage ? newMessage.contactName : chat.name });
        }

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
                // Remove _id se existir
                const chatToUpdate = { ...chat };
                if (chatToUpdate._id) {
                    delete chatToUpdate._id;
                }
                if (chatToUpdate.message?._id) {
                    delete chatToUpdate.message._id;
                }
                await collection.updateOne({ chatId: chat.chatId }, { $set: chatToUpdate });
            }
        } catch (e) {
            console.log("Erro ao atualizar lastchat", e)
        }
    } catch (error) {
        console.error('❌ Error in saveLastChatMessageMass:', error);
        // Não relança o erro para evitar crash
    }
}

/**
 * Extrai dados básicos de uma mensagem do chat (versão simplificada)
 * Não requer instância do cliente WhatsApp
 */
async function extractMessageDataFromChat(message, realizeDownload = false) {
    try {
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
    } catch (error) {
        console.error('❌ Error extracting message data from chat:', error);
        return null;
    }
}


async function getChatListDB(clientInfo, limit = 500) {
    try {
        const conn = await mongoConnection.getConnection(clientInfo.number);
        const db = conn.db;
        const collection = db.collection(LAST_CHAT_MESSAGE);
        const messageList = await collection
            .find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
        return {
            success: true,
            contactId: clientInfo.contactId || clientInfo.number,
            contactName: null,
            unreadCount: 0,
            messages: messageList,
            total: messageList.length,
        };

    } catch (error) {
        console.error('❌ Error getting chat list from DB:', error);
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
