const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require("path");
require('dotenv').config();

const MEDIA_DIR = process.env.MEDIA_DIR || "./downloads/";
const SHOW_MESSAGES = false;

/**
 * Classe que encapsula todas as funcionalidades do whatsapp-web.js
 * Gerencia conexão, eventos e operações com o WhatsApp
 */
class WhatsAppClient {
    constructor(options = {}) {
        this.client = null;
        this.clientInfo = {};
        this.isReady = false;
        this.chromeTimeout = options.chromeTimeout || 60 * 1000;
        this.chromiumDataPath = options.chromiumDataPath || process.env.CHROMIUM_DATA;
        
        // Callbacks
        this.onReadyCallback = options.onReady || null;
        this.onQRCodeCallback = options.onQRCode || null;
        this.onMessageCallback = options.onMessage || null;

        // Controle de reconexão
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
        this.reconnectDelay = options.reconnectDelay || 5000;
    }

    /**
     * Wrapper para operações com retry e timeout
     */
    async _withRetry(operation, options = {}) {
        const {
            maxAttempts = 3,
            delay = 2000,
            timeout = this.chromeTimeout,
            onError = null,
            operationName = 'Operation'
        } = options;

        let lastError;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // Timeout na operação
                const result = await Promise.race([
                    operation(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error(`${operationName} timeout after ${timeout}ms`)), timeout)
                    )
                ]);
                return result;
            } catch (error) {
                lastError = error;
                console.error(`${operationName} - Attempt ${attempt}/${maxAttempts} failed:`, error.message);

                if (onError) {
                    try {
                        await onError(error, attempt);
                    } catch (callbackError) {
                        console.error('Error in onError callback:', callbackError);
                    }
                }

                if (attempt < maxAttempts) {
                    console.log(`Retrying ${operationName} in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    /**
     * Reinicia o cliente WhatsApp
     */
    async _reconnect() {
        if (this.isReconnecting) {
            console.log('Reconnection already in progress...');
            return;
        }

        this.isReconnecting = true;
        this.reconnectAttempts++;

        try {
            console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

            if (this.client) {
                try {
                    await this.client.destroy();
                } catch (e) {
                    console.error('Error destroying client:', e);
                }
                this.client = null;
            }

            this.isReady = false;
            this.clientInfo = {};

            await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));

            this.initialize();

            console.log('✅ Reconnection initiated');
        } catch (error) {
            console.error('❌ Error on reconnect:', error);
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                console.log(`Next attempt in ${this.reconnectDelay * 2}ms`);
                setTimeout(() => this._reconnect(), this.reconnectDelay * 2);
            } else {
                console.error('❌ Max reconnect attempts reached. Application will continue running but WhatsApp is disconnected.');
            }
        } finally {
            this.isReconnecting = false;
        }
    }

    /**
     * Inicializa o cliente do WhatsApp
     */
    initialize() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: this.chromiumDataPath
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ],
                protocolTimeout: this.chromeTimeout,
                timeout: this.chromeTimeout
            },
            restartOnAuthFail: true,
            takeoverOnConflict: true
        });

        this._setupEvents();
        this.client.initialize();
        
        return this;
    }

    /**
     * Configura todos os eventos do WhatsApp
     */
    _setupEvents() {
        // Evento de conexão estabelecida
        this.client.on('authenticated', () => {
            console.log('🔐 Authenticated!');
        });

        // Evento de falha de autenticação
        this.client.on('auth_failure', async (msg) => {
            console.error('❌ Authentication failure:', msg);
            // Não reinicia automaticamente para evitar loop infinito
            // mas mantém a aplicação rodando
        });

        // Evento de desconexão
        this.client.on('disconnected', async (reason) => {
            console.warn('⚠️ Disconnected:', reason);
            this.isReady = false;
            
            // Tenta reconectar automaticamente
            await this._reconnect();
        });

        // Evento de erro
        this.client.on('error', async (err) => {
            console.error('❌ WhatsApp Client error:', err);
            // Mantém a aplicação rodando, apenas loga o erro
        });

        // Evento de loading screen (útil para debug)
        this.client.on('loading_screen', (percent, message) => {
            console.log(`⏳ Loading screen: ${percent}% - ${message}`);
        });

        // Evento de change state (útil para debug)
        this.client.on('change_state', state => {
            console.log(`🔄 Change state: ${state}`);
        });

        this.client.on('ready', () => {
            this.clientInfo = {
                name: this.client.info.pushname,
                number: this.client.info.wid.user,
                id: this.client.info.wid._serialized
            };
            this.isReady = true;
            this.reconnectAttempts = 0; // Reseta contador de reconexão

            console.log(`Whatsapp Client is ready!\n${new Date()}\n${JSON.stringify(this.clientInfo)}`);

            if (this.onReadyCallback) {
                this.onReadyCallback(this.clientInfo);
            }
        });

        this.client.on('qr', qr => {
            try {
                if (this.onQRCodeCallback) {
                    this.onQRCodeCallback(qr);
                } else {
                    // Default: gera QR code no terminal
                    qrcode.generate(qr, { small: true });
                }
            } catch (error) {
                console.error("Error on generate qrcode:", error);
            }
        });

        this.client.on('message_create', async m => {
            try {
                const msgData = await this.extractMessageData(m, true);
                if (!msgData) return;

                // Salva diretamente no banco via callback
                if (this.onMessageCallback) {
                    await this.onMessageCallback(msgData);
                }
            } catch (error) {
                console.error("Message creation process error:", error);
            }
        });

        // Listener para reações em mensagens
        this.client.on('message_reaction', async reaction => {
            try {
                // Extrai o chatId do msgId (formato: "false::<chatId>::<messageId>")
                const msgIdSerialized = reaction.msgId?._serialized || reaction.msgId;
                const chatIdFromMsgId = msgIdSerialized ? msgIdSerialized.split('::')[1] : null;

                // Extrai o ID da mensagem original que foi reagida
                const originalMsgId = msgIdSerialized ? msgIdSerialized.split('::').slice(2).join('::') : null;

                const reactionData = {
                    id: reaction.id?._serialized || reaction.id,
                    msgId: msgIdSerialized,
                    originalMsgId: originalMsgId, // ID da mensagem que foi reagida
                    reaction: reaction.reaction || '',
                    body: reaction.reaction || '', // Para compatibilidade
                    timestamp: reaction.timestamp || Date.now(),
                    from: reaction.senderId?._serialized || reaction.senderId,
                    fromMe: reaction.senderId?.user === this.clientInfo?.number || false,
                    type: 'reaction',
                    chatId: reaction.id?.remote || chatIdFromMsgId,
                    chatUser: chatIdFromMsgId?.split('@')[0] || null,
                    senderId: reaction.senderId?.user || null,
                    senderPushname: reaction.senderId?.pushName || null
                };

                // Salva diretamente no banco via callback
                if (this.onMessageCallback) {
                    await this.onMessageCallback(reactionData);
                }
            } catch (error) {
                console.error('Error processing message reaction:', error);
            }
        });

        // Listener para ack de mensagens (enviada, entregue, lida)
        this.client.on('message_ack', async (message, ack) => {
            try {
                const ackStatus = WhatsAppClient._getAckStatus(ack);
                const messageId = message.id?._serialized || message.id;

                console.log(`📨 Received ACK ${ackStatus} - ${ack}: ${messageId.substring(0, 50)}...`);

                const ackData = {
                    id: messageId,
                    chatId: message.to,
                    from: message.from,
                    fromMe: message.fromMe,
                    type: 'message_ack',
                    ack: ack,
                    ackStatus: ackStatus,
                    timestamp: message.timestamp || Date.now(),
                    body: message.body,
                    type_msg: message.type
                };

                // Atualiza ack no MongoDB
                const { updateMessageAck } = require('./messageDataBase');
                await updateMessageAck(this.clientInfo.number, messageId, ack, {
                    id: messageId,
                    chatId: message.to,
                    from: message.from,
                    fromMe: message.fromMe,
                    body: message.body || '',
                    type: message.type || 'chat',
                    timestamp: message.timestamp
                });

                // Emite para os sockets
            } catch (error) {
                console.error('❌ Error processing message ack:', error.message);
            }
        });
    }

    /**
     * Extrai dados de uma mensagem
     * @param {Object} message - Mensagem do whatsapp-web.js
     * @param {boolean} realizeDownload - Se deve baixar mídia
     * @returns {Object} Dados da mensagem formatados
     */
    async extractMessageData(message, realizeDownload = false) {
        if (message.from === 'status@broadcast' ||
            message.id.remote === 'status@broadcast' ||
            message._data.remote === 'status@broadcast') {
            return;
        }

        if (SHOW_MESSAGES) console.log("Received message", message);

        const chat = await message.getChat();
        const me = message.notifyName;
        const isGroup = message.from.includes('@g.us');
        const isMe = message.fromMe;

        let messageInfo = '';
        let contactName = "";
        let contact = null;

        try {
            contact = await message.getContact();
            contactName = contact.pushname || contact.name || contact.number || 'Unknown';
        } catch (e) {
            console.error(e);
        }

        const msgData = {
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
        };

        // Extrai dados essenciais da mensagem respondida (apenas o necessário para exibição)
        if (message.hasQuotedMsg) {
            try {
                const quotedMsg = await message.getQuotedMessage();
                if (quotedMsg) {
                    const quotedContact = await quotedMsg.getContact().catch(() => null);
                    msgData.quotedMsg = {
                        id: quotedMsg.id._serialized,
                        body: quotedMsg.body || '',
                        type: quotedMsg.type || 'chat',
                        subtype: quotedMsg.subtype || null,
                        timestamp: quotedMsg.timestamp,
                        from: quotedMsg.from,
                        fromMe: quotedMsg.fromMe,
                        contactName: quotedContact?.pushname || quotedContact?.name || 'Unknown',
                        hasMedia: quotedMsg.hasMedia
                    };
                }
            } catch (e) {
                console.error('Error extracting quoted message:', e.message);
            }
        }

        if (realizeDownload && msgData.hasMedia) {
            const downloadFileData = this._ensureContactDir(msgData.chatId);
            const contactDir = downloadFileData.dirPath;
            const media = await message.downloadMedia();

            if (media) {
                const timestamp = Date.now();
                const fileName = this._generateFileName(contactName, media.mimetype, timestamp);
                const filePath = path.join(contactDir, fileName);

                console.log(filePath);
                fs.writeFileSync(filePath, media.data, 'base64');

                console.log(`✅ Imagem salva em: ${filePath}`);
                console.log(`   Tipo: ${media.mimetype}`);
                console.log(`   Tamanho: ${Math.round(media.data.length * 0.75 / 1024)} KB`);

                msgData.filePathRelative = filePath;
                msgData.filePathAbsolute = path.resolve(filePath);
                msgData.filePathDir = downloadFileData.safeName;
                msgData.fileName = fileName;
            }
        }

        return msgData;
    }

    /**
     * Garante que o diretório do contato existe
     */
    _ensureContactDir(contactName) {
        const safeName = contactName.replace(/[^\w\s]/gi, '_');
        const dirPath = path.join('./', 'downloads', safeName);

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`📁 Pasta criada: ${dirPath}`);
        }

        return { dirPath, safeName };
    }

    /**
     * Gera nome do arquivo para mídia
     */
    _generateFileName(contactName, mediaType, timestamp) {
        const safeName = contactName.replace(/[^\w\s]/gi, '_');
        const extension = mediaType.split('/')[1] || 'bin';
        return `${safeName}_${timestamp}.${extension}`;
    }

    /**
     * Obtém lista de contatos
     * @returns {Promise<Array>} Lista de contatos
     */
    async getContactList() {
        try {
            const contacts = await this.client.getContacts();
            const savedContacts = contacts.filter(c =>
                c.isMyContact && c.isUser && c.id.server === 'c.us'
            );
            return savedContacts;
        } catch (error) {
            console.error('Error on get contact list:', error);
            return [];
        }
    }

    /**
     * Obtém lista de chats
     * @returns {Promise<Array>} Lista de chats ordenada por timestamp
     */
    async getChatList() {
        try {
            const chatList = await this.client.getChats();
            chatList.sort((a, b) => b.timestamp - a.timestamp);
            return chatList;
        } catch (error) {
            console.error('Error on get chat list:', error);
            return [];
        }
    }

    /**
     * Obtém últimas mensagens de um chat
     * @param {string} contactId - ID do contato/chat
     * @param {number} limit - Limite de mensagens
     * @returns {Promise<Object>} Objeto com mensagens e metadados
     */
    async getLastMessages(contactId, limit = 50) {
        try {
            if (!this.client) {
                throw new Error('WhatsApp client not initialized');
            }
            
            const chat = await this.client.getChatById(contactId);

            if (!chat) {
                throw new Error('Chat not found');
            }
            
            const messages = await chat.fetchMessages({ limit });
            const formattedMessages = await Promise.all(
                messages.map(async (msg) => {
                    return await this.extractMessageData(msg, true);
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

    /**
     * Retorna informações do cliente conectado
     */
    getClientInfo() {
        return this.clientInfo;
    }

    /**
     * Verifica se o cliente está pronto
     */
    isClientReady() {
        return this.isReady && !!this.clientInfo.number;
    }

    /**
     * Retorna a instância do cliente (para operações avançadas)
     */
    getClient() {
        return this.client;
    }

    /**
     * Define o emitter para sockets
     */
    setSocketEmitter(io) {
        this.socketEmitter = io;
    }

    /**
     * Emite evento para os sockets conectados
     */
    _emitToSockets(eventName, data) {
        if (this.socketEmitter) {
            console.log(`📡 Emitting ${eventName} to ${this.socketEmitter.sockets?.sockets?.size || 0} sockets`);
            this.socketEmitter.emit(eventName, data);
        } else {
            console.warn('⚠️ socketEmitter not set!');
        }
    }

    /**
     * Retorna o status legível do ack
     * @param {number} ack - Código do ack
     * @returns {string} Status legível
     */
    static _getAckStatus(ack) {
        const ackMap = {
            0: 'ERROR',
            1: 'SENT',
            2: 'DELIVERED',
            3: 'READ',
            4: 'PLAYED'
        };
        return ackMap[ack] || `UNKNOWN_${ack}`;
    }
}

// Exporta a classe e também funções utilitárias para compatibilidade
module.exports = {
    WhatsAppClient,
    // Exporta funções avulsas para compatibilidade com código legado
    extractMessageData: async function(message, realizeDownload) {
        // Wrapper para compatibilidade - requer instância do cliente
        throw new Error('Use a classe WhatsAppClient para extrair dados de mensagens');
    },
    getContactList: async function(client) {
        return await client.getContactList();
    },
    getChatList: async function(client) {
        return await client.getChatList();
    },
    getLastMessages: async function(client, contactId, limit) {
        return await client.getLastMessages(contactId, limit);
    }
};
