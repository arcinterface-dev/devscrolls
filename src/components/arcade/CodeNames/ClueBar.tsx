import React, { useState } from 'react';

interface ClueBarProps {
  currentTeam: 'red' | 'blue';
  isSpymaster: boolean;
  isMyTeamTurn: boolean;
  activeClue: { word: string; count: number } | null;
  remainingGuesses: number;
  onGiveClue: (word: string, count: number) => void;
  onEndTurn: () => void;
}

export const ClueBar: React.FC<ClueBarProps> = ({
  currentTeam,
  isSpymaster,
  isMyTeamTurn,
  activeClue,
  remainingGuesses,
  onGiveClue,
  onEndTurn,
}) => {
  const [clueWord, setClueWord] = useState('');
  const [clueCount, setClueCount] = useState(1);

  const handleSubmitClue = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = clueWord.trim().toUpperCase();
    if (!trimmed || trimmed.includes(' ')) return;
    onGiveClue(trimmed, clueCount);
    setClueWord('');
  };

  const isSpymasterTurn = isMyTeamTurn && isSpymaster && !activeClue;
  const isOperativeTurn = isMyTeamTurn && !isSpymaster && activeClue;

  return (
    <div className={`clue-bar-wrap team-${currentTeam}`}>
      {/* View 1: Spymaster gives clue */}
      {isSpymasterTurn && (
        <form onSubmit={handleSubmitClue} className="spymaster-form">
          <span className="clue-label">SPYMASTER CLUE:</span>
          <input
            type="text"
            placeholder="ONE WORD CLUE"
            maxLength={20}
            value={clueWord}
            onChange={(e) => setClueWord(e.target.value.replace(/\s+/g, ''))}
            className="clue-input"
            autoFocus
          />
          <select
            value={clueCount}
            onChange={(e) => setClueCount(parseInt(e.target.value, 10))}
            className="count-select"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <button type="submit" disabled={!clueWord.trim()} className="clue-btn">
            Send Clue
          </button>
        </form>
      )}

      {/* View 2: Active Clue display for operatives */}
      {activeClue && (
        <div className="active-clue-display">
          <div className="clue-text-group">
            <span className="clue-team-pill">{currentTeam.toUpperCase()} CLUE:</span>
            <strong className="clue-word">{activeClue.word}</strong>
            <span className="clue-count-badge">for {activeClue.count} cards</span>
          </div>

          <div className="guesses-right">
            <span className="guesses-left-text">
              Guesses left: <strong>{remainingGuesses}</strong>
            </span>
            {isOperativeTurn && (
              <button type="button" onClick={onEndTurn} className="end-turn-btn">
                Pass / End Turn
              </button>
            )}
          </div>
        </div>
      )}

      {/* View 3: Waiting for other team's Spymaster */}
      {!isSpymasterTurn && !activeClue && (
        <div className="waiting-clue-state">
          <div className="waiting-spinner"></div>
          <span>Waiting for {currentTeam.toUpperCase()} Team Spymaster to give a clue...</span>
        </div>
      )}

      <style>{`
        .clue-bar-wrap {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          padding: 10px 16px;
          width: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .team-red {
          border-left: 4px solid #ef4444;
        }

        .team-blue {
          border-left: 4px solid #3b82f6;
        }

        .spymaster-form {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
        }

        .clue-label {
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          white-space: nowrap;
        }

        .clue-input {
          flex: 1;
          background: #1e293b;
          border: 1px solid #334155;
          color: #f8fafc;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono, monospace);
          font-size: 14px;
          font-weight: 700;
          outline: none;
        }

        .count-select {
          background: #1e293b;
          border: 1px solid #334155;
          color: #f8fafc;
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          font-weight: 700;
        }

        .clue-btn {
          padding: 8px 16px;
          background: var(--accent-default);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-sm);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }

        .active-clue-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .clue-text-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .clue-team-pill {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 3px;
          background: #1e293b;
          color: #94a3b8;
        }

        .clue-word {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.05em;
          color: #f8fafc;
          font-family: var(--font-mono, monospace);
        }

        .clue-count-badge {
          font-size: 12px;
          color: #38bdf8;
          font-weight: 600;
        }

        .guesses-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .guesses-left-text {
          font-size: 12px;
          color: #94a3b8;
        }

        .guesses-left-text strong {
          color: #f8fafc;
        }

        .end-turn-btn {
          padding: 6px 12px;
          background: #334155;
          border: 1px solid #475569;
          color: #f8fafc;
          border-radius: var(--radius-sm);
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
        }

        .end-turn-btn:hover {
          background: #475569;
        }

        .waiting-clue-state {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #94a3b8;
        }

        .waiting-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #334155;
          border-top-color: #38bdf8;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
