// src/components/Message.jsx
import React, { useContext, useState } from "react";
import ImageViewer from "./ImageViewer";
import "./Message.css";
import { AppContext } from "../AppContext";

const IMAGE_URL = import.meta.env.VITE_IMAGE_URL;

export default function Message({ msg, contactName, isOwn, allMessages }) {
  const { setViewerOpen, setCurrentMedia } = useContext(AppContext);

  const nome = isOwn ? "Você" : msg.contactName;

  // Filtra apenas mensagens com mídia do mesmo contato

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
    setCurrentMedia(msg),
    setViewerOpen(true)
  }

  return (
    <>
      <div className={`message ${isOwn ? "own" : "other"}`}>
        {!isOwn && <div className="message-sender">{nome}</div>}
        <div className="message-bubble">
          {msg.hasMedia && msg.type === "image" && (
            <div className="message-image" onClick={() => handleMediaClick(msg)}>
              <img
                src={getImageUrl()}
                alt="Imagem"
                className="clickable-media"
              />
            </div>
          )}
          {msg.hasMedia && msg.type === "sticker" && (
            <div className="message-sticker">
              <img
                src={getImageUrl()}
                alt="Sticker"
                className="clickable-media"
              />
            </div>
          )}
          {msg.hasMedia && msg.type === "video" && (
            <div className="message-image" onClick={() => handleMediaClick(msg)}>
              <video
                preload="metadata"
                src={getImageUrl()}
                className="clickable-media"
              />
            </div>
          )}
          {msg.hasMedia && msg.type === "ptt" && (
            <div className="message-image">
              <audio preload="metadata" controls src={getImageUrl()} />
            </div>
          )}

          {msg.type === "e2e_notification" && (
            <div className="message-text">🔒 Mensagem privada 🔒</div>
          )}
          <div className="message-text">{mensagem}</div>
          <div className="message-time">{dataHora}</div>
        </div>
      </div>
    </>
  );
}
