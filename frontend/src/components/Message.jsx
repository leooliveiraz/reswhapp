import React from "react";
import "./Message.css";

export default function Message({ msg, contactName, isOwn }) {
  const nome = isOwn ? "Você" : contactName;
  const horario = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString()
    : new Date().toLocaleTimeString();
  const mensagem = msg.body || msg.text || "";

  return (
    <div className={`message ${isOwn ? "own" : "other"}`}>
      {!isOwn && <div className="message-sender">{nome}</div>}
      <div className="message-bubble">
        {msg.hasMedia && msg.type === "image" && (
          <div className="message-image">
            <img
              src={`http://localhost:3000/images/${msg.filePathDir}/${msg.fileName}`}
            />
          </div>
        )}
        {msg.hasMedia && msg.type === "sticker" && (
          <div className="message-sticker">
            <img
              src={`http://localhost:3000/images/${msg.filePathDir}/${msg.fileName}`}
            />
          </div>
        )}
        {msg.hasMedia && msg.type === "video" && msg.isGif && (
          <div className="message-image">
            <video 
              preload="metadata"
              autoPlay
              controls
              src={`http://localhost:3000/images/${msg.filePathDir}/${msg.fileName}`}
            />
          </div>
        )}
        {msg.hasMedia && msg.type === "video" && !msg.isGif && (
          <div className="message-image">
            <video 
              preload="metadata"
              autoPlay
              controls
              src={`http://localhost:3000/images/${msg.filePathDir}/${msg.fileName}`}
            />
          </div>
        )}


        {msg.hasMedia && msg.type === "ptt" && (
          <div className="message-image">
            <audio 
              preload="metadata"
              controls
              src={`http://localhost:3000/images/${msg.filePathDir}/${msg.fileName}`}
            />
          </div>
        )}
        <div className="message-text">{mensagem}</div>
        <div className="message-time">{horario}</div>
      </div>
    </div>
  );
}
