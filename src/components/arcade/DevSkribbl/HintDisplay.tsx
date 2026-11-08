import React from 'react';

interface HintDisplayProps {
  isArtist: boolean;
  word: string; // Known to artist
  hintMask: string; // e.g. "_ _ _ _   _ _ _ _ _ _ _ _ _ _ _"
  timeLeft: number;
  currentRound: number;
  totalRounds: number;
}

export const HintDisplay: React.FC<HintDisplayProps> = ({
  isArtist,
  word,
  hintMask,
  timeLeft,
  currentRound,
  totalRounds,
}) => {
  // Parse hintMask into distinct word groups
  // Split on 2 or more spaces to identify distinct words
  const wordGroups = hintMask.trim().split(/\s{2,}/).filter(Boolean);

  return (
    <div className="skribbl-hint-bar">
      {/* Timer and Round */}
      <div className="hint-meta-left">
        <span className={`hint-clock ${timeLeft <= 10 ? 'danger-pulse' : ''}`}>
          ⏱️ {timeLeft}s
        </span>
        <span className="round-pill">
          Round {currentRound}/{totalRounds}
        </span>
      </div>

      {/* Word / Hint Area */}
      <div className="hint-display-center">
        {isArtist ? (
          <div className="artist-secret-card">
            <span className="artist-tag">DRAW THIS:</span>
            <span className="artist-word-value">{word}</span>
          </div>
        ) : (
          <div className="guesser-slots-card">
            <div className="words-flex-container">
              {wordGroups.map((group, gIdx) => {
                const chars = group.split(' ').filter(Boolean);
                return (
                  <div key={gIdx} className="word-cluster">
                    <div className="slots-row">
                      {chars.map((ch, cIdx) => (
                        <span
                          key={cIdx}
                          className={`letter-slot ${ch !== '_' ? 'revealed' : ''}`}
                        >
                          {ch === '_' ? '' : ch}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .skribbl-hint-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface-raised);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 8px 16px;
          width: 100%;
          box-sizing: border-box;
          min-height: 52px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .hint-meta-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .hint-clock {
          font-family: var(--font-mono, monospace);
          font-size: 15px;
          font-weight: 850;
          color: var(--accent-default);
          background: color-mix(in srgb, var(--accent-default) 10%, transparent);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
        }

        .danger-pulse {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.12);
          animation: dangerPulse 0.8s infinite;
        }

        @keyframes dangerPulse {
          50% { opacity: 0.4; }
        }

        .round-pill {
          font-size: 11px;
          font-weight: 750;
          color: var(--text-secondary);
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          padding: 4px 10px;
          border-radius: var(--radius-full);
        }

        .hint-display-center {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
        }

        /* Artist Secret View */
        .artist-secret-card {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .artist-tag {
          font-size: 11px;
          font-weight: 800;
          color: var(--accent-default);
          background: rgba(217, 119, 6, 0.12);
          border: 1px solid rgba(217, 119, 6, 0.3);
          padding: 3px 9px;
          border-radius: var(--radius-sm);
          letter-spacing: 0.05em;
        }

        .artist-word-value {
          font-size: 19px;
          font-weight: 850;
          color: var(--text-primary);
          letter-spacing: 0.04em;
        }

        .artist-words-count {
          font-size: 12px;
          color: var(--text-muted);
        }

        /* Guesser Hint View */
        .guesser-slots-card {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .words-flex-container {
          display: flex;
          align-items: center;
          gap: 18px; /* Clear visible space between words */
        }

        .word-cluster {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .slots-row {
          display: flex;
          align-items: flex-end;
          gap: 5px;
        }

        .letter-slot {
          width: 18px;
          height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-bottom: 3px solid var(--text-primary);
          font-family: var(--font-mono, monospace);
          font-size: 16px;
          font-weight: 850;
          color: var(--text-primary);
          text-transform: uppercase;
        }

        .letter-slot.revealed {
          color: var(--accent-default);
          border-bottom-color: var(--accent-default);
          animation: popLetter 0.2s ease-out;
        }

        @keyframes popLetter {
          from { transform: scale(0.8); }
          to { transform: scale(1); }
        }

        @media (max-width: 640px) {
          .skribbl-hint-bar {
            padding: 6px 8px;
            gap: 6px;
            min-height: 44px;
          }
          .hint-meta-left {
            gap: 6px;
          }
          .hint-clock {
            font-size: 12px;
            padding: 2px 6px;
          }
          .round-pill {
            font-size: 10px;
            padding: 2px 6px;
          }
          .artist-tag {
            font-size: 9px;
            padding: 2px 5px;
          }
          .artist-word-value {
            font-size: 14px;
          }
          .letter-slot {
            width: 13px;
            height: 20px;
            font-size: 13px;
            border-bottom-width: 2px;
          }
          .slots-row {
            gap: 3px;
          }
          .words-flex-container {
            gap: 10px;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};
