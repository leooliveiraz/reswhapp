import React, { useState } from 'react';
import ContactCard from './ContactCard';
import ContactDetails from './ContactDetails';

function ContactList({ contacts }) {
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, business, mycontacts

  // Filtrar contatos baseado na busca e tipo
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      (contact.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.shortName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.number?.includes(searchTerm));
    
    const matchesFilter = 
      filterType === 'all' ? true :
      filterType === 'business' ? contact.isBusiness :
      filterType === 'mycontacts' ? contact.isMyContact : true;
    
    return matchesSearch && matchesFilter;
  });

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    setShowDetails(true);
  };

  const handleAction = (action, contact) => {
    console.log(`Ação ${action} para:`, contact);
    // Aqui você implementa a lógica real
    alert(`Ação ${action} para ${contact.name || contact.shortName}`);
    setShowDetails(false);
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>📱 Contatos ({filteredContacts.length})</h1>
        
        {/* Barra de busca */}
        <div style={searchContainerStyle}>
          <input
            type="text"
            placeholder="Buscar contato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyle}
          />
          <span style={searchIconStyle}>🔍</span>
        </div>

        {/* Filtros */}
        <div style={filtersStyle}>
          <FilterButton 
            active={filterType === 'all'}
            onClick={() => setFilterType('all')}
          >
            Todos
          </FilterButton>
          <FilterButton 
            active={filterType === 'business'}
            onClick={() => setFilterType('business')}
          >
            💼 Empresas
          </FilterButton>
          <FilterButton 
            active={filterType === 'mycontacts'}
            onClick={() => setFilterType('mycontacts')}
          >
            ✓ Meus Contatos
          </FilterButton>
        </div>
      </div>

      {/* Lista de contatos */}
      <div style={listContainerStyle}>
        {filteredContacts.length === 0 ? (
          <div style={emptyStyle}>
            <p>Nenhum contato encontrado</p>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')}>
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          filteredContacts.map((contact, index) => (
            <ContactCard
              key={contact.id?._serialized || contact.number || index}
              contact={contact}
              isSelected={selectedContact?.id?._serialized === contact.id?._serialized}
              onClick={handleContactClick}
            />
          ))
        )}
      </div>

      {/* Modal de detalhes */}
      {showDetails && (
        <ContactDetails
          contact={selectedContact}
          onClose={() => setShowDetails(false)}
          onAction={handleAction}
        />
      )}

      {/* Overlay quando modal está aberto */}
      {showDetails && (
        <div 
          style={overlayStyle}
          onClick={() => setShowDetails(false)}
        />
      )}
    </div>
  );
}

// Componente FilterButton
const FilterButton = ({ children, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      backgroundColor: active ? '#2196f3' : '#f0f0f0',
      color: active ? 'white' : '#333',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: active ? 500 : 400,
      transition: 'all 0.2s'
    }}
  >
    {children}
  </button>
);

// Estilos
const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
  fontFamily: 'Arial, sans-serif'
};

const headerStyle = {
  marginBottom: '24px'
};

const titleStyle = {
  fontSize: '24px',
  color: '#333',
  marginBottom: '16px'
};

const searchContainerStyle = {
  position: 'relative',
  marginBottom: '16px'
};

const searchInputStyle = {
  width: '100%',
  padding: '12px 40px 12px 16px',
  border: '2px solid #e0e0e0',
  borderRadius: '24px',
  fontSize: '16px',
  outline: 'none',
  transition: 'border-color 0.2s',
  ':focus': {
    borderColor: '#2196f3'
  }
};

const searchIconStyle = {
  position: 'absolute',
  right: '16px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#999'
};

const filtersStyle = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap'
};

const listContainerStyle = {
  maxHeight: '70vh',
  overflowY: 'auto',
  padding: '4px'
};

const emptyStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#999',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px'
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  zIndex: 999
};

export default ContactList;