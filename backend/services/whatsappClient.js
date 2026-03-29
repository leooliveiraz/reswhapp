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
        
        // Fila de mensagens pendentes
        this.messageList = {};
        this.isProcessingMessages = false;
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
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                protocolTimeout: this.chromeTimeout
            }
        });

        this._setupEvents();
        this.client.initialize();
        
        return this;
    }

    /**
     * Configura todos os eventos do WhatsApp
     */
    _setupEvents() {
        this.client.on('ready', () => {
            this.clientInfo = {
                name: this.client.info.pushname,
                number: this.client.info.wid.user,
                id: this.client.info.wid._serialized
            };
            this.isReady = true;
            
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
                
                this._addToMessageQueue(msgData);
                
                if (this.onMessageCallback) {
                    this.onMessageCallback(msgData);
                }
            } catch (error) {
                console.error("Message creation process error:", error);
            }
        });
    }

    /**
     * Adiciona mensagem à fila de processamento
     */
    _addToMessageQueue(message) {
        this.messageList[message.id] = message;
    }

    /**
     * Processa fila de mensagens pendentes
     */
    async processMessageQueue() {
        if (this.isProcessingMessages) {
            return;
        }
        
        try {
            this.isProcessingMessages = true;
            const keys = Object.keys(this.messageList);
            
            for (const key of keys) {
                console.log("processing ", key);
                try {
                    await this._processMessage(this.messageList[key]);
                    delete this.messageList[key];
                } catch (error) {
                    if (error.name === 'MongoServerError') {
                        console.log('✅ É um MongoServerError');
                        delete this.messageList[key];
                    } else {
                        console.error("Error on message processment:", error);
                    }
                }
            }
        } catch (error2) {
            console.error("Error on message processment:", error2);
        } finally {
            this.isProcessingMessages = false;
        }
    }

    /**
     * Callback padrão para processamento de mensagens
     */
    async _processMessage(msg) {
        // Implementação padrão - pode ser sobrescrita pelo callback onMessage
        console.log("New message", msg.from, msg.body);
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
