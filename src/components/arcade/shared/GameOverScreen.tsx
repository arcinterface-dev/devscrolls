import React, { useState } from 'react';

export interface PlayerResult {
  displayName: string;
  score: number;
  rank?: number;
  details?: string;
  isMe?: boolean;
}

interface GameOverScreenProps {
  gameId: string;
  gameTitle: string;
  score?: number;
  unit?: string; // e.g. "WPM", "pts", "seconds"
  highScore?: number;
  isNewHighScore?: boolean;
  streak?: number;
  playerResults?: PlayerResult[];
  onPlayAgain: () => void;
  onShareCustomText?: () => string;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  gameId,
  gameTitle,
  score,
  unit = 'pts',
  highScore,
  isNewHighScore = false,
  streak = 0,
  playerResults,
  onPlayAgain,
  onShareCustomText,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    let shareText = '';
    if (onShareCustomText) {
      shareText = onShareCustomText();
    } else if (playerResults && playerResults.length > 0) {
      const top = playerResults.slice(0, 3).map((p, i) => `${i + 1}. ${p.displayName}: ${p.score}`).join('\n');
      shareText = `🎮 DevScrolls Games: ${gameTitle} Match Results\n\n${top}\n\nPlay with your team: https://devscrolls.dev/games/${gameId}/`;
    } else {
      shareText = `🎮 Just scored ${score} ${unit} in ${gameTitle} on DevScrolls Games!${isNewHighScore ? ' 🏆 New Personal Best!' : ''}${streak > 1 ? ` 🔥 ${streak}-day streak!` : ''}\n\nBeat my score: https://devscrolls.dev/games/${gameId}/`;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy share text:', e);
    }
  };

  return (
    <div className="gameover-overlay">
      <div className="gameover-card">
        {isNewHighScore && (
          <div className="gameover-record-banner">
            ✨ NEW PERSONAL RECORD! ✨
          </div>
        )}

        <div className="gameover-header">
          <span className="gameover-trophy">{isNewHighScore ? '🏆' : '🎯'}</span>
          <h2 className="gameover-title">Game Finished!</h2>
          <p className="gameover-subtitle">{gameTitle}</p>
        </div>

        {/* Solo Score Display */}
        {score !== undefined && !playerResults && (
          <div className="gameover-score-box">
            <div className="score-main">
              <span className="score-num">{score}</span>
              <span className="score-unit">{unit}</span>
            </div>

            <div className="score-stats-grid">
              {highScore !== undefined && (
                <div className="stat-pill">
                  <span className="stat-pill-label">Best Record</span>
                  <span className="stat-pill-val">{highScore} {unit}</span>
                </div>
              )}
              {streak > 0 && (
                <div className="stat-pill">
                  <span className="stat-pill-label">Daily Streak</span>
                  <span className="stat-pill-val">🔥 {streak} days</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Multiplayer Podium Display */}
        {playerResults && playerResults.length > 0 && (
          <div className="gameover-podium-section">
            <h3 className="podium-heading">Match Standings</h3>
            <div className="podium-list">
              {playerResults.map((p, idx) => {
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                return (
                  <div key={p.displayName + idx} className={`podium-row ${p.isMe ? 'podium-me' : ''} ${idx === 0 ? 'podium-winner' : ''}`}>
                    <span className="podium-rank">{medal}</span>
                    <span className="podium-name">
                      {p.displayName} {p.isMe && '(You)'}
                    </span>
                    <span className="podium-score">{p.score} {unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="gameover-actions">
          <button type="button" onClick={onPlayAgain} className="action-btn action-play-again">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19"/>
            </svg>
            <span>Play Again</span>
          </button>

          <button type="button" onClick={handleShare} className={`action-btn action-share ${copied ? 'copied' : ''}`}>
            {copied ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Result Copied!</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                <span>Share Result</span>
              </>
            )}
          </button>
        </div>

        {/* DevScrolls Contextual Cross-Links */}
        <div className="gameover-crosslink-card">
          <span className="crosslink-title">Next on DevScrolls:</span>
          <div className="crosslink-grid">
            <a href="/tools/" className="crosslink-item">
              <span className="crosslink-icon">🛠️</span>
              <div className="crosslink-text">
                <strong>Dev Tools</strong>
                <small>PII Scrub, JWT, JSON</small>
              </div>
            </a>
            <a href="/jobs/" className="crosslink-item">
              <span className="crosslink-icon">💼</span>
              <div className="crosslink-text">
                <strong>Remote Jobs</strong>
                <small>Direct ATS apply</small>
              </div>
            </a>
            <a href="/articles/" className="crosslink-item">
              <span className="crosslink-icon">📖</span>
              <div className="crosslink-text">
                <strong>Engineering</strong>
                <small>Senior deep dives</small>
              </div>
            </a>
          </div>
        </div>

        <div className="gameover-footer-hub">
          <a href="/games/" className="hub-return-link">← Return to All Games</a>
        </div>
      </div>

      <style>{`
        .gameover-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
          z-index: 100;
          animation: fadeIn 0.25s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .gameover-card {
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          max-width: 480px;
          width: 100%;
          padding: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          position: relative;
          overflow: hidden;
        }

        .gameover-record-banner {
          background: linear-gradient(90deg, #f59e0b, #ef4444);
          color: #ffffff;
          font-weight: 800;
          font-size: 12px;
          text-align: center;
          padding: 6px 0;
          letter-spacing: 0.08em;
          margin: -24px -24px 8px -24px;
        }

        .gameover-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .gameover-trophy {
          font-size: 44px;
          line-height: 1;
        }

        .gameover-title {
          font-size: 24px;
          font-weight: 800;
          margin: 0;
          color: var(--text-primary);
        }

        .gameover-subtitle {
          font-size: 14px;
          color: var(--text-muted);
          margin: 0;
        }

        .gameover-score-box {
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 16px;
          text-align: center;
        }

        .score-main {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .score-num {
          font-size: 48px;
          font-weight: 900;
          color: var(--accent-default);
          line-height: 1;
          font-family: var(--font-mono, monospace);
        }

        .score-unit {
          font-size: 16px;
          color: var(--text-muted);
          font-weight: 700;
        }

        .score-stats-grid {
          display: flex;
          justify-content: center;
          gap: 16px;
          border-top: 1px solid var(--border-subtle);
          padding-top: 10px;
        }

        .stat-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-pill-label {
          font-size: 11px;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 600;
        }

        .stat-pill-val {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .podium-section {
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 12px;
        }

        .podium-heading {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin: 0 0 8px 0;
          text-align: center;
        }

        .podium-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .podium-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font-size: 14px;
        }

        .podium-winner {
          border-color: #f59e0b;
          background: color-mix(in srgb, #f59e0b 10%, var(--surface-raised));
        }

        .podium-me {
          font-weight: 700;
          border-color: var(--accent-default);
        }

        .podium-rank {
          font-size: 16px;
          width: 28px;
        }

        .podium-name {
          flex: 1;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .podium-score {
          font-family: var(--font-mono, monospace);
          font-weight: 700;
          color: var(--accent-default);
        }

        .gameover-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          border: none;
        }

        .action-play-again {
          background: var(--accent-default);
          color: #ffffff;
        }

        .action-play-again:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .action-share {
          background: var(--surface-sunken);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
        }

        .action-share:hover {
          background: var(--surface-base);
          border-color: var(--accent-default);
        }

        .action-share.copied {
          background: #10b981;
          border-color: #10b981;
          color: #ffffff;
        }

        .gameover-crosslink-card {
          background: var(--surface-base);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .crosslink-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .crosslink-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .crosslink-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 8px 6px;
          border-radius: var(--radius-sm);
          text-decoration: none;
          color: var(--text-primary);
          background: var(--surface-sunken);
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }

        .crosslink-item:hover {
          border-color: var(--accent-default);
          transform: translateY(-1px);
        }

        .crosslink-icon {
          font-size: 18px;
          margin-bottom: 2px;
        }

        .crosslink-text strong {
          display: block;
          font-size: 11px;
          font-weight: 700;
        }

        .crosslink-text small {
          font-size: 9px;
          color: var(--text-muted);
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .gameover-footer-hub {
          text-align: center;
        }

        .hub-return-link {
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .hub-return-link:hover {
          color: var(--accent-default);
        }
      `}</style>
    </div>
  );
};
