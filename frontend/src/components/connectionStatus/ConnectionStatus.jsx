import React, { useState, useEffect } from 'react';
import './ConnectionStatus.css';

function ConnectionStatus({ isConnectedToBackend }) {
  const [showDetails, setShowDetails] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [wasDisconnected, setWasDisconnected] = useState(false);

  useEffect(() => {
    // Se desconectar, mostrar o status
    if (!isConnectedToBackend) {
      setIsVisible(true);
      setWasDisconnected(true);
      
      // Esconder automaticamente após 5 segundos se ainda estiver desconectado? 
      // Ou manter visível? Vamos manter visível até o usuário fechar ou reconectar
    }

    // Se reconectar, mostrar por alguns segundos e depois esconder
    if (isConnectedToBackend && wasDisconnected) {
      setWasDisconnected(false);
      
      // Mostrar por 3 segundos após reconectar
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnectedToBackend, wasDisconnected]);

  // Se estiver conectado e não foi desconectado recentemente, podemos esconder
  if (isConnectedToBackend && !wasDisconnected && !isVisible) {
    return null;
  }

  return (
    <div className={`floating-status ${isConnectedToBackend ? 'connected' : 'disconnected'}`}>
      <div className="status-content">
        <div className="status-left">
          <div className={`status-indicator ${isConnectedToBackend ? 'pulse' : ''}`}>
            {isConnectedToBackend ? '🟢' : '🔴'}
          </div>
          <div className="status-text">
            <strong>{isConnectedToBackend ? 'Conectado' : 'Desconectado'}</strong>
            {!isConnectedToBackend && (
              <span className="retry-text">Tentando reconectar...</span>
            )}
          </div>
        </div>

        <div className="status-right">
          {showDetails && (
            <div className="status-details">
              <p>Servidor: localhost:3000</p>
              <p>Transporte: WebSocket</p>
              <p>Última conexão: {new Date().toLocaleTimeString()}</p>
            </div>
          )}
          
          <button 
            className="status-toggle"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '▼' : '▶'}
          </button>
          
          <button 
            className="status-close"
            onClick={() => setIsVisible(false)}
            title="Fechar"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConnectionStatus;