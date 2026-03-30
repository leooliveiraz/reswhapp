import React, { useState } from "react";
import "./LocationMessage.css";

export default function LocationMessage({ msg }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const latitude = msg.latitude || msg.loc?.lat;
  const longitude = msg.longitude || msg.loc?.lng;
  const name = msg.name || msg.loc?.name || "Localização compartilhada";
  const address = msg.address || msg.loc?.address || "";

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const wazeUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

  const handleOpenMap = (e, url) => {
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="message-location">
      <div className="location-content">
        <div className="location-header" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="location-icon">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path
                fill="currentColor"
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              />
            </svg>
          </div>
          <div className="location-info">
            <span className="location-name">{name}</span>
            {address && <span className="location-address">{address}</span>}
            <span className="location-coords">
              {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
            </span>
          </div>
        </div>

        {isExpanded && (
          <div className="location-actions">
            <button
              className="location-btn"
              onClick={(e) => handleOpenMap(e, googleMapsUrl)}
            >
              🗺️ Google Maps
            </button>
            <button
              className="location-btn"
              onClick={(e) => handleOpenMap(e, wazeUrl)}
            >
              🚗 Waze
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
