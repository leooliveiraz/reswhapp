// src/components/Chat.jsx
import React, { useContext, useEffect, useState, useRef } from "react";
import { AppContext } from "../AppContext";
import ChatHeader from "./ChatHeader";
import Message from "./Message";
import "./Chat.css";

export default function Chat() {
  const { socket, selectedContact } = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const scrollToMessage = (messageId) => {
    // Remove destaque anterior
    document.querySelectorAll('.message-highlighted').forEach(el => {
      el.classList.remove('message-highlighted');
    });

    // Tenta encontrar a mensagem no DOM
    const messageElement = document.getElementById(`msg-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      messageElement.classList.add('message-highlighted');

      // Remove o destaque após 2 segundos
      setTimeout(() => {
        messageElement.classList.remove('message-highlighted');
      }, 2000);
    } else {
      // Mensagem não encontrada, pode estar fora do limite carregado
      console.log('Mensagem original não encontrada na lista atual');
    }
  };

  const handleQuotedClick = (quotedMessageId) => {
    scrollToMessage(quotedMessageId);
  };

  /**
   * Processa mensagens para agrupar reações com suas mensagens originais
   */
  const processMessagesWithReactions = (messagesList) => {
    if (!messagesList || !Array.isArray(messagesList)) return [];

    // Separa reações das demais mensagens
    const reactions = [];
    const regularMessages = [];

    messagesList.forEach(msg => {
      if (msg.type === 'reaction') {
        reactions.push(msg);
      } else {
        regularMessages.push(msg);
      }
    });

    // Cria um mapa de reações por mensagem original
    const reactionsByMessage = {};
    reactions.forEach(reaction => {
      const targetId = reaction.originalMsgId || reaction.msgId;
      if (!reactionsByMessage[targetId]) {
        reactionsByMessage[targetId] = [];
      }
      reactionsByMessage[targetId].push(reaction);
    });

    // Adiciona reações às mensagens originais
    const messagesWithReactions = regularMessages.map(msg => ({
      ...msg,
      reactions: reactionsByMessage[msg.id] || []
    }));

    return messagesWithReactions;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!selectedContact || !socket) return;

    socket.emit("get-message-historic", {
      contactId: selectedContact.id._serialized,
      limit: 500,
    });

    const handleLastMessages = (lastMessages) => {
      const processedMessages = processMessagesWithReactions(lastMessages.messages || []);
      // Ordena por timestamp (mais antigas primeiro, mais recentes no final)
      const sortedMessages = [...processedMessages].sort((a, b) => a.timestamp - b.timestamp);
      setMessages(sortedMessages);
      scrollToBottom();
    };

    socket.on("last-messages", handleLastMessages);

    const handleNewMessage = (newMessage) => {
      if (!selectedContact || !newMessage) return;
      if (selectedContact.id._serialized !== newMessage.chatId) return;

      setMessages((prev) => {
        // Se for reação, atualiza a mensagem existente
        if (newMessage.type === 'reaction') {
          const targetId = newMessage.originalMsgId || newMessage.msgId;
          return prev.map(msg => {
            if (msg.id === targetId) {
              // Adiciona ou atualiza a reação
              const existingReactions = msg.reactions || [];
              const reactionIndex = existingReactions.findIndex(
                r => r.from === newMessage.from && r.id === newMessage.id
              );

              if (reactionIndex >= 0) {
                // Atualiza reação existente
                const updated = [...existingReactions];
                updated[reactionIndex] = newMessage;
                return { ...msg, reactions: updated };
              } else if (newMessage.reaction) {
                // Adiciona nova reação (se não estiver vazia)
                return { ...msg, reactions: [...existingReactions, newMessage] };
              } else {
                // Reação removida (emoji vazio)
                return { ...msg, reactions: existingReactions.filter(r => r.id !== newMessage.id) };
              }
            }
            return msg;
          });
        }

        // Verifica se a mensagem já existe para não duplicar
        const messageExists = prev.some(msg => msg.id === newMessage.id);
        if (messageExists) {
          return prev;
        }

        // Mensagem normal - adiciona no final da lista
        return [...prev, newMessage];
      });

      // Scroll para o final após adicionar mensagem
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    };

    socket.on("new-message", handleNewMessage);

    // Listener para ack de mensagens (atualiza status de entrega/leitura)
    socket.on("message-ack", (ackData) => {
      if (!selectedContact || ackData.chatId !== selectedContact.id._serialized) return;
      
      const ackIcons = {
        0: '❌ ERROR',
        1: '✓ SENT',
        2: '✓✓ DELIVERED',
        3: '✓✓🔵 READ',
        4: '✓✓🔵🔊 PLAYED'
      };
      
      console.log(`📨 ACK ${ackIcons[ackData.ack] || ackData.ackStatus}: ${ackData.id.substring(0, 40)}...`);
      
      setMessages((prev) => {
        return prev.map(msg => {
          if (msg.id === ackData.id) {
            return {
              ...msg,
              ack: ackData.ack,
              ackStatus: ackData.ackStatus
            };
          }
          return msg;
        });
      });
    });

    return () => {
      socket.off("last-messages", handleLastMessages);
      socket.off("new-message", handleNewMessage);
      socket.off("message-ack");
    };
  }, [selectedContact, socket]);

  return (
    <>
      <ChatHeader
        nome={selectedContact?.name}
        numero={selectedContact?.id?.user}
      />
      <div className="chat-messages" ref={messagesContainerRef}>
        {messages.map((msg) => (
          <Message
            key={msg.id}
            msg={msg}
            contactName={selectedContact?.name}
            isOwn={msg.isMe || msg.fromMe}
            allMessages={messages}
            onQuotedClick={handleQuotedClick}
          />
        ))}
        <div ref={messagesEndRef} className="chat-messages" />
      </div>
    </>
  );
}
