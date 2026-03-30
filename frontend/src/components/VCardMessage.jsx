import React from "react";
import "./VCardMessage.css";

export default function VCardMessage({ msg }) {
  const vcardData = msg.vcard || msg.body || "";
  
  // Extrair informações do vCard
  const extractVCardInfo = () => {
    const name = vcardData.match(/FN:(.+?)(?:\r?\n|$)/i)?.[1]?.trim() || "Contato compartilhado";
    const phone = vcardData.match(/TEL(?:;[^:]*):?(.+?)(?:\r?\n|$)/i)?.[1]?.trim() || "";
    const org = vcardData.match(/ORG:(.+?)(?:\r?\n|$)/i)?.[1]?.trim() || "";
    const title = vcardData.match(/TITLE:(.+?)(?:\r?\n|$)/i)?.[1]?.trim() || "";
    
    return { name, phone, org, title };
  };

  const { name, phone, org, title } = extractVCardInfo();

  const handleSaveContact = () => {
    // Criar um blob com o vCard e fazer download
    const blob = new Blob([vcardData], { type: "text/vcard" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="message-vcard">
      <div className="vcard-content">
        <div className="vcard-icon">
          <svg viewBox="0 0 24 24" width="40" height="40">
            <path
              fill="currentColor"
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            />
          </svg>
        </div>
        <div className="vcard-info">
          <span className="vcard-name">{name}</span>
          {org && <span className="vcard-org">{org}</span>}
          {title && <span className="vcard-title">{title}</span>}
          {phone && <span className="vcard-phone">📞 {phone}</span>}
        </div>
        <button className="vcard-save-btn" onClick={handleSaveContact}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="currentColor"
              d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"
            />
          </svg>
          Salvar
        </button>
      </div>
    </div>
  );
}
