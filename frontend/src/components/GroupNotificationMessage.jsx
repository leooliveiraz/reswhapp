import React from "react";
import "./GroupNotificationMessage.css";

export default function GroupNotificationMessage({ msg }) {
  const body = msg.body || msg.text || "";
  
  // Extrair informações da notificação
  const extractNotificationInfo = () => {
    // Padrões comuns de notificações de grupo
    const patterns = {
      add: /added\s+(.+?)\s+to\s+the\s+group/i,
      remove: /removed\s+(.+?)\s+from\s+the\s+group/i,
      leave: /left\s+the\s+group/i,
      create: /created\s+a\s+group/i,
      subject: /changed\s+the\s+subject\s+to\s+(.+)/i,
      icon: /changed\s+the\s+group\s+icon/i,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      const match = body.match(pattern);
      if (match) {
        return { type, match };
      }
    }
    return { type: "unknown", match: null };
  };

  const { type } = extractNotificationInfo();

  const getNotificationIcon = () => {
    switch (type) {
      case "add": return "👥";
      case "remove": return "🚪";
      case "leave": return "👋";
      case "create": return "🎉";
      case "subject": return "📝";
      case "icon": return "🖼️";
      default: return "📢";
    }
  };

  return (
    <div className="message-group-notification">
      <div className="group-notification-content">
        <span className="group-notification-icon">{getNotificationIcon()}</span>
        <span className="group-notification-text">{body}</span>
      </div>
    </div>
  );
}
