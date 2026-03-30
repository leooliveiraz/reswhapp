import React, { useState } from "react";
import "./PollMessage.css";

export default function PollMessage({ msg, isOwn }) {
  const pollName = msg.pollName || msg.body || "Enquete";
  const pollOptions = msg.pollOptions || [];
  const selectedOptions = msg.selectedOptions || [];
  const totalVotes = msg.totalVotes || pollOptions.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  const [hasVoted, setHasVoted] = useState(selectedOptions?.length > 0);

  const handleVote = (optionIndex) => {
    if (hasVoted) return;
    
    // Aqui você pode emitir um evento para o servidor registrar o voto
    // socket.emit("vote-poll", { pollId: msg.id, optionIndex });
    setHasVoted(true);
  };

  return (
    <div className="message-poll">
      <div className="poll-header">
        <span className="poll-icon">📊</span>
        <span className="poll-name">{pollName}</span>
      </div>
      
      <div className="poll-options">
        {pollOptions.map((option, index) => {
          const optionName = typeof option === "string" ? option : option.name;
          const optionVotes = typeof option === "object" ? option.votes : 0;
          const isSelected = selectedOptions?.includes(index);
          const percentage = totalVotes > 0 ? ((optionVotes / totalVotes) * 100).toFixed(0) : 0;

          return (
            <div
              key={index}
              className={`poll-option ${isSelected ? "selected" : ""} ${!hasVoted ? "clickable" : ""}`}
              onClick={() => handleVote(index)}
            >
              <div className="poll-option-content">
                <span className="poll-option-name">{optionName}</span>
                {hasVoted && (
                  <span className="poll-option-votes">{optionVotes}</span>
                )}
              </div>
              {hasVoted && (
                <div className="poll-progress-bar">
                  <div
                    className="poll-progress-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              )}
              {hasVoted && (
                <span className="poll-percentage">{percentage}%</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="poll-footer">
        <span>{totalVotes} {totalVotes === 1 ? "voto" : "votos"}</span>
        {isOwn && !hasVoted && <span className="poll-hint">Toque para votar</span>}
      </div>
    </div>
  );
}
