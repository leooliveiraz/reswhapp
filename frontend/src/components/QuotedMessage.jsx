import React from "react";
import "./QuotedMessage.css";

export default function QuotedMessage({ quotedMsg, isOwn }) {
  if (!quotedMsg) return null;

  const nome = quotedMsg.isMe ? "Você" : quotedMsg.contactName || "Contato";
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

  return (
    <div className={`quoted-message ${isOwn ? "own" : "other"}`}>
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
