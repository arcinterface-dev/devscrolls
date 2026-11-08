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
    <div className="scoreboard-container">
      <div className="scoreboard-header">
        <span>LEADERBOARD</span>
      </div>

      <div className="scoreboard-list">
        {sorted.map((p, idx) => {
          const isMe = p.id === currentPlayerId;
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

          return (
            <div
              key={p.id}
              className={`player-score-row ${isMe ? 'player-me' : ''} ${p.hasGuessedThisRound ? 'player-guessed' : ''}`}
            >
              <span className="player-rank">{medal}</span>
              <div className="player-meta">
                <span className="player-name">
                  {p.avatar ? `${p.avatar} ` : ''}{p.name} {isMe && '(You)'}
                </span>
                {p.isArtist && <span className="artist-indicator">✏️ Drawing</span>}
              </div>

              <div className="score-right">
                {p.hasGuessedThisRound && <span className="guessed-check">✓</span>}
                <strong className="player-pts">{p.score}</strong>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .scoreboard-container {
          background: var(--surface-raised);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          min-width: 180px;
        }

        .scoreboard-header {
          padding: 8px 12px;
          background: var(--surface-sunken);
          border-bottom: 1px solid var(--border-subtle);
          font-size: 11px;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .scoreboard-list {
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          overflow-y: auto;
        }

        .player-score-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          background: var(--surface-sunken);
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          font-size: 12px;
        }

        .player-me {
          border-left: 3px solid var(--accent-default);
          background: color-mix(in srgb, var(--accent-default) 10%, var(--surface-sunken));
        }

        .player-guessed {
          border-color: rgba(16, 185, 129, 0.4);
          background: rgba(16, 185, 129, 0.1);
        }

        .player-rank {
          font-size: 13px;
          width: 22px;
        }

        .player-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .player-name {
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .artist-indicator {
          font-size: 10px;
          color: var(--accent-default);
          font-weight: 750;
        }

        .score-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .guessed-check {
          color: #10b981;
          font-weight: 900;
          font-size: 14px;
        }

        .player-pts {
          font-family: var(--font-mono, monospace);
          font-size: 13px;
          font-weight: 800;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};
