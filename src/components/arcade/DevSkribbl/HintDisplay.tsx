import React from 'react';

interface HintDisplayProps {
  isArtist: boolean;
  word: string; // Known to artist
  hintMask: string; // e.g. "_ _ _ _   _ _ _ _ _ _ _ _ _ _ _"
  timeLeft: number;
  currentRound: number;
  totalRounds: number;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const HintDisplay: React.FC<HintDisplayProps> = ({
  isArtist,
  word,
  hintMask,
  timeLeft,
  currentRound,
  totalRounds,
  isMuted = false,
  onToggleMute,
}) => {
  // Parse hintMask into distinct word groups
  // Split on 2 or more spaces to identify distinct words
  const wordGroups = hintMask.trim().split(/\s{2,}/).filter(Boolean);

  // Calculate length of each word group
  const wordLengths = wordGroups.map((g) => g.split(' ').filter(Boolean).length);
  const totalLetters = wordLengths.reduce((acc, len) => acc + len, 0);

  return (
    <div className="skribbl-hint-bar">
      {/* Timer, Round and Sound */}
      <div className="hint-meta-left">
        <span className={`hint-clock ${timeLeft <= 10 ? 'danger-pulse' : ''}`}>
          ⏱️ {timeLeft}s
        </span>
        <span className="round-pill">
          Round {currentRound}/{totalRounds}
        </span>
        {onToggleMute && (
          <button
            type="button"
            onClick={onToggleMute}
            className="hint-audio-btn"
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        )}
      </div>

      {/* Word / Hint Area */}
      <div className="hint-display-center">
        {isArtist ? (
          <div className="artist-secret-card">
            <span className="artist-tag">DRAW THIS:</span>
            <span className="artist-word-value">{word}</span>
            {word.includes(' ') && (
              <span className="artist-words-count">
                ({word.split(' ').length} words)
              </span>
            )}
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
                    <span className="cluster-len-label">{chars.length}</span>
                  </div>
                );
              })}
            </div>

            <div className="hint-meta-summary">
              <span>
                {wordLengths.length > 1
                  ? `${wordLengths.join(' + ')} = ${totalLetters} letters (${wordLengths.length} words)`
                  : `${totalLetters} letters`}
              </span>
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

        .hint-audio-btn {
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          font-size: 13px;
          cursor: pointer;
          border-radius: var(--radius-sm);
          padding: 4px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .hint-audio-btn:hover {
          background: var(--surface-base);
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

        .cluster-len-label {
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 700;
        }

        .hint-meta-summary {
          font-size: 11.5px;
          color: var(--text-secondary);
          font-weight: 600;
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }
      `}</style>
    </div>
  );
};
