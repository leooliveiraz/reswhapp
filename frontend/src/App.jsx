import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";
import { AppContext } from "./AppContext";
import Container from "./components/Container";
import ImageViewer from "./components/ImageViewer";

const WS_URL = import.meta.env.VITE_SOCKET_URL;
const IMAGE_URL = import.meta.env.VITE_IMAGE_URL;

console.log(WS_URL,IMAGE_URL)
function App() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [contactList, setContactList] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState(null);

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);

    setChatList((prevChatList) =>
      prevChatList.map((chat) =>
        chat.id._serialized === contact.id._serialized
          ? { ...chat, unreadCount: 0 }
          : chat,
      ),
    );
  };

  useEffect(() => {
    setViewerOpen(currentMedia ? true : false);
  }, [currentMedia]);

  useEffect(() => {
    const socketUrl = WS_URL ;
    socketRef.current = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true
    });
    
    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("✅ Connected to the server!", socket.id);
      setIsConnected(true);
      setTimeout(() => {
        socket.emit("get-contact-list");
        socket.emit("get-chat-list");
      }, 500);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error.message);
      setIsConnected(false);
      
      if (error.message.includes('websocket')) {
        console.log("🔄 Tentando com polling...");
        socket.io.opts.transports = ['polling'];
        socket.connect();
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Disconnected:", reason);
      setIsConnected(false);
      
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on("contact-list", (contactListReceived) => {
      console.log("📞 Contact list:", contactListReceived?.length || 0);
      setContactList(contactListReceived || []);
    });

    socket.on("chat-list", (chatListReceived) => {
      console.log("💬 Chat list:", chatListReceived?.length || 0);
      setChatList(chatListReceived || []);
    });

    socket.on("new-message", (newMessage) => {
      console.log("📨 Nova mensagem:", newMessage?.from);

      if (!newMessage) return;

      setChatList((prevChatList) => {
        const index = prevChatList.findIndex(
          (chat) => chat.id?._serialized === newMessage.chatId,
        );

        if (index === -1) return prevChatList;

        const updatedList = [...prevChatList];
        updatedList[index] = {
          ...updatedList[index],
          lastMessage: newMessage,
          timestamp: newMessage.timestamp || Date.now(),
          unreadCount: (updatedList[index].unreadCount || 0) + 1,
        };

        const [movedChat] = updatedList.splice(index, 1);
        updatedList.unshift(movedChat);

        return updatedList;
      });
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("contact-list");
      socket.off("chat-list");
      socket.off("new-message");
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        selectedContact,
        setSelectedContact: handleSelectContact,
        chatList,
        setChatList,
        socket: socketRef.current,
        viewerOpen,
        setViewerOpen,
        setCurrentMedia,
        isConnected,
      }}
    >
      <Container></Container>

      {viewerOpen && currentMedia && (
        <ImageViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          imageUrl={`${IMAGE_URL}/${currentMedia.filePathDir}/${currentMedia.fileName}`}
          message={currentMedia}
        />
      )}
    </AppContext.Provider>
  );
}

export default App;