import React from 'react';

function ContactDetails({ contact, onClose, onAction }) {
  if (!contact) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      maxWidth: '400px',
      width: '90%',
      zIndex: 1000
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid #e0e0e0',
        paddingBottom: '12px'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
          Detalhes do Contato
        </h2>
        <button 
          onClick={onClose}
          style={closeButtonStyle}
        >
          ✕
        </button>
      </div>

      {/* Informações detalhadas */}
      <div style={{ marginBottom: '24px' }}>
        <InfoRow label="Nome" value={contact.name || contact.shortName || 'Não informado'} />
        <InfoRow label="Número" value={contact.number} />
        <InfoRow label="ID" value={contact.id?._serialized || contact.id?.user} />
        <InfoRow label="Tipo" value={contact.type} />
        
        {/* Status booleanos */}
        <div style={infoGridStyle}>
          <StatusBadge condition={contact.isBusiness} text="Empresa" emoji="💼" />
          <StatusBadge condition={contact.isBlocked} text="Bloqueado" emoji="🚫" />
          <StatusBadge condition={contact.isMyContact} text="Meu contato" emoji="✓" />
          <StatusBadge condition={contact.isWAContact} text="WhatsApp" emoji="📱" />
          <StatusBadge condition={contact.isUser} text="Usuário" emoji="👤" />
          <StatusBadge condition={contact.isGroup} text="Grupo" emoji="👥" />
          <StatusBadge condition={contact.isEnterprise} text="Enterprise" emoji="🏢" />
          <StatusBadge condition={contact.statusMute} text="Silenciado" emoji="🔇" />
        </div>
      </div>

      {/* Ações */}
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        borderTop: '1px solid #e0e0e0',
        paddingTop: '20px'
      }}>
        <ActionButton 
          onClick={() => onAction('message', contact)}
          color="#4CAF50"
        >
          💬 Mensagem
        </ActionButton>
        <ActionButton 
          onClick={() => onAction('call', contact)}
          color="#2196F3"
        >
          📞 Ligar
        </ActionButton>
        <ActionButton 
          onClick={() => onAction('block', contact)}
          color="#F44336"
        >
          🚫 Bloquear
        </ActionButton>
      </div>
    </div>
  );
}

// Componentes auxiliares
const InfoRow = ({ label, value }) => (
  <div style={{
    display: 'flex',
    marginBottom: '12px',
    borderBottom: '1px dashed #f0f0f0',
    paddingBottom: '8px'
  }}>
    <span style={{ width: '100px', color: '#666', fontWeight: 500 }}>{label}:</span>
    <span style={{ color: '#333', wordBreak: 'break-all' }}>{value || '—'}</span>
  </div>
);

const StatusBadge = ({ condition, text, emoji }) => {
  if (!condition) return null;
  
  return (
    <div style={{
      backgroundColor: '#f5f5f5',
      padding: '4px 8px',
      borderRadius: '16px',
      fontSize: '13px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      <span>{emoji}</span>
      <span>{text}</span>
    </div>
  );
};

const infoGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
  gap: '8px',
  marginTop: '16px'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '20px',
  cursor: 'pointer',
  color: '#999',
  padding: '4px 8px',
  ':hover': { color: '#333' }
};

const ActionButton = ({ children, onClick, color }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 20px',
      backgroundColor: color,
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'opacity 0.2s',
      ':hover': { opacity: 0.9 }
    }}
  >
    {children}
  </button>
);

export default ContactDetails;