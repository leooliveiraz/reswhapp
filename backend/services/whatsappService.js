const SHOW_MESSAGES = false;

async function extractMessageData(message) {
    if (message.from === 'status@broadcast' || message.id.remote === 'status@broadcast' || message._data.remote === 'status@broadcast') {
        return;
    }
    if (SHOW_MESSAGES) console.log("Received nessage", message);

    const me = message.notifyName;
    const isGroup = message.from.includes('@g.us');
    const contact = await message.getContact();
    const contactName = contact.pushname || contact.name || contact.number || 'Unknown';
    const isMe = message.fromMe;
    let messageInfo = '';

    if (isMe) {
        const chat = await message.getChat();
        messageInfo = `[Me to ${chat.name || message.to}]`;
    } else {
        if (isGroup) {
            const author = await message.getContact();
            messageInfo = `[${contactName} in ${message.from}]`;
        } else {
            messageInfo = `[${contactName}]`;
        }
    }

    msgData = {
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
    }
}


async function getLastMessages(client, contactId, limit = 50) {
    try {
        // Verificar se o cliente está pronto
        if (!client) {
            throw new Error('WhatsApp client not initialized');
        }

        // Buscar o chat pelo ID do contato
        const chat = await client.getChatById(contactId);
        
        if (!chat) {
            throw new Error('Chat not found');
        }

        // Buscar as últimas mensagens
        const messages = await chat.fetchMessages({ limit });
        
        // Processar as mensagens para um formato mais amigável
        const formattedMessages = await Promise.all(messages.map(async (msg) => {
            return extractMessageData(msg);
        }));

        // Ordenar da mais nova para a mais antiga (opcional)
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
        console.error('Error getting last messages:', error);
        return {
            success: false,
            error: error.message
        };
    }
}


module.exports = {
    extractMessageData,
    getContactList,
    getLastMessages
}