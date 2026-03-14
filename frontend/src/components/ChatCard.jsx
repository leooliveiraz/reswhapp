import React, { useContext } from "react";
import { AppContext } from "../AppContext";
import "./ChatCard.css";

export default function ChatCard({ chatData }) {
  const { setSelectedContact, chatList, setChatList } = useContext(AppContext);

  const contactName = chatData.name || "Desconhecido";
  const lastMessage = chatData.lastMessage || null;
  const isSelected = false; // Sua lógica de seleção

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    }
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  const getMessagePreview = () => {
    if (!lastMessage) return "Nenhuma mensagem";
    
    switch(lastMessage.type) {
      case "image": return "📸 Foto";
      case "document": return "📎 Documento";
      case "audio": return "🎵 Áudio";
      case "video": return "🎥 Vídeo";
      case "ptt": return "🎤 Áudio";
      default: return lastMessage.body || "Mensagem";
    }
  };

  const handleClick = () => {
    // 1. Seleciona o contato
    setSelectedContact(chatData);
    
    // 2. Zera o contador de mensagens não lidas
    setChatList(prevChatList => 
      prevChatList.map(chat => 
        chat.id._serialized === chatData.id._serialized 
          ? { ...chat, unreadCount: 0 } 
          : chat
      )
    );

    // 3. Opcional: avisar o servidor que as mensagens foram lidas
    // socket.emit("mark-as-read", chatData.id._serialized);
  };

  return (
    <div 
      className={`chat-card ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <div className="chat-card-avatar">
        {contactName.charAt(0)}
      </div>
      
      <div className="chat-card-info">
        <div className="chat-card-header">
          <span className="chat-card-name">
            {contactName}
          </span>
          <span className="chat-card-time">
            {formatTime(lastMessage?.timestamp)}
          </span>
        </div>
        
        <div className="chat-card-message">
          <span className={`message-preview ${chatData.unreadCount > 0 ? 'unread' : ''}`}>
            {getMessagePreview()}
          </span>
          {chatData.unreadCount > 0 && (
            <span className="unread-badge">{chatData.unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}