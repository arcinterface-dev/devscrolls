import React from 'react';

export interface SkribblPlayer {
  id: string;
  name: string;
  score: number;
  avatar?: string;
  hasGuessedThisRound?: boolean;
  isArtist?: boolean;
}

interface ScoreBoardProps {
  players: SkribblPlayer[];
  currentPlayerId: string;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ players, currentPlayerId }) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <aside className="scoreboard-container">
      <div className="scoreboard-header">
        <span className="scoreboard-title">Players</span>
        <span className="player-count-badge">{players.length}</span>
      </div>

      <div className="scoreboard-list">
        {sorted.map((p, idx) => {
          const isMe = p.id === currentPlayerId;

          return (
            <div
              key={p.id}
              className={`player-row ${isMe ? 'is-me' : ''} ${p.hasGuessedThisRound ? 'is-solved' : ''}`}
            >
              <span className="player-rank">{idx + 1}</span>

              <div className="player-identity">
                <span className="player-name">
                  {p.name}
                  {isMe && <span className="you-label">You</span>}
                </span>
                {p.isArtist && (
                  <span className="drawing-status-pill">
                    <span className="drawing-status-dot"></span> Drawing
                  </span>
                )}
              </div>

              <div className="player-stats">
                {p.hasGuessedThisRound && <span className="solved-check" title="Solved this round">✓</span>}
                <span className="player-points">{p.score}</span>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .scoreboard-container {
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          min-width: 180px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .scoreboard-header {
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-subtle);
        }

        .scoreboard-title {
          font-size: 11px;
          font-weight: 750;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .player-count-badge {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          background: var(--surface-sunken);
          padding: 1px 6px;
          border-radius: var(--radius-full);
        }

        .scoreboard-list {
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          overflow-y: auto;
        }

        .player-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: var(--radius-md);
          font-size: 13px;
          transition: background 0.15s;
        }

        .player-row:hover {
          background: var(--surface-sunken);
        }

        .player-row.is-me {
          background: color-mix(in srgb, var(--accent-default) 8%, transparent);
        }

        .player-row.is-solved {
          background: rgba(16, 185, 129, 0.08);
        }

        .player-rank {
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          width: 16px;
          text-align: center;
          flex-shrink: 0;
        }

        .player-identity {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .player-name {
          font-weight: 650;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .you-label {
          font-size: 10px;
          font-weight: 750;
          color: var(--accent-default);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .drawing-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          color: var(--accent-default);
        }

        .drawing-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent-default);
          animation: statusPulse 1.5s infinite;
        }

        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .player-stats {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .solved-check {
          color: #10b981;
          font-weight: 850;
          font-size: 13px;
        }

        .player-points {
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          font-weight: 750;
          color: var(--text-muted);
        }

        @media (max-width: 900px) {
          .scoreboard-container {
            height: auto;
            min-height: 0;
            min-width: 0;
            width: 100%;
            border-radius: var(--radius-md);
            box-shadow: none;
          }
          .scoreboard-header {
            display: none;
          }
          .scoreboard-list {
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 4px 6px;
            gap: 6px;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          .scoreboard-list::-webkit-scrollbar {
            display: none;
          }
          .player-row {
            padding: 4px 8px;
            font-size: 11.5px;
            flex-shrink: 0;
            gap: 6px;
            border: 1px solid var(--border-subtle);
          }
          .player-name {
            max-width: 90px;
          }
        }
      `}</style>
    </aside>
  );
};
