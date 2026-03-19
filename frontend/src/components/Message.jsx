// src/components/Message.jsx
import React, { useState } from "react";
import ImageViewer from "./ImageViewer";
import "./Message.css";

const IMAGE_URL = import.meta.env.VITE_IMAGE_URL || 'http://localhost:3000/images';

export default function Message({ msg, contactName, isOwn, allMessages }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const nome = isOwn ? "Você" : msg.contactName;
  
  // Filtra apenas mensagens com mídia do mesmo contato
  const mediaMessages = allMessages?.filter(m => 
    m.hasMedia && 
    (m.type === 'image' || m.type === 'video' || m.type === 'sticker' || m.type === 'ptt') &&
    m.chatId === msg.chatId
  ) || [];
  
  const dataHora = msg.timestamp 
    ? new Date(msg.timestamp * 1000).toLocaleString([], { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit' 
      })
    : new Date().toLocaleString([], { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit' 
      });
  
  const mensagem = msg.body || msg.text || "";
  
  const getImageUrl = () => {
    return `${IMAGE_URL}/${msg.filePathDir}/${msg.fileName}`;
  };

  const handleMediaClick = () => {
    if (msg.hasMedia) {
      const index = mediaMessages.findIndex(m => m.id === msg.id);
      setCurrentImageIndex(index >= 0 ? index : 0);
      setViewerOpen(true);
    }
  };

  const handleNext = () => {
    if (currentImageIndex < mediaMessages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  const currentMedia = mediaMessages[currentImageIndex];

  return (
    <>
      <div className={`message ${isOwn ? "own" : "other"}`}>
        {!isOwn && <div className="message-sender">{nome}</div>}
        <div className="message-bubble">
          {msg.hasMedia && msg.type === "image" && (
            <div className="message-image" onClick={handleMediaClick}>
              <img
                src={getImageUrl()}
                alt="Imagem"
                className="clickable-media"
              />
            </div>
          )}
          {msg.hasMedia && msg.type === "sticker" && (
            <div className="message-sticker" onClick={handleMediaClick}>
              <img
                src={getImageUrl()}
                alt="Sticker"
                className="clickable-media"
              />
            </div>
          )}
          {msg.hasMedia && msg.type === "video" && (
            <div className="message-image" onClick={handleMediaClick}>
              <video 
                preload="metadata"
                src={getImageUrl()}
                className="clickable-media"
              />
            </div>
          )}
          {msg.hasMedia && msg.type === "ptt" && (
            <div className="message-image">
              <audio 
                preload="metadata"
                controls
                src={getImageUrl()}
              />
            </div>
          )}

          {msg.type === "e2e_notification" && (
            <div className="message-text">
              🔒 Mensagem privada 🔒
            </div>
          )}
          <div className="message-text">{mensagem}</div>
          <div className="message-time">{dataHora}</div>
        </div>
      </div>

      {viewerOpen && currentMedia && (
        <ImageViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          imageUrl={`${IMAGE_URL}/${currentMedia.filePathDir}/${currentMedia.fileName}`}
          message={currentMedia}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasNext={currentImageIndex < mediaMessages.length - 1}
          hasPrevious={currentImageIndex > 0}
        />
      )}
    </>
  );
}