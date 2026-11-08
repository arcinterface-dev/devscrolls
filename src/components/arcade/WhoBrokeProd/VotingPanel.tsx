import React, { useState } from 'react';
import type { RoomPlayer } from '../shared/useSupabaseRoom';

interface VotingPanelProps {
  players: RoomPlayer[];
  currentPlayerId: string;
  onCastVote: (suspectPlayerId: string) => void;
  hasVoted: boolean;
  selectedSuspectId: string | null;
}

export const VotingPanel: React.FC<VotingPanelProps> = ({
  players,
  currentPlayerId,
  onCastVote,
  hasVoted,
  selectedSuspectId,
}) => {
  return (
    <div className="voting-panel-wrap">
      <div className="voting-header">
        <span className="voting-icon">🗳️</span>
        <h3 className="voting-title">Identify the Rogue Deployer</h3>
        <p className="voting-subtitle">Vote for the colleague who seems clueless or gave fishy answers:</p>
      </div>

      <div className="suspects-grid">
        {players.map((p) => {
          const isMe = p.id === currentPlayerId;
          const isSelected = selectedSuspectId === p.id;

          return (
            <button
              key={p.id}
              type="button"
              disabled={hasVoted || isMe}
              onClick={() => onCastVote(p.id)}
              className={`suspect-btn ${isSelected ? 'suspect-selected' : ''} ${isMe ? 'suspect-me' : ''}`}
            >
              <div className="suspect-avatar">
                {p.displayName.slice(0, 2).toUpperCase()}
              </div>
              <span className="suspect-name">
                {p.displayName} {isMe && '(You)'}
              </span>
              {isSelected && <span className="voted-tag">Voted</span>}
            </button>
          );
        })}

        <button
          type="button"
          disabled={hasVoted}
          onClick={() => onCastVote('skip')}
          className={`suspect-btn skip-btn ${selectedSuspectId === 'skip' ? 'suspect-selected' : ''}`}
        >
          <div className="suspect-avatar skip-avatar">?</div>
          <span className="suspect-name">Skip / Inconclusive</span>
        </button>
      </div>

      {hasVoted && (
        <div className="voted-confirmation">
          <span>✓ Your vote has been locked in. Waiting for team tally...</span>
        </div>
      )}

      <style>{`
        .voting-panel-wrap {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          text-align: center;
        }

        .voting-icon {
          font-size: 32px;
          line-height: 1;
        }

        .voting-title {
          font-size: 20px;
          font-weight: 800;
          color: #f8fafc;
          margin: 0;
        }

        .voting-subtitle {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
        }

        .suspects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 8px;
        }

        .suspect-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: var(--radius-md);
          color: #f8fafc;
          cursor: pointer;
          transition: all 0.15s;
        }

        .suspect-btn:hover:not(:disabled) {
          border-color: #f97316;
          background: rgba(249, 115, 22, 0.15);
          transform: translateY(-1px);
        }

        .suspect-selected {
          border-color: #f97316;
          background: rgba(249, 115, 22, 0.25);
          box-shadow: 0 0 10px rgba(249, 115, 22, 0.3);
        }

        .suspect-me {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .suspect-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #3b82f6;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .skip-avatar {
          background: #64748b;
        }

        .suspect-name {
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .voted-tag {
          font-size: 10px;
          font-weight: 800;
          color: #f97316;
          margin-left: auto;
        }

        .voted-confirmation {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: var(--radius-sm);
          padding: 8px;
          font-size: 12px;
          color: #10b981;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};
