const fs = require('fs').promises;
const path = require('path');

class MessageProcessor {
  constructor(baseDir = './mensagens') {
    this.baseDir = baseDir;
  }

  /**
   * Processa uma mensagem recebida
   * @param {Object} message - Mensagem no formato especificado
   */
  async processMessage(message) {
    try {
      // Extrair informações do contato
      const contactInfo = this.extractContactInfo(message);
      
      // Criar estrutura de diretórios
      await this.ensureDirectoryStructure(contactInfo);
      
      // Processar e salvar a mensagem
      await this.saveMessage(message, contactInfo);
      
      console.log(`Mensagem processada com sucesso para ${contactInfo.contactName}`);
      return { success: true, contactInfo };
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extrai informações relevantes do contato
   */
  extractContactInfo(message) {
    // Formatar nome do contato (remover caracteres especiais para nome de arquivo)
    const contactName = message.contactName || message.contact?.name || message.from.split('@')[0];
    const sanitizedName = this.sanitizeFileName(contactName);
    
    // Extrair data da mensagem
    const messageDate = this.extractDate(message.dateTime || message.timestamp);
    
    return {
      contactId: message.from,
      contactName: sanitizedName,
      originalName: contactName,
      date: messageDate,
      year: messageDate.split('-')[0],
      month: messageDate.split('-')[1],
      day: messageDate.split('-')[2]
    };
  }

  /**
   * Sanitiza nome do arquivo
   */
  sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '_');
  }

  /**
   * Extrai data da mensagem
   */
  extractDate(dateTime) {
    if (typeof dateTime === 'string' && dateTime.includes(',')) {
      // Formato: '11/03/2026, 19:18:52'
      const [datePart] = dateTime.split(',');
      const [day, month, year] = datePart.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else if (dateTime) {
      // Se for timestamp
      const date = new Date(dateTime * 1000);
      return date.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Cria estrutura de diretórios necessária
   */
  async ensureDirectoryStructure(contactInfo) {
    const contactDir = path.join(this.baseDir, contactInfo.contactName);
    const yearDir = path.join(contactDir, contactInfo.year);
    const monthDir = path.join(yearDir, contactInfo.month);
    
    await fs.mkdir(monthDir, { recursive: true });
    return monthDir;
  }

  /**
   * Salva a mensagem no arquivo apropriado
   */
  async saveMessage(message, contactInfo) {
    const monthDir = path.join(this.baseDir, contactInfo.contactName, contactInfo.year, contactInfo.month);
    const fileName = `${contactInfo.date}.json`;
    const filePath = path.join(monthDir, fileName);
    
    // Preparar mensagem para salvar (remover campos circulares/indesejados)
    const cleanMessage = this.cleanMessage(message);
    
    // Ler arquivo existente ou criar novo
    let messagesData = await this.loadMessagesFile(filePath);
    
    // Adicionar nova mensagem
    if (!messagesData.messages) {
      messagesData.messages = [];
    }
    
    // Adicionar timestamp para ordenação
    cleanMessage.savedTimestamp = Date.now();
    messagesData.messages.push(cleanMessage);
    
    // Ordenar mensagens por timestamp
    messagesData.messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    // Atualizar metadados
    messagesData.totalMessages = messagesData.messages.length;
    messagesData.lastUpdated = new Date().toISOString();
    messagesData.contactInfo = {
      id: contactInfo.contactId,
      name: contactInfo.originalName,
      sanitizedName: contactInfo.contactName
    };
    
    // Salvar arquivo
    await fs.writeFile(filePath, JSON.stringify(messagesData, null, 2));
  }

  /**
   * Carrega arquivo de mensagens existente
   */
  async loadMessagesFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // Arquivo não existe, retornar estrutura vazia
      return {
        date: path.basename(filePath, '.json'),
        messages: [],
        totalMessages: 0,
        created: new Date().toISOString()
      };
    }
  }

  /**
   * Limpa a mensagem removendo campos circulares ou desnecessários
   */
  cleanMessage(message) {
    // Criar cópia do objeto
    const clean = JSON.parse(JSON.stringify(message, (key, value) => {
      // Remover campos circulares ou muito grandes
      if (key === 'contact' && value) {
        // Manter apenas informações relevantes do contato
        return {
          id: value.id,
          number: value.number,
          name: value.name,
          pushname: value.pushname,
          isBusiness: value.isBusiness,
          isMyContact: value.isMyContact,
          isBlocked: value.isBlocked
        };
      }
      return value;
    }));
    
    return clean;
  }

  /**
   * Obtém todas as mensagens de um contato
   */
  async getContactMessages(contactName, startDate, endDate) {
    const contactDir = path.join(this.baseDir, this.sanitizeFileName(contactName));
    const allMessages = [];
    
    try {
      const years = await fs.readdir(contactDir);
      
      for (const year of years) {
        const yearPath = path.join(contactDir, year);
        const months = await fs.readdir(yearPath);
        
        for (const month of months) {
          const monthPath = path.join(yearPath, month);
          const files = await fs.readdir(monthPath);
          
          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(monthPath, file);
              const fileDate = path.basename(file, '.json');
              
              // Filtrar por data se necessário
              if (startDate && fileDate < startDate) continue;
              if (endDate && fileDate > endDate) continue;
              
              const data = await this.loadMessagesFile(filePath);
              allMessages.push(...data.messages);
            }
          }
        }
      }
      
      // Ordenar por data
      allMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      
      return allMessages;
    } catch (error) {
      console.error('Erro ao obter mensagens do contato:', error);
      return [];
    }
  }

  /**
   * Estatísticas do contato
   */
  async getContactStats(contactName) {
    const messages = await this.getContactMessages(contactName);
    
    const stats = {
      totalMessages: messages.length,
      firstMessage: messages[0]?.dateTime,
      lastMessage: messages[messages.length - 1]?.dateTime,
      uniqueDays: new Set(messages.map(m => this.extractDate(m.dateTime))).size,
      messagesByType: {},
      mediaCount: 0
    };
    
    messages.forEach(msg => {
      // Contar por tipo
      stats.messagesByType[msg.type] = (stats.messagesByType[msg.type] || 0) + 1;
      
      // Contar mídia
      if (msg.hasMedia) stats.mediaCount++;
    });
    
    return stats;
  }
}

