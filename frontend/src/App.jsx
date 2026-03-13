import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import ContactList from './components/ContactList';
import ChatList from './components/ChatList';
import { AppContext } from './AppContext';
import Chat from './components/Chat';

const socket = io('http://localhost:3000');

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [contactList, setContactList] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [chatList, setChatList] = useState([]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Conectado ao servidor!', socket.id);
      setIsConnected(true);
      socket.emit("get-contact-list")
      socket.emit("get-chat-list")
    });

    socket.on('disconnect', () => {
      console.log('Desconectado do servidor');
      setIsConnected(false);
    });

    socket.on('contact-list', (contactListReceived) => {
      console.log('Recebido lista de contatos');
      setContactList(contactListReceived);
    });
    socket.on('chat-list', (chatListReceived) => {
      console.log('Recebido lista de chats');
      setChatList(chatListReceived);
    });


    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('contact-list');
      socket.off('new-message');
    };
  },[])
  return <AppContext.Provider value={{ setSelectedContact }}>
    <div>
      <div>Está conectado ao websocket ? {isConnected ? "Sim" : "Não"}</div>
      <div>Contato selecionado ? {selectedContact ? selectedContact : "Nenuhm"}</div>
      <div className="container">
        <div className="painel-esquerdo">
          <ChatList chatList={chatList} ></ChatList>
        </div>
        
        <div className="painel-direito">
          <Chat contactId={selectedContact} socket={socket}></Chat>
        </div>
      </div>
      
    </div>
</AppContext.Provider>
}

export default App;