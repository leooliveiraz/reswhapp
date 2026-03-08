import React from 'react';
import './ContactCard.css';

function ContactCard({ contact, isSelected, lastMessage, onClick }) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
      '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
      '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp.replace(' às ', ' ').replace(/\//g, '-'));
      const now = new Date();
      const diff = now - date;
      
      if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString('pt-BR', { weekday: 'short' });
      }
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div 
      className={`contact-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div 
        className="contact-avatar"
        style={{ backgroundColor: getAvatarColor(contact.name || contact.shortName || contact.number || 'Contato') }}
      >
        {getInitials(contact.name || contact.shortName || contact.number || '?')}
      </div>
      
      <div className="contact-info">
        <div className="contact-header">
          <div className="contact-name">
            {contact.name || contact.shortName || contact.number || 'Sem nome'}
            {contact.isBusiness && <span className="business-badge">💼</span>}
            {contact.fromMessage && (
              <span className="new-contact-badge" title="Contato criado automaticamente">🆕</span>
            )}
          </div>
          {lastMessage && (
            <div className="message-time">
              {formatLastMessageTime(lastMessage.timestamp)}
            </div>
          )}
        </div>
        
        <div className="contact-last-message">
          {lastMessage ? (
            <>
              {lastMessage.fromMe && <span className="message-from-me">Você: </span>}
              <span className="message-preview">
                {lastMessage.text?.length > 30 
                  ? `${lastMessage.text.substring(0, 30)}...` 
                  : lastMessage.text}
              </span>
            </>
          ) : (
            <span className="no-messages">Nenhuma mensagem ainda</span>
          )}
        </div>
      </div>

      {isSelected && (
        <div className="selected-indicator">✓</div>
      )}
    </div>
  );
}

export default ContactCard;