// Exemplo de uso
async function example() {
  const processor = new MessageProcessor('./mensagens_whatsapp');
  
  // Exemplo de mensagem recebida
  const mensagem = {
    id: 'false_5512996137735@c.us_3AD7865E7A44DB3E89B0',
    author: undefined,
    dateTime: '11/03/2026, 19:18:52',
    timestamp: 1773267532,
    type: 'chat',
    contactName: 'Bruna Rocha',
    from: '5512996137735@c.us',
    to: '5512996495488@c.us',
    body: 'Semente',
    viewed: undefined,
    contact: {
      id: {
        server: 'c.us',
        user: '5512996137735',
        _serialized: '5512996137735@c.us'
      },
      number: '5512996137735',
      isBusiness: false,
      isEnterprise: false,
      labels: undefined,
      name: 'Bruna',
      pushname: 'Bruna Rocha',
      shortName: 'Bruna',
      statusMute: false,
      type: 'in',
      verifiedLevel: undefined,
      verifiedName: undefined,
      isMe: false,
      isUser: true,
      isGroup: false,
      isWAContact: true,
      isMyContact: true,
      isBlocked: false
    },
    deviceType: 'ios',
    notifyName: undefined,
    isMe: false,
    isNewMsg: undefined,
    isStatus: false,
    isGif: false,
    isForwarded: false,
    hasReaction: false,
    hasQuotedMsg: false,
    hasMedia: false,
    mentionedIds: [],
    groupMentions: [],
    ack: 1,
    location: undefined
  };
  
  // Processar mensagem
  const result = await processor.processMessage(mensagem);
  console.log('Resultado:', result);
  
  // Obter estatísticas
  const stats = await processor.getContactStats('Bruna Rocha');
  console.log('Estatísticas:', stats);
  
  // Obter todas as mensagens
  const messages = await processor.getContactMessages('Bruna Rocha');
  console.log(`Total de mensagens: ${messages.length}`);
}

// Exportar para uso em outros módulos
module.exports = MessageProcessor;

// Se executado diretamente
if (require.main === module) {
  example().catch(console.error);
}