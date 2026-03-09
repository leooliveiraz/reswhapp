import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import ConnectionStatus from './components/connectionStatus/ConnectionStatus';
import ContactList from './components/contactList/ContactList';
import './App.css';
import ChatWindow from './components/chatWindow/ChatWindow';

const socket = io('http://localhost:3000');

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [contactList, setContactList] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messagesByContact, setMessagesByContact] = useState({});
  const [lastMessages, setLastMessages] = useState({});

  const getContactListInBackend = () => {
    socket.emit("get-contacts");
  };

  // Função para extrair o ID do contato de forma consistente
  const getContactId = useCallback((contact) => {
    return contact?.id?._serialized || contact?.id?.user || contact?.from || contact?.number || contact?.contactId;
  }, []);

  // Função para criar um novo contato a partir de uma mensagem
  const createContactFromMessage = useCallback((message) => {
    // Determinar se a mensagem é de um contato que não sou eu
    const isFromMe = message.isMe || message.fromMe;

    // Se a mensagem é de mim, o contato é o destinatário
    // Se a mensagem é de outro, o contato é o remetente
    const contactData = isFromMe ? message.to : message.from;
    const contactName = isFromMe ? message.to : message.from;

    // Extrair número do contato
    let contactNumber = contactData;
    if (contactData.includes('@')) {
      contactNumber = contactData.split('@')[0];
    }
    if (contactNumber.includes(':')) {
      contactNumber = contactNumber.split(':')[0];
    }

    // Criar objeto de contato
    return {
      id: {
        server: "c.us",
        user: contactNumber,
        _serialized: contactData
      },
      number: contactNumber,
      name: message.contactName || contactNumber,
      shortName: message.contactName || contactNumber,
      isBusiness: false,
      isMyContact: false,
      isUser: true,
      isGroup: false,
      isWAContact: true,
      isBlocked: false,
      type: "in",
      fromMessage: true // Flag para indicar que foi criado a partir de uma mensagem
    };
  }, []);

  // Função para verificar e adicionar contato se necessário
  const ensureContactExists = useCallback((message) => {
    setContactList(prevContacts => {
      // Determinar o ID do possível contato
      const isFromMe = message.isMe || message.fromMe;
      const potentialContactId = isFromMe ? message.to : message.from;

      // Verificar se o contato já existe na lista
      const contactExists = prevContacts.some(contact =>
        getContactId(contact) === potentialContactId ||
        contact.number === potentialContactId?.split('@')[0]?.split(':')[0]
      );

      // Se não existir, criar e adicionar
      if (!contactExists && potentialContactId) {
        console.log('Criando novo contato a partir da mensagem:', potentialContactId);
        const newContact = createContactFromMessage(message);
        return [...prevContacts, newContact];
      }

      return prevContacts;
    });
  }, [createContactFromMessage, getContactId]);

  // Função para processar nova mensagem
  const processNewMessage = useCallback((message) => {
    console.log('Processando mensagem:', message);
    if (!message)
      return;
    // Primeiro, garantir que o contato existe
    ensureContactExists(message);

    // Determinar de qual contato é a mensagem
    const isFromMe = message.isMe || message.fromMe;
    const contactId = isFromMe
      ? message.to // Se for mensagem enviada por mim, o contato é o destinatário
      : message.from; // Se for mensagem recebida, o contato é o remetente

    // Atualizar última mensagem do contato
    setLastMessages(prev => ({
      ...prev,
      [contactId]: {
        text: message.body || message.text,
        timestamp: message.timestamp,
        fromMe: isFromMe
      }
    }));

    // Atualizar mensagens do contato
    setMessagesByContact(prev => {
      const contactMessages = prev[contactId] || [];

      // Verificar se a mensagem já existe (evitar duplicatas)
      const exists = contactMessages.some(m => m.id === message.id);
      if (exists) return prev;

      return {
        ...prev,
        [contactId]: [...contactMessages, message].sort((a, b) => {
          // Ordenar por timestamp
          try {
            const dateA = new Date(a.timestamp?.replace(' às ', ' ').replace(/\//g, '-') || 0);
            const dateB = new Date(b.timestamp?.replace(' às ', ' ').replace(/\//g, '-') || 0);
            return dateA - dateB;
          } catch (e) {
            return 0;
          }
        })
      };
    });

  }, [ensureContactExists]);

  // Função para ordenar contatos
  const sortContacts = useCallback((contacts, lastMsgs) => {
    return [...contacts].sort((a, b) => {
      const idA = getContactId(a);
      const idB = getContactId(b);

      const lastMsgA = lastMsgs[idA];
      const lastMsgB = lastMsgs[idB];

      // Se ambos têm última mensagem, ordenar pela mais recente
      if (lastMsgA && lastMsgB) {
        try {
          const dateA = new Date(lastMsgA.timestamp?.replace(' às ', ' ').replace(/\//g, '-') || 0);
          const dateB = new Date(lastMsgB.timestamp?.replace(' às ', ' ').replace(/\//g, '-') || 0);
          return dateB - dateA; // Mais recente primeiro
        } catch (e) {
          return 0;
        }
      }

      // Se apenas um tem mensagem, esse vem primeiro
      if (lastMsgA && !lastMsgB) return -1;
      if (!lastMsgA && lastMsgB) return 1;

      // Se nenhum tem mensagem, ordenar por nome
      const nameA = (a.name || a.shortName || a.number || '').toLowerCase();
      const nameB = (b.name || b.shortName || b.number || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [getContactId]);

  // Efeito para ordenar contatos quando a lista ou últimas mensagens mudam
  useEffect(() => {
    setContactList(prev => sortContacts(prev, lastMessages));
  }, [lastMessages, sortContacts]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Conectado ao servidor!', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Desconectado do servidor');
      setIsConnected(false);
    });

    socket.on('contact-list', (data) => {
      console.log('Contatos recebidos:', data);
      setContactList(data);
    });

    socket.on('new-message', (message) => {
      console.log('Nova Mensagem recebida:', message);
      processNewMessage(message);
    });

    // Trecho de exemplo para adicionar no useEffect do App.jsx

    socket.on('last-messages', (data) => {
      console.log('📩 Histórico recebido (last-messages):', data);

      // Verifique a estrutura do seu 'data'. Pode ser algo como:
      // { contactId: "...", messages: [...] } ou uma lista diretamente.
      // Vou assumir que você recebe um objeto com contactId e messages.

      if (data && data.contactId && data.messages) {
        // Atualiza o estado que armazena as mensagens, indexado pelo ID do contato
        setMessagesByContact(prev => ({
          ...prev,
          [data.contactId]: data.messages
        }));

        // Opcional: Atualiza a última mensagem para ordenar a lista de contatos
        if (data.messages.length > 0) {
          const lastMsg = data.messages[data.messages.length - 1];
          setLastMessages(prev => ({
            ...prev,
            [data.contactId]: {
              text: lastMsg.body || lastMsg.text,
              timestamp: lastMsg.timestamp,
              fromMe: lastMsg.isMe || lastMsg.fromMe,
            }
          }));
        }
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('contact-list');
      socket.off('new-message');
    };
  }, [processNewMessage]);

  useEffect(() => {
    if (isConnected) {
      getContactListInBackend();
    }
  }, [isConnected]);

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    const contactId = getContactId(contact); // Use sua função para extrair o ID

    if (!messagesByContact[contactId]) {
      console.log('Solicitando last-messages para:', contactId);
      socket.emit('get-last-messages', { contactId: contactId }); // Emite o evento
    }
  };

  // Função para enviar mensagem
  const handleSendMessage = (contact, text) => {
    const contactId = getContactId(contact);
    const messageData = {
      to: contactId,
      body: text,
      text: text,
      timestamp: new Date().toLocaleString('pt-BR'),
      fromMe: true,
      isMe: true,
      id: Date.now().toString()
    };

    socket.emit('send-message', messageData);

    // Atualizar localmente
    processNewMessage({
      ...messageData,
      from: socket.id,
      to: contactId,
      contact: contact
    });
  };

  return (
    <div className="app">
      <ConnectionStatus isConnectedToBackend={isConnected} />

      <div className="whatsapp-layout">
        {/* Sidebar de contatos - esquerda */}
        <div className="contacts-sidebar">
          <div className="sidebar-header">
            <h2>Contatos</h2>
            <span className="contact-count">{contactList.length}</span>
          </div>
          <ContactList
            contacts={contactList}
            selectedContact={selectedContact}
            onSelectContact={handleSelectContact}
            lastMessages={lastMessages}
          />
        </div>

        {/* Área do chat - direita */}
        <div className="chat-area">
          {selectedContact ? (
            <ChatWindow
              contact={selectedContact}
              messages={messagesByContact[getContactId(selectedContact)] || []} // Passa as mensagens específicas do contato
              onSendMessage={handleSendMessage}
              onClose={() => setSelectedContact(null)}
            />
          ) : (
            <div className="no-chat-selected">
              <div className="welcome-message">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                  alt="WhatsApp"
                  className="welcome-logo"
                />
                <h2>WhatsApp Web</h2>
                <p>Selecione um contato para começar a conversar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;