import React from "react";
import "./UnknownMessage.css";

export default function UnknownMessage({ msg }) {
  const type = msg.type || "unknown";
  const body = msg.body || msg.text || "";

  return (
    <div className="message-unknown">
      <div className="unknown-content">
        <span className="unknown-icon">📦</span>
        <div className="unknown-info">
          <span className="unknown-type">Tipo: {type}</span>
          {body && <span className="unknown-body">{body}</span>}
        </div>
      </div>
    </div>
  );
}
