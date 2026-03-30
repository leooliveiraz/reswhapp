// src/components/Chat.jsx
import React, { useContext, useEffect, useState, useRef } from "react";
import { AppContext } from "../AppContext";
import ChatHeader from "./ChatHeader";
import Message from "./Message";
import "./Chat.css";

export default function Chat() {
  const { socket, selectedContact } = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const scrollToMessage = (messageId) => {
    // Remove destaque anterior
    document.querySelectorAll('.message-highlighted').forEach(el => {
      el.classList.remove('message-highlighted');
    });

    // Tenta encontrar a mensagem no DOM
    const messageElement = document.getElementById(`msg-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      messageElement.classList.add('message-highlighted');
      
      // Remove o destaque após 2 segundos
      setTimeout(() => {
        messageElement.classList.remove('message-highlighted');
      }, 2000);
    } else {
      // Mensagem não encontrada, pode estar fora do limite carregado
      console.log('Mensagem original não encontrada na lista atual');
    }
  };

  const handleQuotedClick = (quotedMessageId) => {
    scrollToMessage(quotedMessageId);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!selectedContact || !socket) return;

    socket.emit("get-message-historic", {
      contactId: selectedContact.id._serialized,
      limit: 500,
    });

    const handleLastMessages = (lastMessages) => {
      setMessages(lastMessages.messages || []);
      scrollToBottom();
    };

    socket.on("last-messages", handleLastMessages);

    const handleNewMessage = (newMessage) => {
      if (selectedContact.id._serialized === newMessage.chatId) {
        setMessages((prev) => [newMessage, ...prev]);
      }
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("last-messages", handleLastMessages);
      socket.off("new-message", handleNewMessage);
    };
  }, [selectedContact, socket]);

  return (
    <>
      <ChatHeader
        nome={selectedContact?.name}
        numero={selectedContact?.id?.user}
      />
      <div className="chat-messages" ref={messagesContainerRef}>
        {messages.map((msg) => (
          <Message
            key={msg.id}
            msg={msg}
            contactName={selectedContact?.name}
            isOwn={msg.isMe}
            onQuotedClick={handleQuotedClick}
          />
        ))}
        <div ref={messagesEndRef} className="chat-messages" />
      </div>
    </>
  );
}
