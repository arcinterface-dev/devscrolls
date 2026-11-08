import React, { useState, useEffect, useRef } from 'react';
import { generateLevel, type LevelData } from './LevelGenerator';
import { GraphCanvas } from './GraphCanvas';
import { GameOverScreen } from '../shared/GameOverScreen';
import { storage } from '../shared/storage';

export const GitUntangler: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [moves, setMoves] = useState(0);
  const [crossings, setCrossings] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [stars, setStars] = useState(3);

  const timerRef = useRef<any>(null);

  // Load level
  const initLevel = (lvl: number) => {
    // Generate level based on canvas estimated dimension
    const w = typeof window !== 'undefined' ? Math.min(840, window.innerWidth - 32) : 600;
    const h = 500;
    const data = generateLevel(lvl, w, h);
    setLevelData(data);
    setCrossings(data.initialCrossings);
    setMoves(0);
    setElapsedSeconds(0);
    setIsWon(false);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  useEffect(() => {
    initLevel(currentLevel);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentLevel]);

  const handleVictory = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate star rating
    let earnedStars = 1;
    if (levelData) {
      if (moves <= levelData.parMoves) {
        earnedStars = 3;
      } else if (moves <= Math.ceil(levelData.parMoves * 1.5)) {
        earnedStars = 2;
      }
    }
    setStars(earnedStars);
    setIsWon(true);

    // Record high score and streak
    storage.recordGameFinished('git-untangler', currentLevel, {
      moves,
      time: elapsedSeconds,
      stars: earnedStars,
    });
    storage.setHighScore('git-untangler', currentLevel);
  };

  const handleNextLevel = () => {
    setCurrentLevel((prev) => prev + 1);
  };

  const getCustomShareText = (): string => {
    const starEmoji = '⭐'.repeat(stars);
    return `🌿 Git Untangler | Level ${currentLevel} Untangled!\n` +
      `${starEmoji} | ${moves} moves (Par: ${levelData?.parMoves}) | ${elapsedSeconds}s\n` +
      `Untangle the DAG without crossing commits: https://devscrolls.dev/arcade/git-untangler/`;
  };

  return (
    <div className="untangler-root">
      {/* HUD Header */}
      <div className="untangler-hud">
        <div className="hud-left">
          <span className="level-badge">LEVEL {currentLevel}</span>
          <span className={`crossings-indicator ${crossings === 0 ? 'zero' : ''}`}>
            {crossings === 0 ? '✨ 0 Crossings (DAG Untangled!)' : `⚠️ ${crossings} Crossings remaining`}
          </span>
        </div>

        <div className="hud-right">
          <div className="hud-stat-box">
            <span className="stat-label">MOVES</span>
            <span className="stat-value">{moves} <small>/ Par {levelData?.parMoves || 5}</small></span>
          </div>
          <div className="hud-stat-box">
            <span className="stat-label">TIME</span>
            <span className="stat-value">{elapsedSeconds}s</span>
          </div>
          <button
            type="button"
            onClick={() => initLevel(currentLevel)}
            className="untangler-reset-btn"
            title="Reset this puzzle"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Interactive Canvas Surface */}
      <div className="canvas-wrapper">
        {levelData && (
          <GraphCanvas
            nodes={levelData.nodes}
            edges={levelData.edges}
            onCrossingsUpdate={(c) => setCrossings(c)}
            onMoveComplete={() => setMoves((m) => m + 1)}
            onVictory={handleVictory}
          />
        )}
      </div>

      {/* Win Modal */}
      {isWon && (
        <div className="victory-modal-overlay">
          <div className="victory-card">
            <div className="victory-stars">
              {'⭐'.repeat(stars)}
            </div>
            <h2 className="victory-title">Merge Conflict Resolved!</h2>
            <p className="victory-desc">
              You completely untangled Level {currentLevel} in {moves} moves ({elapsedSeconds}s).
            </p>

            <div className="victory-stats-row">
              <div className="v-stat">
                <span>Moves</span>
                <strong>{moves}</strong>
              </div>
              <div className="v-stat">
                <span>Par</span>
                <strong>{levelData?.parMoves}</strong>
              </div>
              <div className="v-stat">
                <span>Rating</span>
                <strong>{stars === 3 ? 'Flawless' : stars === 2 ? 'Great' : 'Clear'}</strong>
              </div>
            </div>

            <div className="victory-actions">
              <button type="button" onClick={handleNextLevel} className="victory-btn btn-next">
                <span>Next Level ({currentLevel + 1}) →</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(getCustomShareText());
                  alert('Results copied to clipboard!');
                }}
                className="victory-btn btn-share"
              >
                Share Solution
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .untangler-root {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 14px;
          box-sizing: border-box;
          max-width: 980px;
          margin: 0 auto;
        }

        .untangler-hud {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 10px 16px;
        }

        .hud-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .level-badge {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          background: #10b981;
          color: #ffffff;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
        }

        .crossings-indicator {
          font-size: 13px;
          font-weight: 700;
          color: #ef4444;
          font-family: var(--font-mono, monospace);
        }

        .crossings-indicator.zero {
          color: #10b981;
        }

        .hud-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .hud-stat-box {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .stat-label {
          font-size: 9.5px;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-family: var(--font-mono, monospace);
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-value small {
          font-size: 11px;
          color: var(--text-muted);
        }

        .untangler-reset-btn {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }

        .untangler-reset-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-default);
        }

        .canvas-wrapper {
          flex: 1;
          min-height: 480px;
          display: flex;
        }

        /* Victory Overlay */
        .victory-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 100;
          animation: popIn 0.25s ease-out;
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .victory-card {
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 28px;
          max-width: 440px;
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .victory-stars {
          font-size: 32px;
          line-height: 1;
        }

        .victory-title {
          font-size: 22px;
          font-weight: 800;
          margin: 0;
          color: var(--text-primary);
        }

        .victory-desc {
          font-size: 13.5px;
          color: var(--text-muted);
          margin: 0;
        }

        .victory-stats-row {
          display: flex;
          justify-content: center;
          gap: 24px;
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 10px 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .v-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .v-stat span {
          font-size: 10px;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 700;
        }

        .v-stat strong {
          font-size: 16px;
          font-family: var(--font-mono, monospace);
          color: var(--accent-default);
        }

        .victory-actions {
          display: flex;
          gap: 10px;
          width: 100%;
        }

        .victory-btn {
          flex: 1;
          padding: 12px;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: transform 0.2s;
        }

        .btn-next {
          background: #10b981;
          color: #ffffff;
        }

        .btn-next:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .btn-share {
          background: var(--surface-sunken);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
        }

        .btn-share:hover {
          background: var(--surface-base);
        }
      `}</style>
    </div>
  );
};
