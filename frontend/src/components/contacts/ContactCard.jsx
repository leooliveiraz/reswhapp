import React from 'react';

function ContactCard({ contact, isSelected, onClick }) {
  // Extrair iniciais para avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Gerar cor baseada no nome
  const getAvatarColor = (name) => {
    const colors = [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
      '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
      '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // Formatar número de telefone
  const formatPhone = (number) => {
    if (!number) return 'Número não disponível';
    // Formato: (55) 48 4846-54
    const cleaned = number.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{4})(\d{2})$/);
    if (match) {
      return `(${match[1]}) ${match[2]} ${match[3]}-${match[4]}`;
    }
    return number;
  };

  return (
    <div 
      onClick={() => onClick(contact)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        margin: '8px 0',
        backgroundColor: isSelected ? '#e3f2fd' : '#ffffff',
        border: isSelected ? '2px solid #2196f3' : '1px solid #e0e0e0',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isSelected ? '0 2px 8px rgba(33, 150, 243, 0.2)' : 'none',
        ':hover': {
          backgroundColor: '#f5f5f5',
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
      }}
    >
      {/* Avatar com iniciais */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: getAvatarColor(contact.name || contact.shortName || 'Contato'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px',
        fontWeight: 'bold',
        marginRight: '16px',
        flexShrink: 0
      }}>
        {getInitials(contact.name || contact.shortName || '?')}
      </div>

      {/* Informações do contato */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: '#333',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {contact.name || contact.shortName || 'Sem nome'}
          </h3>
          
          {/* Badges de status */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {contact.isBusiness && (
              <span style={badgeStyle('business')}>💼</span>
            )}
            {contact.isBlocked && (
              <span style={badgeStyle('blocked')}>🚫</span>
            )}
            {contact.isMyContact && (
              <span style={badgeStyle('contact')}>✓</span>
            )}
          </div>
        </div>

        {/* Número formatado */}
        <p style={{
          margin: '4px 0',
          fontSize: '14px',
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📱 {formatPhone(contact.number)}</span>
          {contact.isGroup && <span style={groupStyle}>Grupo</span>}
        </p>

        {/* ID do servidor (opcional - pode ser útil para debug) */}
        {contact.id && (
          <p style={{
            margin: '2px 0 0',
            fontSize: '12px',
            color: '#999',
            fontFamily: 'monospace'
          }}>
            ID: {contact.id.user}@c.us
          </p>
        )}
      </div>

      {/* Indicador de seleção */}
      {isSelected && (
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: '#2196f3',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          marginLeft: '12px',
          flexShrink: 0
        }}>
          ✓
        </div>
      )}
    </div>
  );
}

// Estilos auxiliares
const badgeStyle = (type) => ({
  padding: '2px 6px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 500,
  backgroundColor: type === 'business' ? '#e3f2fd' : 
                   type === 'blocked' ? '#ffebee' : '#e8f5e8',
  color: type === 'business' ? '#1976d2' : 
         type === 'blocked' ? '#c62828' : '#2e7d32',
  marginLeft: '4px'
});

const groupStyle = {
  backgroundColor: '#f3e5f5',
  color: '#7b1fa2',
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '11px',
  fontWeight: 500
};

export default ContactCard;