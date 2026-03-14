class AppMessage {
    constructor(data) {
        this.chatId = data.chatId;
        this.chatUser = data.chatUser;
        this.id = data.id;
        this.author = data.author;
        this.dateTime = data.dateTime;
        this.timestamp = data.timestamp;
        this.type = data.type;
        this.contactName = data.contactName;
        this.from = data.from;
        this.to = data.to;
        this.body = data.body;
        this.viewed = data.viewed;
        this.contact = data.contact || {};
        this.deviceType = data.deviceType;
        this.notifyName = data.notifyName;
        this.isMe = data.isMe;
        this.isNewMsg = data.isNewMsg;
        this.isStatus = data.isStatus;
        this.isGif = data.isGif;
        this.isForwarded = data.isForwarded;
        this.hasReaction = data.hasReaction;
        this.hasQuotedMsg = data.hasQuotedMsg;
        this.hasMedia = data.hasMedia;
        this.mentionedIds = data.mentionedIds || [];
        this.groupMentions = data.groupMentions || [];
        this.ack = data.ack;
        this.location = data.location;
    }
}
