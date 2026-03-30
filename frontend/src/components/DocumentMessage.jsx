import React from "react";
import "./DocumentMessage.css";

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

const getFileIcon = (mimetype) => {
  if (!mimetype) return "📄";
  if (mimetype.includes("pdf")) return "📕";
  if (mimetype.includes("word") || mimetype.includes("document")) return "📘";
  if (mimetype.includes("sheet") || mimetype.includes("excel")) return "📗";
  if (mimetype.includes("presentation") || mimetype.includes("powerpoint")) return "📙";
  if (mimetype.includes("zip") || mimetype.includes("rar") || mimetype.includes("compressed")) return "📦";
  if (mimetype.includes("audio")) return "🎵";
  if (mimetype.includes("video")) return "🎬";
  if (mimetype.includes("image")) return "🖼️";
  return "📄";
};

export default function DocumentMessage({ msg, isOwn }) {
  const IMAGE_URL = import.meta.env.VITE_IMAGE_URL;
  
  const documentUrl = msg.filePathDir && msg.fileName 
    ? `${IMAGE_URL}/${msg.filePathDir}/${msg.fileName}`
    : "#";
  
  const filename = msg.filename || msg.fileName || "documento";
  const mimetype = msg.mimetype || "application/octet-stream";
  const filesize = msg.fileSize || msg.size || 0;
  const caption = msg.caption || msg.body || "";

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar documento:", error);
    }
  };

  return (
    <div className="message-document">
      <div className="document-content" onClick={handleDownload}>
        <div className="document-icon">{getFileIcon(mimetype)}</div>
        <div className="document-info">
          <span className="document-name">{filename}</span>
          <span className="document-size">{formatFileSize(filesize)}</span>
          {caption && <span className="document-caption">{caption}</span>}
        </div>
        <div className="document-download">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path
              fill="currentColor"
              d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
