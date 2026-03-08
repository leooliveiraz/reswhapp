import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Conectar ao servidor Socket.IO
const socket = io('http://localhost:3000'); // URL do seu servidor

function SocketTest() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // Eventos de conexão
    socket.on('connect', () => {
      console.log('Conectado ao servidor!', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Desconectado do servidor');
      setIsConnected(false);
    });

    // Receber mensagens do servidor
    socket.on('message', (data) => {
      console.log('Mensagem recebida:', data);
      setMessages(prev => [...prev, { 
        text: data.text, 
        time: new Date().toLocaleTimeString() 
      }]);
    });

    // Limpar listeners quando o componente desmontar
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message');
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      // Enviar mensagem para o servidor
      socket.emit('message', { 
        text: inputMessage,
        user: 'Usuário React'
      });
      socket.emit("get-contacts")
      setInputMessage('');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>WebSocket com Socket.IO</h2>
      
      {/* Status da conexão */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
        color: isConnected ? '#155724' : '#721c24',
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        Status: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
        {socket.id && <span> (ID: {socket.id})</span>}
      </div>

      {/* Lista de mensagens */}
      <div style={{
        height: '300px',
        overflowY: 'auto',
        border: '1px solid #ccc',
        padding: '10px',
        marginBottom: '10px',
        borderRadius: '5px'
      }}>
        {messages.map((msg, index) => (
          <div key={index} style={{
            padding: '8px',
            margin: '5px 0',
            backgroundColor: '#f0f0f0',
            borderRadius: '5px'
          }}>
            <span style={{ color: '#666', fontSize: '12px' }}>{msg.time}</span>
            <p style={{ margin: '5px 0 0 0' }}>{msg.text}</p>
          </div>
        ))}
      </div>

      {/* Formulário de envio */}
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          style={{
            flex: 1,
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px'
          }}
        />
        <button type="submit" style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Enviar
        </button>
      </form>
    </div>
  );
}

export default SocketTest;