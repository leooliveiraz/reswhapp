import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../AppContext";
import ChatHeader from "./ChatHeader";
import Message from "./Message";
import "./Chat.css";

export default function Chat() {
  const { socket, selectedContact } = useContext(AppContext);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!selectedContact || !socket) return;

    socket.emit("get-last-messages", {
      contactId: selectedContact.id._serialized,
      limit: 20,
    });

    const handleLastMessages = (lastMessages) => {
      setMessages(lastMessages.messages || []);
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
    <div className="chat-container">
      <ChatHeader
        nome={selectedContact?.name}
        numero={selectedContact?.id?.user}
      />
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <Message
            key={msg.id}
            msg={msg}
            contactName={selectedContact?.name}
            isOwn={msg.isMe}
          />
        ))}
      </div>
    </div>
  );
}
