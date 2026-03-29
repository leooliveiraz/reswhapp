/**
 * whatsappService.js - Camada de compatibilidade
 * 
 * Este arquivo agora usa a classe WhatsAppClient internamente.
 * Mantido para compatibilidade com código legado.
 * 
 * Para novo código, use diretamente: const { WhatsAppClient } = require('./whatsappClient');
 */

const { WhatsAppClient } = require('./whatsappClient');

// Instância singleton para funções de compatibilidade
let whatsappClientInstance = null;

function getWhatsAppClient() {
    if (!whatsappClientInstance) {
        throw new Error('WhatsApp client not initialized. Use WhatsAppClient class directly.');
    }
    return whatsappClientInstance;
}

function setWhatsAppClient(client) {
    whatsappClientInstance = client;
}

/**
 * Funções de compatibilidade - delegam para a classe WhatsAppClient
 */

async function getContactList(client) {
    if (client instanceof WhatsAppClient) {
        return await client.getContactList();
    }
    // Compatibilidade com instância antiga do client do whatsapp-web.js
    if (client && typeof client.getContacts === 'function') {
        try {
            const contacts = await client.getContacts();
            const savedContacts = contacts.filter(c =>
                c.isMyContact && c.isUser && c.id.server === 'c.us'
            );
            return savedContacts;
        } catch (error) {
            console.error('Error on get contact list:', error);
            return [];
        }
    }
    throw new Error('Invalid client instance');
}

async function getChatList(client) {
    if (client instanceof WhatsAppClient) {
        return await client.getChatList();
    }
    // Compatibilidade com instância antiga
    if (client && typeof client.getChats === 'function') {
        try {
            const chatList = await client.getChats();
            chatList.sort((a, b) => b.timestamp - a.timestamp);
            return chatList;
        } catch (error) {
            console.error('Error on get chat list:', error);
            return [];
        }
    }
    throw new Error('Invalid client instance');
}

async function getLastMessages(client, contactId, limit = 50) {
    if (client instanceof WhatsAppClient) {
        return await client.getLastMessages(contactId, limit);
    }
    // Compatibilidade com instância antiga
    if (client && typeof client.getChatById === 'function') {
        try {
            const chat = await client.getChatById(contactId);
            if (!chat) {
                throw new Error('Chat not found');
            }
            const messages = await chat.fetchMessages({ limit });
            const { extractMessageData } = require('./whatsappClient');
            const formattedMessages = await Promise.all(
                messages.map(async (msg) => {
                    return await extractMessageData(msg, true, client);
                })
            );
            formattedMessages.sort((a, b) => b.timestamp - a.timestamp);
            return {
                success: true,
                contactId: chat.id._serialized,
                contactName: chat.name || 'Unknown',
                unreadCount: chat.unreadCount,
                messages: formattedMessages,
                total: formattedMessages.length
            };
        } catch (error) {
            console.error('Error getting last messages:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    throw new Error('Invalid client instance');
}

module.exports = {
    getContactList,
    getChatList,
    getLastMessages,
    setWhatsAppClient,
    getWhatsAppClient
};