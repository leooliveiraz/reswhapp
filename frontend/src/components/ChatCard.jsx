import React, { useContext } from "react";
import { AppContext } from "../AppContext";
import "./ChatCard.css";

export default function ChatCard({ chatData }) {
  const { setSelectedContact } = useContext(AppContext);

  const contactName = chatData.name || "Desconhecido";

  const lastMessage = chatData.lastMessage || null;

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    }
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
  };

  const truncateMessage = (text, maxLength = 40) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getMessagePreview = () => {
    if (!lastMessage) return "Nenhuma mensagem";

    switch (lastMessage.type) {
      case "image":
        return "📸 Foto";
      case "document":
        return "📎 Documento";
      case "audio":
        return "🎵 Áudio";
      case "video":
        return "🎥 Vídeo";
      case "ptt":
        return "🎤 Áudio";
      case "location":
        return "📍 Localização";
      case "contact":
        return "👤 Contato";
      case "sticker":
        return "🎨 Figurinha";
      default:
        return truncateMessage(lastMessage.body);
    }
  };

  return (
    <div className="chat-card" onClick={() => setSelectedContact(chatData)}>
      <div className="chat-card-avatar">{contactName.charAt(0)}</div>

      <div className="chat-card-info">
        <div className="chat-card-header">
          <span className="chat-card-name">{contactName}</span>
          <span className="chat-card-time">
            {formatTime(lastMessage?.timestamp)}
          </span>
        </div>

        <div className="chat-card-message">
          <span className="message-preview">{getMessagePreview()}</span>
          {chatData.unreadCount > 0 && (
            <span className="unread-badge">{chatData.unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}
