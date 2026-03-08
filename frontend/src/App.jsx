import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import ConnectionStatus from './components/connectionStatus/ConnectionStatus';
import ContactList from './components/contacts/ContactList';
import './App.css';
import ChatWindow from './components/chatWindow/ChatWindow';

const socket = io('http://localhost:3000');

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [contactList, setContactList] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);

  const getContactListInBackend = () => {
    socket.emit("get-contacts");
  };

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

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('contact-list');
    };
  }, []);

  useEffect(() => {
    if(isConnected){
      getContactListInBackend();
    }
  },[isConnected]);

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
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
          />
        </div>

        {/* Área do chat - direita */}
        <div className="chat-area">
          {selectedContact ? (
            <ChatWindow 
              contact={selectedContact}
              socket={socket}
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