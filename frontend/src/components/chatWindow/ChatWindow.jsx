import React, { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';

function ChatWindow({ contact, socket, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (contact && socket) {
      // Solicitar histórico de mensagens
      socket.emit('get-chat-history', { 
        contactId: contact.id?._serialized || contact.number 
      });

      socket.on('chat-history', (history) => {
        setMessages(history);
      });

      socket.on('new-message', (message) => {
        if (message.from === contact.id?._serialized || 
            message.to === contact.id?._serialized) {
          setMessages(prev => [...prev, message]);
        }
      });

      return () => {
        socket.off('chat-history');
        socket.off('new-message');
      };
    }
  }, [contact, socket]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      const messageData = {
        to: contact.id?._serialized || contact.number,
        text: newMessage,
        timestamp: new Date().toISOString(),
        fromMe: true
      };

      socket.emit('send-message', messageData);
      
      setMessages(prev => [...prev, { 
        ...messageData, 
        id: Date.now() 
      }]);
      
      setNewMessage('');
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
            {(contact.name || contact.shortName || '?')[0]}
          </div>
          <div>
            <h3>{contact.name || contact.shortName}</h3>
            <p>{contact.number}</p>
          </div>
        </div>
      </div>

      <div className="messages-area">
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`message ${msg.fromMe ? 'sent' : 'received'}`}
          >
            <div className="message-bubble">
              <p>{msg.text}</p>
              <span className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
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