import React, { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';

function ChatWindow({ contact, socket, messages = [], onSendMessage, onClose, loading = false }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 🔥 FUNÇÃO CORRIGIDA: Ordenar mensagens corretamente
  const getSortedMessages = () => {
    return [...messages].sort((a, b) => {
      // Converter timestamps para Date
      const dateA = parseTimestamp(a);
      const dateB = parseTimestamp(b);
      
      // Ordem crescente (mais antiga primeiro)
      return dateA - dateB;
    });
  };

  // Função auxiliar para parse de timestamp
  const parseTimestamp = (msg) => {
    if (msg.timestamp) {
      if (typeof msg.timestamp === 'number') {
        return new Date(msg.timestamp * 1000);
      }
      if (typeof msg.timestamp === 'string') {
        // Formato: "08/03/2026, 17:54:32"
        const [datePart, timePart] = msg.timestamp.split(', ');
        const [day, month, year] = datePart.split('/');
        const [hour, minute, second] = timePart.split(':');
        return new Date(year, month - 1, day, hour, minute, second);
      }
    }
    if (msg.dateTime) {
      const [datePart, timePart] = msg.dateTime.split(', ');
      const [day, month, year] = datePart.split('/');
      const [hour, minute, second] = timePart.split(':');
      return new Date(year, month - 1, day, hour, minute, second);
    }
    return new Date(0);
  };

  const formatMessageTime = (timestamp) => {
    try {
      if (typeof timestamp === 'number') {
        return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      if (typeof timestamp === 'string') {
        const [, timePart] = timestamp.split(', ');
        return timePart;
      }
      return '';
    } catch (e) {
      return '';
    }
  };

  const formatMessageDate = (timestamp) => {
    try {
      let date;
      if (typeof timestamp === 'number') {
        date = new Date(timestamp * 1000);
      } else if (typeof timestamp === 'string') {
        const [datePart] = timestamp.split(', ');
        const [day, month, year] = datePart.split('/');
        date = new Date(year, month - 1, day);
      } else {
        return '';
      }

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Hoje';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem';
      } else {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      }
    } catch (e) {
      return '';
    }
  };

  // Agrupar mensagens por data usando as mensagens ordenadas
  const groupMessagesByDate = () => {
    const sortedMessages = getSortedMessages();
    const groups = {};
    
    sortedMessages.forEach(msg => {
      const date = formatMessageDate(msg.timestamp || msg.dateTime);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button className="back-button" onClick={onClose}>
          ←
        </button>
        
        <div className="chat-header-info">
          <div className="chat-avatar">
            {(contact.name || contact.shortName || contact.pushname || contact.number || '?')[0]}
          </div>
          <div>
            <h3>{contact.name || contact.shortName || contact.pushname || contact.number}</h3>
            <p>{contact.number}</p>
          </div>
        </div>
      </div>

      <div className="messages-area">
        {loading ? (
          <div className="loading-messages">
            <div className="spinner"></div>
            <p>Carregando mensagens...</p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date} className="message-group">
              <div className="message-date-divider">
                <span>{date}</span>
              </div>
              {msgs.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`message ${msg.isMe || msg.fromMe ? 'sent' : 'received'}`}
                >
                  <div className="message-bubble">
                    <p>{msg.body || msg.text}</p>
                    <span className="message-time">
                      {formatMessageTime(msg.timestamp || msg.dateTime)}
                      {msg.isMe && msg.ack === 3 && (
                        <span className="message-read">✓✓</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={(data) => {console.log(data)}} className="message-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite uma mensagem"
          className="message-input"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()}
          className="send-button"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;