import React from "react";
import "./ReactionMessage.css";

export default function ReactionMessage({ msg, allMessages }) {
  const reactionEmoji = msg.body || msg.reaction || "";
  const msgId = msg.msgId || msg.id;
  
  // Encontrar a mensagem original que foi reagida
  const originalMessage = allMessages?.find(m => m.id === msgId || m.id?.key?.id === msgId);

  return (
    <div className="message-reaction">
      <div className="reaction-content">
        <span className="reaction-emoji">{reactionEmoji}</span>
        {originalMessage && (
          <div className="reaction-preview">
            {originalMessage.body?.substring(0, 50)}
            {originalMessage.body?.length > 50 ? "..." : ""}
          </div>
        )}
      </div>
    </div>
  );
}
