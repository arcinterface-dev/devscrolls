import React, { useState, useEffect, useRef } from 'react';
import {
  initNewGame,
  moveGrid,
  type GameState,
  type MoveDirection,
} from './GameEngine';
import { GameBoard } from './GameBoard';
import { TILE_THEMES } from './constants';
import { storage } from '../shared/storage';

export const TechTiles2048: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => initNewGame(0));
  const [history, setHistory] = useState<GameState[]>([]);
  const [showWinModal, setShowWinModal] = useState(false);

  useEffect(() => {
    const best = storage.getHighScore('2048-tech');
    // Try restore persisted game
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ds_arcade_2048_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          setGameState({
            ...parsed,
            bestScore: Math.max(best, parsed.score || 0),
            mergedCells: new Set(),
            spawnedCell: null,
          });
          return;
        }
      } catch {}
    }
    setGameState(initNewGame(best));
  }, []);

  const handleMove = (direction: MoveDirection) => {
    if (gameState.isGameOver) return;

    const nextState = moveGrid(gameState, direction);

    // If board changed, save history for undo
    if (nextState !== gameState) {
      setHistory((prev) => [...prev.slice(-10), gameState]);
      setGameState(nextState);

      // Check new high score
      if (nextState.score > nextState.bestScore) {
        storage.setHighScore('2048-tech', nextState.score);
      }

      // Check win trigger
      if (nextState.hasWon && !gameState.hasWon && !nextState.hasContinuedPastWin) {
        setShowWinModal(true);
      }

      // If game over
      if (nextState.isGameOver) {
        storage.recordGameFinished('2048-tech', nextState.score);
      }

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('ds_arcade_2048_state', JSON.stringify(nextState));
      }
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setGameState(previous);
  };

  const handleRestart = () => {
    const best = storage.getHighScore('2048-tech');
    const fresh = initNewGame(best);
    setGameState(fresh);
    setHistory([]);
    setShowWinModal(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ds_arcade_2048_state');
    }
  };

  // Find highest tile on board
  let highestVal = 2;
  gameState.grid.forEach((row) =>
    row.forEach((v) => {
      if (v > highestVal) highestVal = v;
    })
  );

  const highestMeta = TILE_THEMES[highestVal] || { label: 'Tech Titan' };

  // Generate 4x4 emoji board string
  const getEmojiMatrix = (): string => {
    return gameState.grid
      .map((row) =>
        row
          .map((v) => {
            if (v === 0) return '⬛';
            return TILE_THEMES[v]?.emoji || '🟨';
          })
          .join('')
      )
      .join('\n');
  };

  const getCustomShareText = (): string => {
    return `🧮 2048: Tech Evolution\n` +
      `Score: ${gameState.score.toLocaleString()} | Evolved to: ${highestMeta.label} (${highestVal})\n` +
      `${getEmojiMatrix()}\n` +
      `Can you evolve to Quantum AI? https://devscrolls.dev/arcade/2048/`;
  };

  return (
    <div className="game2048-root">
      {/* HUD Header */}
      <div className="game2048-hud">
        <div className="title-area">
          <h1 className="hud-title">2048</h1>
          <span className="hud-tagline">TECH EVOLUTION</span>
        </div>

        <div className="scores-area">
          <div className="score-badge">
            <span className="score-title">SCORE</span>
            <strong className="score-val">{gameState.score.toLocaleString()}</strong>
          </div>
          <div className="score-badge">
            <span className="score-title">BEST</span>
            <strong className="score-val">{gameState.bestScore.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Control Actions Bar */}
      <div className="actions-bar">
        <div className="highest-tile-preview">
          <span>Top Era:</span>
          <strong>{highestMeta.label} ({highestVal})</strong>
        </div>

        <div className="buttons-group">
          <button
            type="button"
            disabled={history.length === 0}
            onClick={handleUndo}
            className="ctrl-btn btn-undo"
            title="Undo last move"
          >
            ↩ Undo
          </button>
          <button
            type="button"
            onClick={handleRestart}
            className="ctrl-btn btn-restart"
            title="Start new game"
          >
            Restart
          </button>
        </div>
      </div>

      {/* Main 4x4 Interactive Grid */}
      <div className="board-wrap">
        <GameBoard
          grid={gameState.grid}
          mergedCells={gameState.mergedCells}
          spawnedCell={gameState.spawnedCell}
          onMove={handleMove}
        />

        {/* Game Over Overlay */}
        {gameState.isGameOver && (
          <div className="overlay-modal">
            <div className="overlay-card">
              <span className="overlay-icon">💀</span>
              <h2>No More Moves!</h2>
              <p>You reached {highestMeta.label} ({highestVal}) with {gameState.score.toLocaleString()} points.</p>
              <div className="overlay-actions">
                <button type="button" onClick={handleRestart} className="modal-btn btn-primary">
                  Play Again
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getCustomShareText());
                    alert('Results copied to clipboard!');
                  }}
                  className="modal-btn btn-secondary"
                >
                  Share Score
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2048 Win Modal */}
        {showWinModal && (
          <div className="overlay-modal">
            <div className="overlay-card win-card">
              <span className="overlay-icon">✨</span>
              <h2>Quantum Supremacy!</h2>
              <p>You successfully evolved computing history to the 2048 <strong>Quantum AI</strong> tile!</p>
              <div className="overlay-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowWinModal(false);
                    setGameState((prev) => ({ ...prev, hasContinuedPastWin: true }));
                  }}
                  className="modal-btn btn-primary"
                >
                  Keep Playing (Endless)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getCustomShareText());
                    alert('Achievement copied to clipboard!');
                  }}
                  className="modal-btn btn-secondary"
                >
                  Share Milestone
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Touch & Keyboard Instructions */}
      <div className="controls-tips">
        <span>Use <strong>Arrow Keys</strong>, <strong>WASD</strong>, or <strong>Swipe</strong> on mobile to slide tiles.</span>
      </div>

      <style>{`
        .game2048-root {
          max-width: 480px;
          width: 100%;
          min-height: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 16px;
          box-sizing: border-box;
        }

        .game2048-hud {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .hud-title {
          font-size: 34px;
          font-weight: 900;
          color: var(--accent-default);
          margin: 0;
          line-height: 1;
          font-family: var(--font-mono, monospace);
        }

        .hud-tagline {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }

        .scores-area {
          display: flex;
          gap: 8px;
        }

        .score-badge {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          padding: 6px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 70px;
        }

        .score-title {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #64748b;
        }

        .score-val {
          font-family: var(--font-mono, monospace);
          font-size: 16px;
          font-weight: 800;
          color: #f8fafc;
        }

        .actions-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: #0b1329;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          padding: 8px 12px;
        }

        .highest-tile-preview {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #94a3b8;
        }

        .highest-tile-preview strong {
          color: #ec4899;
        }

        .buttons-group {
          display: flex;
          gap: 6px;
        }

        .ctrl-btn {
          font-size: 12px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          border: 1px solid #334155;
          background: #1e293b;
          color: #f8fafc;
          transition: all 0.15s;
        }

        .ctrl-btn:hover:not(:disabled) {
          border-color: var(--accent-default);
          background: #334155;
        }

        .ctrl-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .board-wrap {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .overlay-modal {
          position: absolute;
          inset: 0;
          background: rgba(11, 19, 41, 0.92);
          backdrop-filter: blur(6px);
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 10;
          animation: popIn 0.25s ease-out;
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .overlay-card {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          max-width: 320px;
        }

        .overlay-icon {
          font-size: 40px;
          line-height: 1;
        }

        .overlay-card h2 {
          font-size: 22px;
          font-weight: 800;
          margin: 0;
          color: #ffffff;
        }

        .overlay-card p {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
          line-height: 1.4;
        }

        .overlay-actions {
          display: flex;
          gap: 8px;
          width: 100%;
          margin-top: 6px;
        }

        .modal-btn {
          flex: 1;
          padding: 10px;
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: transform 0.2s;
        }

        .btn-primary {
          background: var(--accent-default);
          color: #ffffff;
        }

        .btn-primary:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #1e293b;
          border: 1px solid #334155;
          color: #f8fafc;
        }

        .controls-tips {
          font-size: 11px;
          color: #64748b;
          text-align: center;
        }
      `}</style>
    </div>
  );
};
