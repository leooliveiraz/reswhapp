import React from 'react';
import './Message.css';

export default function Message({ msg, contactName, isOwn }) {
    const nome = isOwn ? 'Você' : contactName;
    const horario = msg.timestamp 
        ? new Date(msg.timestamp).toLocaleTimeString() 
        : new Date().toLocaleTimeString();
    const mensagem = msg.body || msg.text || '';

    return (
        <div className={`message ${isOwn ? 'own' : 'other'}`}>
            {!isOwn && <div className="message-sender">{nome}</div>}
            <div className="message-bubble">
                <div className="message-text">{mensagem}</div>
                <div className="message-time">{horario}</div>
            </div>
        </div>
    );
}