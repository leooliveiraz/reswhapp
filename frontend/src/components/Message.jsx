// src/components/Message.jsx
import React, { useContext } from "react";
import ImageViewer from "./ImageViewer";
import DocumentMessage from "./DocumentMessage";
import LocationMessage from "./LocationMessage";
import VCardMessage from "./VCardMessage";
import ReactionMessage from "./ReactionMessage";
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

  // Reações
  if (msg.type === "reaction") {
    return (
      <div className="message-reaction-wrapper">
        <ReactionMessage msg={msg} allMessages={allMessages} />
      </div>
    );
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

          {/* Horário */}
          <div className="message-time">{dataHora}</div>
        </div>
      </div>
    </>
  );
}
