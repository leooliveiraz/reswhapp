require("dotenv").config();
const mongoose = require("mongoose");
const mongoConnection = require("./mongoConnection");
const collectionUniqueIndexCreate = {};
let isUniqueMessagesIndexCreate = false;

async function getMessageFromContact(clientInfo, contactId, limit = 50) {
    try {
        const conn = await mongoConnection.getConnection(clientInfo.number);
        const db = conn.db;
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
    } catch (error) {
        console.error(`❌ Error getting messages from contact ${contactId}:`, error);
        return {
            success: false,
            error: error.message,
            contactId: contactId,
            contactName: null,
            unreadCount: 0,
            messages: [],
            total: 0,
        };
    }
}

async function saveMessage(msg, clientNumber) {
    try {
        const conn = await mongoConnection.getConnection(clientNumber);
        const db = conn.db;
        const collection = db.collection(msg.chatId);

        if (!collectionUniqueIndexCreate[msg.chatId]) {
            try {
                await collection.createIndex({ id: 1 }, { unique: true, name: "message_id_unique" });
                collectionUniqueIndexCreate[msg.chatId] = true;
            } catch (e) {
                // Índice pode já existir, ignora
            }
        }

        // Remove _id se existir (MongoDB não permite atualizar campo _id)
        const msgToSave = { ...msg };
        if (msgToSave._id) {
            delete msgToSave._id;
        }

        try {
            await collection.insertOne(msgToSave);
        } catch (e) {
            if (e.code !== 11000) { // Ignora erro de duplicate key
                throw e;
            }
            // Mensagem já existe, atualiza (sem modificar _id)
            await collection.updateOne({ id: msg.id }, { $set: msgToSave });
        }
    } catch (error) {
        console.error(`❌ Error saving message ${msg?.id}:`, error);
        // Não relança o erro para evitar crash
    }
}

async function saveLastChatMessage(msg, clientNumber) {
    try {
        const conn = await mongoConnection.getConnection(clientNumber);
        const db = conn.db;
        const collection = db.collection("last-chat-message");

        if (!isUniqueMessagesIndexCreate) {
            try {
                await collection.createIndex({ chatId: 1 }, { unique: true, name: "chat_id_unique" });
                isUniqueMessagesIndexCreate = true;
            } catch (e) {
                // Índice pode já existir, ignora
            }
        }

        // Remove _id se existir (MongoDB não permite atualizar campo _id)
        const msgClean = { ...msg };
        if (msgClean._id) {
            delete msgClean._id;
        }

        const lastMsg = {
            chatId: msg.chatId,
            message: msgClean,
            timestamp: msg.timestamp,
            name: msg.contactName
        };

        // Remove _id do lastMsg também
        if (lastMsg._id) {
            delete lastMsg._id;
        }

        await collection.updateOne({ chatId: msg.chatId }, { $set: lastMsg });
    } catch (error) {
        console.error(`❌ Error saving last chat message:`, error);
        // Não relança o erro para evitar crash
    }
}

/**
 * Atualiza o status ack de uma mensagem
 * @param {string} clientNumber - Número do cliente
 * @param {string} messageId - ID da mensagem
 * @param {number} ack - Novo status ack (0=error, 1=sent, 2=delivered, 3=read, 4=played)
 * @param {Object} msgData - Dados opcionais da mensagem (para salvar se não existir)
 */
async function updateMessageAck(clientNumber, messageId, ack, msgData = null) {
    try {
        let i = 0;
        const conn = await mongoConnection.getConnection(clientNumber);
        if (!conn) {
            console.warn(`⚠️ MongoDB não disponível, não foi possível atualizar ack ${messageId}`);
            return;
        }

        const db = conn.db;

        const chatId = msgData.chatId;
        const collection = db.collection(chatId);

        // Mapeia ack para status legível
        const ackStatusMap = {
            0: 'ERROR ❌',
            1: 'SENT ✓',
            2: 'DELIVERED ✓✓',
            3: 'READ ✓✓🔵',
            4: 'PLAYED ✓✓🔵🔊'
        };
        const ackStatus = ackStatusMap[ack] || `UNKNOWN (${ack})`;

        // Tenta atualizar primeiro
        const result = await collection.updateOne(
            { id: messageId },
            { $set: { ack: ack } }
        );

        // Se não encontrou a mensagem e temos dados, salva a mensagem
        if (result.matchedCount === 0 && msgData) {
            console.log(`📥 ACK ${ackStatus}: Message ${messageId} not found, saving new`);

            const msgToSave = { ...msgData, ack: ack };
            if (msgToSave._id) {
                delete msgToSave._id;
                console.log('b', i++)
            }

            await collection.insertOne(msgToSave);

            console.log(`✅ ACK ${ackStatus}: Message saved successfully`);
        } else if (result.modifiedCount > 0) {
            console.log(`✅ ACK ${ackStatus}: Message ${messageId.substring(0, 50)}... updated`);
        } else {
            console.log(`ℹ️ ACK ${ackStatus}: Message ${messageId.substring(0, 50)}... (no change needed)`);
        }
    } catch (error) {
        console.error(`❌ Error updating message ack ${messageId}:`, error.message);
        // Não relança o erro para evitar crash
    }
}

module.exports = { getMessageFromContact, saveMessage, saveLastChatMessage, updateMessageAck };
