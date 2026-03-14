import React from "react";
import "./ChatHeader.css";

export default function ChatHeader({ nome, numero }) {
  return (
    <div className="chat-header">
      <div className="contact-info">
        <h3>{nome}</h3>
        <span>{numero}</span>
      </div>
    </div>
  );
}
