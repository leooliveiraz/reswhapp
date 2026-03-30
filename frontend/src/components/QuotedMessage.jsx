import React from "react";
import "./QuotedMessage.css";

export default function QuotedMessage({ quotedMsg, isOwn, onQuotedClick }) {
  if (!quotedMsg) return null;

  // Usa fromMe ou isMe (ambos podem vir do backend)
  const isQuotedFromMe = quotedMsg.fromMe || quotedMsg.isMe || false;
  const nome = isQuotedFromMe ? "Você" : quotedMsg.contactName || "Contato";
  const mensagem = quotedMsg.body || "";
  const tipo = quotedMsg.type;

  // Ícone baseado no tipo de mensagem
  const getTypeIcon = () => {
    switch (tipo) {
      case "image": return "📷";
      case "video": return "🎥";
      case "audio":
      case "ptt": return "🎤";
      case "document": return "📎";
      case "sticker": return "🖼️";
      case "location": return "📍";
      case "vcard":
      case "contact_card": return "👤";
      case "poll": return "📊";
      default: return "";
    }
  };

  const icon = getTypeIcon();

  const handleClick = () => {
    if (onQuotedClick && quotedMsg.id) {
      onQuotedClick(quotedMsg.id);
    }
  };

  return (
    <div 
      className={`quoted-message ${isQuotedFromMe ? "own" : "other"}`}
      onClick={handleClick}
      title="Clique para ver a mensagem original"
    >
      <div className="quoted-border" />
      <div className="quoted-content">
        <span className="quoted-sender">{nome}</span>
        <div className="quoted-body">
          {icon && <span className="quoted-icon">{icon}</span>}
          <span className="quoted-text">{mensagem}</span>
        </div>
      </div>
    </div>
  );
}
