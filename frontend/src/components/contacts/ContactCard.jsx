import React from 'react';
import './ContactCard.css';

function ContactCard({ contact, isSelected, onClick }) {
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

  return (
    <div 
      className={`contact-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div 
        className="contact-avatar"
        style={{ backgroundColor: getAvatarColor(contact.name || contact.shortName || 'Contato') }}
      >
        {getInitials(contact.name || contact.shortName || '?')}
      </div>
      
      <div className="contact-info">
        <div className="contact-name">
          {contact.name || contact.shortName || 'Sem nome'}
          {contact.isBusiness && <span className="business-badge">💼</span>}
        </div>
        <div className="contact-number">
          {contact.number}
        </div>
      </div>

      {isSelected && (
        <div className="selected-indicator">✓</div>
      )}
    </div>
  );
}

export default ContactCard;