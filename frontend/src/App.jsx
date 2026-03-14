import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";
import ContactList from "./components/ContactList";
import ChatList from "./components/ChatList";
import { AppContext } from "./AppContext";
import Chat from "./components/Chat";
import Container from "./components/Container";

function App() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [contactList, setContactList] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [chatList, setChatList] = useState([]);

  useEffect(() => {
    socketRef.current = io("http://localhost:3000", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Connected to the server!", socket.id);
      setIsConnected(true);
      socket.emit("get-contact-list");
      socket.emit("get-chat-list");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from the server!");
      setIsConnected(false);
    });

    socket.on("contact-list", (contactListReceived) => {
      console.log("Contact list received!");
      setContactList(contactListReceived);
    });
    socket.on("chat-list", (chatListReceived) => {
      console.log("Chat list received!");
      setChatList(chatListReceived);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("contact-list");
      socket.off("chat-list");
      socket.disconnect();
    };
  }, []);
  return (
    <AppContext.Provider
      value={{
        selectedContact,
        setSelectedContact,
        chatList,
        socket: socketRef.current,
      }}
    >
      <Container></Container>
    </AppContext.Provider>
  );
}

export default App;
