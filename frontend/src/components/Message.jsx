// src/components/Message.jsx
import React, { useContext } from "react";
import ImageViewer from "./ImageViewer";
import DocumentMessage from "./DocumentMessage";
import LocationMessage from "./LocationMessage";
import VCardMessage from "./VCardMessage";
import PollMessage from "./PollMessage";
import LinkPreviewMessage from "./LinkPreviewMessage";
import GroupNotificationMessage from "./GroupNotificationMessage";
import UnknownMessage from "./UnknownMessage";
import QuotedMessage from "./QuotedMessage";
import "./Message.css";
import { AppContext } from "../AppContext";

const IMAGE_URL = import.meta.env.VITE_IMAGE_URL;

export default function Message({ msg, contactName, isOwn, allMessages, onQuotedClick }) {
  const { setViewerOpen, setCurrentMedia } = useContext(AppContext);

  const nome = isOwn ? "Você" : msg.contactName;

  const dataHora = msg.timestamp
    ? new Date(msg.timestamp * 1000).toLocaleString([], {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : new Date().toLocaleString([], {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

  const mensagem = msg.body || msg.text || "";

  const getImageUrl = () => {
    return `${IMAGE_URL}/${msg.filePathDir}/${msg.fileName}`;
  };

  const handleMediaClick = (msg) => {
    setCurrentMedia(msg);
    setViewerOpen(true);
  };

  // Ícone de ack (status de entrega/leitura) - só mostra para mensagens próprias
  const getAckIcon = () => {
    if (!isOwn || msg.ack === undefined) return null;
    
    switch (msg.ack) {
      case 0: return <span className="message-ack" title="Erro no envio">❌</span>;
      case 1: return <span className="message-ack" title="Enviada">✓</span>;
      case 2: return <span className="message-ack" title="Entregue">✓✓</span>;
      case 3: return <span className="message-ack message-ack-read" title="Lida">✓✓</span>;
      case 4: return <span className="message-ack message-ack-read" title="Reproduzido">✓✓🔊</span>;
      default: return null;
    }
  };

  // Mensagem respondida (quoted message)
  const quotedMsg = msg.quotedMsg || msg.quotedMessage || msg.reply || null;

  // Tipos não suportados - fallback
  const unsupportedTypes = ["order", "payment", "unknown"];
  if (unsupportedTypes.includes(msg.type)) {
    return (
      <div className="message-system">
        <UnknownMessage msg={msg} />
      </div>
    );
  }

  // Notificações de grupo e sistema
  if (msg.type === "group_notification") {
    return (
      <div className="message-system">
        <GroupNotificationMessage msg={msg} />
      </div>
    );
  }

  // Reações - não renderiza como mensagem separada, apenas embutida
  // (reações são exibidas junto com a mensagem original)
  if (msg.type === "reaction") {
    return null;
  }

  // Agrupa reações por emoji
  const groupedReactions = {};
  if (msg.reactions && msg.reactions.length > 0) {
    msg.reactions.forEach(reaction => {
      const emoji = reaction.reaction || reaction.body || '';
      if (!groupedReactions[emoji]) {
        groupedReactions[emoji] = [];
      }
      // Evita duplicatas pelo ID da reação
      const exists = groupedReactions[emoji].find(r => r.id === reaction.id);
      if (!exists) {
        groupedReactions[emoji].push(reaction);
      }
    });
  }

  return (
    <>
      <div className={`message ${isOwn ? "own" : "other"}`} id={`msg-${msg.id}`}>
        {!isOwn && <div className="message-sender">{nome}</div>}
        <div className="message-bubble">
          {/* Mensagem respondida */}
          {quotedMsg && (
            <QuotedMessage quotedMsg={quotedMsg} isOwn={isOwn} onQuotedClick={onQuotedClick} />
          )}

          {/* Imagem */}
          {msg.hasMedia && msg.type === "image" && (
            <div
              className="message-image"
              onClick={() => handleMediaClick(msg)}
            >
              <img
                src={getImageUrl()}
                alt="Imagem"
                className="clickable-media"
              />
            </div>
          )}

          {/* Sticker */}
          {msg.hasMedia && msg.type === "sticker" && (
            <div className="message-sticker">
              <img
                src={getImageUrl()}
                alt="Sticker"
                className="clickable-media"
              />
            </div>
          )}

          {/* Vídeo */}
          {msg.hasMedia && msg.type === "video" && (
            <div
              className="message-image"
              onClick={() => handleMediaClick(msg)}
            >
              <video
                preload="metadata"
                src={getImageUrl()}
                className="clickable-media"
              />
            </div>
          )}

          {/* Áudio (ptt) */}
          {msg.hasMedia && msg.type === "ptt" && (
            <div className="message-image">
              <audio preload="metadata" controls src={getImageUrl()} />
            </div>
          )}

          {/* Documento */}
          {msg.hasMedia && msg.type === "document" && (
            <DocumentMessage msg={msg} isOwn={isOwn} />
          )}

          {/* Localização */}
          {msg.type === "location" && <LocationMessage msg={msg} />}

          {/* Contato (vCard) */}
          {(msg.type === "vcard" || msg.type === "contact_card") && (
            <VCardMessage msg={msg} />
          )}

          {/* Enquete/Poll */}
          {msg.type === "poll" && <PollMessage msg={msg} isOwn={isOwn} />}

          {/* Preview de Link */}
          {(msg.type === "link" || msg.url || msg.linkPreview) && (
            <LinkPreviewMessage msg={msg} />
          )}

          {/* Mensagem privada criptografada */}
          {msg.type === "e2e_notification" && (
            <div className="message-text">🔒 Mensagem privada 🔒</div>
          )}

          {/* Texto da mensagem */}
          {mensagem && <div className="message-text">{mensagem}</div>}

          {/* Reações */}
          {Object.keys(groupedReactions).length > 0 && (
            <div className="message-reactions-container">
              {Object.entries(groupedReactions).map(([emoji, reactions]) => {
                const isOwnReaction = reactions.some(r => r.fromMe);
                return (
                  <div 
                    key={emoji} 
                    className={`message-reaction-badge ${isOwnReaction ? 'own' : ''}`}
                    title={reactions.map(r => r.senderPushname || r.from).join(', ')}
                  >
                    <span className="reaction-emoji">{emoji}</span>
                    <span className="reaction-count">{reactions.length}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Horário e Ack */}
          <div className="message-time">
            {dataHora}
            {getAckIcon()}
          </div>
        </div>
      </div>
    </>
  );
}
