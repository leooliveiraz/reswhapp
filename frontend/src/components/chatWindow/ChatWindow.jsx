import React, { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';

function ChatWindow({ contact, socket, messages = [], onSendMessage, onClose }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(contact, newMessage);
      setNewMessage('');
    }
  };

  const formatMessageTime = (timestamp) => {
    try {
      const date = new Date(timestamp.replace(' às ', ' ').replace('/', '-').replace('/', '-'));
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button className="back-button" onClick={onClose}>
          ←
        </button>

        <div className="chat-header-info">
          <div className="chat-avatar">
            {(contact.name || contact.shortName || contact.number || '?')[0]}
          </div>
          <div>
            <h3>{contact.name || contact.shortName || contact.number}</h3>
            <p>{contact.number}</p>
          </div>
        </div>
      </div>

      <div className="messages-area">
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`message ${msg.fromMe || msg.isMe ? 'sent' : 'received'}`}
          >
            <div className="message-bubble">
              <p>{msg.body || msg.text}</p>
              <span className="message-time">
                {formatMessageTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite uma mensagem"
          className="message-input"
          disabled={true}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || true}
          className="send-button"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;