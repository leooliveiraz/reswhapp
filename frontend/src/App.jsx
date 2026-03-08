import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import ConnectionStatus from './components/connectionStatus/ConnectionStatus';
import ContactList from './components/contacts/ContactList';
const socket = io('http://localhost:3000');
function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [contactList, setContactList] = useState([]);

  const getContactListInBackend = () => {
    console.log("emitting get contact list")
    socket.emit("get-contacts",{"hello":"world"});
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
      console.log('Mensagem recebida:', data);
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
      
  },[isConnected])

  return (
    <>
      <ConnectionStatus isConnectedToBackend={isConnected}></ConnectionStatus>
      <ContactList contacts={contactList}></ContactList>
    </>
  )
}

export default App
