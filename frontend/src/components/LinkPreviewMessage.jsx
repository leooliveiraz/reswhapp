import React, { useState } from "react";
import "./LinkPreviewMessage.css";

export default function LinkPreviewMessage({ msg }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const url = msg.url || msg.body || "";
  const title = msg.title || msg.linkPreview?.title || "Link compartilhado";
  const description = msg.description || msg.linkPreview?.description || "";
  const image = msg.image || msg.linkPreview?.image || "";

  const handleClick = (e) => {
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="message-link-preview">
      <div className="link-preview-content" onClick={handleClick}>
        {image && (
          <div className="link-preview-image">
            <img src={image} alt={title} />
          </div>
        )}
        <div className="link-preview-info">
          <span className="link-preview-title">{title}</span>
          {description && (
            <span className={`link-preview-description ${isExpanded ? "expanded" : ""}`}>
              {description}
            </span>
          )}
          {description?.length > 100 && (
            <button
              className="link-preview-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? "Mostrar menos" : "Mostrar mais"}
            </button>
          )}
          <span className="link-preview-url">{url}</span>
        </div>
      </div>
    </div>
  );
}
