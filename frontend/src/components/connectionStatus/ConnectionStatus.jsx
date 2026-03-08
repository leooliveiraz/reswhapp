import React from 'react';


function ConnectionStatus({isConnectedToBackend}) {
  return (
    <div style={{
      padding: '10px 20px',
      backgroundColor: isConnectedToBackend ? '#4CAF50' : '#f44336',
      color: 'white',
      textAlign: 'center',
      fontWeight: 'bold',
      borderRadius: '5px',
      margin: '10px'
    }}>
      Status: {isConnectedToBackend ? '🟢 Conectado' : '🔴 Desconectado'}
    </div>
  );
}

export default ConnectionStatus;