import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../AppContext";
import ChatHeader from "./ChatHeader";
import Message from "./Message";
import "./Chat.css";

export default function Chat() {
  const { socket, selectedContact } = useContext(AppContext);
  const [messages, setMessages] = useState([]);

  // Carrega mensagens quando seleciona um contato
  useEffect(() => {
    if (!selectedContact || !socket) return;

    // Pede as mensagens antigas
    socket.emit("get-last-messages", {
      contactId: selectedContact.id._serialized,
      limit: 20,
    });

    // Escuta as mensagens antigas
    const handleLastMessages = (lastMessages) => {
      setMessages(lastMessages.messages || []);
    };

    socket.on("last-messages", handleLastMessages);

    // Escuta mensagens novas (enquanto esse chat estiver aberto)
    const handleNewMessage = (newMessage) => {
      // Se for do chat atual, adiciona no INÍCIO da lista
      if (selectedContact.id._serialized === newMessage.chatId) {
        setMessages((prev) => [newMessage, ...prev]); // unshift
      }
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("last-messages", handleLastMessages);
      socket.off("new-message", handleNewMessage);
    };
  }, [selectedContact, socket]);

  return (
    <div className="chat-container">
      <ChatHeader
        nome={selectedContact?.name}
        numero={selectedContact?.id?.user}
      />
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <Message
            key={index}
            msg={msg}
            contactName={selectedContact?.name}
            isOwn={msg.fromMe}
          />
        ))}
      </div>
    </div>
  );
}
