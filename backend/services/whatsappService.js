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
        timestamp: new Date(message.timestamp * 1000).toLocaleString(),
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


module.exports = {
    extractMessageData,
    getContactList
}