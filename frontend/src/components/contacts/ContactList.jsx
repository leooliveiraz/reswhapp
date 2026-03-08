import React, { useState } from 'react';
import ContactCard from './ContactCard';
import './ContactList.css';

function ContactList({ contacts, selectedContact, onSelectContact }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.shortName?.toLowerCase().includes(searchLower) ||
      contact.number?.includes(searchTerm)
    );
  });

  return (
    <div className="contact-list-container">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Pesquisar ou começar uma nova conversa"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>

      <div className="contacts-list">
        {filteredContacts.length === 0 ? (
          <div className="no-contacts">
            <p>Nenhum contato encontrado</p>
          </div>
        ) : (
          filteredContacts.map((contact, index) => (
            <ContactCard
              key={contact.id?._serialized || contact.number || index}
              contact={contact}
              isSelected={selectedContact?.id?._serialized === contact.id?._serialized}
              onClick={() => onSelectContact(contact)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ContactList;