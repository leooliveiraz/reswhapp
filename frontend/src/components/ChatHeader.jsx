import React, { useContext } from "react";
import "./ChatHeader.css";
import { AppContext } from "../AppContext";

export default function ChatHeader({ nome, numero }) {
  const { setSelectedContact } = useContext(AppContext);

  const handleBack = () => {
    setSelectedContact(null);
  };

  return (
    <div className="chat-header">
      <button className="back-button" onClick={handleBack} title="Voltar">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path
            fill="currentColor"
            d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
          />
        </svg>
      </button>
      <div className="contact-info">
        <h3>{nome}</h3>
        <span>{numero}</span>
      </div>
    </div>
  );
}
