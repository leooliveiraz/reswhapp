// src/components/ImageViewer.jsx
import React, { useEffect, useState } from "react";
import "./ImageViewer.css";

const IMAGE_URL = import.meta.env.VITE_IMAGE_URL || 'http://localhost:3000/images';

export default function ImageViewer({ 
  isOpen, 
  onClose, 
  imageUrl, 
  message,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious 
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNext?.();
      } else if (e.key === 'ArrowLeft' && hasPrevious) {
        onPrevious?.();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleReset();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, hasNext, hasPrevious, onNext, onPrevious]);

  // Reset zoom quando mudar de imagem
  useEffect(() => {
    handleReset();
  }, [imageUrl]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Limita o arrasto para não sair da tela
      const maxX = (scale - 1) * 200;
      const maxY = (scale - 1) * 200;
      
      setPosition({
        x: Math.min(Math.max(newX, -maxX), maxX),
        y: Math.min(Math.max(newY, -maxY), maxY)
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message?.fileName || 'imagem.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
    }
  };

  const getMediaType = () => {
    if (message?.type === 'video' || message?.isGif) return 'video';
    if (message?.type === 'ptt' || message?.type === 'audio') return 'audio';
    return 'image';
  };

  const mediaType = getMediaType();

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="image-viewer-header">
          <div className="image-viewer-info">
            <span className="image-viewer-date">
              {message?.timestamp && new Date(message.timestamp * 1000).toLocaleString()}
            </span>
          </div>
          <div className="image-viewer-actions">
            {mediaType === 'image' && (
              <>
                <button className="image-viewer-btn" onClick={handleZoomOut} title="Zoom out (-)">
                  🔍-
                </button>
                <button className="image-viewer-btn" onClick={handleReset} title="Reset (0)">
                  🔄
                </button>
                <button className="image-viewer-btn" onClick={handleZoomIn} title="Zoom in (+)">
                  🔍+
                </button>
              </>
            )}
            <button className="image-viewer-btn" onClick={handleDownload} title="Download">
              ⬇️
            </button>
            <button className="image-viewer-btn close" onClick={onClose} title="Fechar (ESC)">
              ✕
            </button>
          </div>
        </div>

        {/* Media Container */}
        <div 
          className="image-viewer-media-container"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {mediaType === 'video' && (
            <video
              src={imageUrl}
              controls
              autoPlay
              className="image-viewer-video"
            />
          )}
          {mediaType === 'audio' && (
            <audio
              src={imageUrl}
              controls
              autoPlay
              className="image-viewer-audio"
            />
          )}
          {mediaType === 'image' && (
            <div className="image-viewer-image-wrapper">
              <img
                src={imageUrl}
                alt="Imagem ampliada"
                className="image-viewer-image"
                style={{
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                  cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
                draggable={false}
              />
            </div>
          )}
        </div>

        {/* Navigation arrows */}
        {hasPrevious && (
          <button 
            className="image-viewer-nav nav-prev" 
            onClick={onPrevious}
            title="Anterior (←)"
          >
            ‹
          </button>
        )}
        {hasNext && (
          <button 
            className="image-viewer-nav nav-next" 
            onClick={onNext}
            title="Próxima (→)"
          >
            ›
          </button>
        )}

        {/* Footer com informações */}
        {message?.caption && (
          <div className="image-viewer-footer">
            <p className="image-viewer-caption">{message.caption}</p>
          </div>
        )}

        {/* Zoom indicator */}
        {mediaType === 'image' && scale !== 1 && (
          <div className="image-viewer-zoom-indicator">
            {Math.round(scale * 100)}%
          </div>
        )}
      </div>
    </div>
  );
}