import React, { useState } from 'react';
import ContactCard from '../contactCard/ContactCard';
import './ContactList.css';

function ContactList({ contacts, selectedContact, onSelectContact, lastMessages }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    const name = (contact.name || contact.shortName || contact.number || '').toLowerCase();
    return name.includes(searchLower) || contact.number?.includes(searchTerm);
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
          filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id?._serialized || contact.number || contact.id?.user}
              contact={contact}
              isSelected={selectedContact?.id?._serialized === contact.id?._serialized}
              lastMessage={lastMessages[contact.id?._serialized || contact.number || contact.id?.user]}
              onClick={() => onSelectContact(contact)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ContactList;