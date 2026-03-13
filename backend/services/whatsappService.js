const { Client } = require("whatsapp-web.js");

const SHOW_MESSAGES = false;

async function extractMessageData(message) {
    if (message.from === 'status@broadcast' || message.id.remote === 'status@broadcast' || message._data.remote === 'status@broadcast') {
        return;
    }
    if (SHOW_MESSAGES) console.log("Received nessage", message);
    const chat = await message.getChat();
    const me = message.notifyName;
    const isGroup = message.from.includes('@g.us');

    const isMe = message.fromMe;
    let messageInfo = '';
    let contactName ="";
    let contact = null;
    try{
        contact = await message.getContact();
        contactName = contact.pushname || contact.name || contact.number || 'Unknown';
    } catch(e){
        console.error(e)
    }
    

    msgData = {
        chatId: chat.id._serialized,
        chatUser: chat.id.user,
        id: message.id._serialized,
        author: message.author,
        dateTime: new Date(message.timestamp * 1000).toLocaleString(),
        timestamp: message.timestamp,
        type: message.type,
        contactName: contactName,
        from: message.from,
        to: message.to,
        body: message.body,
        viewed: message.viewed,
        contact: contact,
        deviceType: message.deviceType,
        notifyName: message.notifyName,
        isMe: isMe,
        isNewMsg: message.isNewMsg,
        isStatus: message.isStatus,
        isGif: message.isGif,
        isForwarded: message.isForwarded,
        hasReaction: message.hasReaction,
        hasQuotedMsg: message.hasQuotedMsg,
        hasMedia: message.hasMedia,
        mentionedIds: message.mentionedIds,
        groupMentions: message.groupMentions,
        ack: message.ack,
        location: message.location
    }

    return msgData;
}


async function getContactList(client) {
    try {
        const contacts = await client.getContacts();
        const savedContacts = contacts.filter(c =>
            c.isMyContact && c.isUser && c.id.server === 'c.us'
        );
        return savedContacts;

    } catch (error) {
        console.error('Error on get contact list:', error);
        return []
    }
}


async function getChatList(client) {
    try {
        const chatList = await client.getChats();
        return chatList;

    } catch (error) {
        console.error('Error on get contact list:', error);
    }
}


async function getLastMessages(client, contactId, limit = 50) {
    try {
        if (!client) {
            throw new Error('WhatsApp client not initialized');
        }
        const chat = await client.getChatById(contactId);
        
        if (!chat) {
            throw new Error('Chat not found');
        }
        const messages = await chat.fetchMessages({ limit });
        const formattedMessages = await Promise.all(messages.map(async (msg) => {
            return extractMessageData(msg);
        }));

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


module.exports = {
    extractMessageData,
    getContactList,
    getChatList,
    getLastMessages
}