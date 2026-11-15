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
  const wordGroups = hintMask.trim().split(/\s{2,}/).filter(Boolean);

  return (
    <header className="skribbl-hint-bar">
      {/* Left: Timer & Round Meta */}
      <div className="hint-meta-left">
        <div className={`hint-timer ${timeLeft <= 10 ? 'timer-danger' : ''}`}>
          <svg className="timer-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="timer-val">{timeLeft}s</span>
        </div>
        <span className="meta-divider">•</span>
        <span className="round-indicator">
          Round {currentRound} of {totalRounds}
        </span>
      </div>

      {/* Center: Secret Word (Artist) or Letter Slots (Guesser) */}
      <div className="hint-display-center">
        {isArtist ? (
          <div className="artist-word-chip">
            <span className="draw-prompt">Draw:</span>
            <strong className="draw-word">{word}</strong>
          </div>
        ) : (
          <div className="guesser-words-cluster">
            {wordGroups.map((group, gIdx) => {
              const chars = group.split(' ').filter(Boolean);
              return (
                <div key={gIdx} className="word-group">
                  {chars.map((ch, cIdx) => (
                    <span
                      key={cIdx}
                      className={`letter-slot ${ch !== '_' ? 'revealed' : ''}`}
                    >
                      {ch === '_' ? '' : ch}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .skribbl-hint-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 8px 18px;
          width: 100%;
          box-sizing: border-box;
          min-height: 48px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .hint-meta-left {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }

        .hint-timer {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono, monospace);
          font-size: 14px;
          font-weight: 750;
          color: var(--text-primary);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          background: var(--surface-sunken);
          transition: color 0.2s, background 0.2s;
        }

        .timer-icon {
          color: var(--accent-default);
        }

        .timer-danger {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
          animation: dangerBlink 1s infinite;
        }

        @keyframes dangerBlink {
          50% { opacity: 0.5; }
        }

        .meta-divider {
          color: var(--border-strong);
          font-size: 10px;
        }

        .round-indicator {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .hint-display-center {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
        }

        /* Artist Word View */
        .artist-word-chip {
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
        }

        .draw-prompt {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }

        .draw-word {
          font-size: 17px;
          font-weight: 850;
          color: var(--accent-default);
          letter-spacing: 0.02em;
        }

        /* Guesser Slots View */
        .guesser-words-cluster {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .word-group {
          display: flex;
          align-items: flex-end;
          gap: 6px;
        }

        .letter-slot {
          width: 17px;
          height: 25px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-bottom: 2px solid var(--border-strong);
          font-family: var(--font-mono, monospace);
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
          text-transform: uppercase;
          transition: border-color 0.15s, color 0.15s;
        }

        .letter-slot.revealed {
          border-bottom-color: var(--accent-default);
          color: var(--accent-default);
        }

        @media (max-width: 640px) {
          .skribbl-hint-bar {
            padding: 6px 12px;
            gap: 8px;
            min-height: 42px;
          }
          .hint-meta-left {
            gap: 6px;
          }
          .hint-timer {
            font-size: 12px;
            padding: 2px 6px;
          }
          .round-indicator {
            font-size: 11px;
          }
          .draw-word {
            font-size: 14px;
          }
          .letter-slot {
            width: 13px;
            height: 20px;
            font-size: 13px;
          }
          .word-group {
            gap: 3px;
          }
          .guesser-words-cluster {
            gap: 10px;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </header>
  );
};
