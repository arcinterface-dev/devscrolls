import React, { useState, useEffect } from 'react';
import { ITEMS, type AiOrHumanItem } from './data';

export const AiOrHuman: React.FC = () => {
  const [deck, setDeck] = useState<AiOrHumanItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'ai' | 'human' | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // Shuffle 10 items
  const startNewGame = () => {
    const shuffled = [...ITEMS].sort(() => 0.5 - Math.random()).slice(0, 10);
    setDeck(shuffled);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setStreak(0);
    setIsGameOver(false);
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const currentItem = deck[currentIndex];

  const handleVote = (vote: 'ai' | 'human') => {
    if (selectedAnswer !== null || !currentItem) return;

    setSelectedAnswer(vote);
    const isCorrect = vote === currentItem.source;

    if (isCorrect) {
      setScore((prev) => prev + 100 + streak * 25);
      setStreak((prev) => {
        const next = prev + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsGameOver(true);
    }
  };

  if (!currentItem && !isGameOver) {
    return <div className="loading-state">Loading snippets...</div>;
  }

  // End Game Screen
  if (isGameOver) {
    const accuracy = Math.round((score / (deck.length * 100)) * 100);
    let title = 'Turing Master';
    if (accuracy < 50) title = 'Fooled by ChatGPT';
    else if (accuracy < 80) title = 'Silicon Spotter';

    return (
      <div className="aor-container">
        <div className="aor-game-over-card">
          <span className="game-over-icon">🏆</span>
          <h2 className="game-over-title">{title}</h2>
          <p className="game-over-subtitle">You scored <strong>{score}</strong> points ({accuracy}% accuracy)</p>

          <div className="stats-row">
            <div className="stat-box">
              <span className="stat-val">{score}</span>
              <span className="stat-lbl">Final Score</span>
            </div>
            <div className="stat-box">
              <span className="stat-val">🔥 {maxStreak}</span>
              <span className="stat-lbl">Best Streak</span>
            </div>
          </div>

          <button type="button" onClick={startNewGame} className="restart-btn">
            Play Again ❯
          </button>
        </div>
      </div>
    );
  }

  const isAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === currentItem?.source;

  return (
    <div className="aor-container">
      {/* Top Meta Bar */}
      <header className="aor-header">
        <div className="header-meta-left">
          <span className="game-logo-icon">🤖</span>
          <div>
            <h1 className="game-title">AI or Human?</h1>
            <span className="progress-badge">Round {currentIndex + 1} of {deck.length}</span>
          </div>
        </div>

        <div className="header-meta-right">
          <div className="score-badge">
            <span className="score-val">{score}</span>
            <span className="score-lbl">pts</span>
          </div>
          {streak > 1 && (
            <div className="streak-badge">
              🔥 {streak}x streak!
            </div>
          )}
        </div>
      </header>

      {/* Snippet Card */}
      <main className="snippet-main">
        <div className="snippet-context-bar">
          <span className="category-pill">{currentItem.category.toUpperCase()}</span>
          <span className="context-label">{currentItem.context}</span>
        </div>

        <div className="code-card">
          <div className="window-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <pre className="code-display">
            <code>{currentItem.snippet}</code>
          </pre>
        </div>
      </main>

      {/* Choice Buttons / Reveal Card */}
      {!isAnswered ? (
        <footer className="voting-section">
          <p className="vote-prompt">Who produced this code or comment?</p>
          <div className="voting-buttons-grid">
            <button
              type="button"
              onClick={() => handleVote('ai')}
              className="vote-btn vote-ai"
            >
              <span className="btn-icon">🤖</span>
              <div className="btn-labels">
                <span className="btn-title">AI Hallucination</span>
                <span className="btn-sub">ChatGPT / Copilot / LLM</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleVote('human')}
              className="vote-btn vote-human"
            >
              <span className="btn-icon">👨‍💻</span>
              <div className="btn-labels">
                <span className="btn-title">Human Developer</span>
                <span className="btn-sub">Junior Dev at 3 AM</span>
              </div>
            </button>
          </div>
        </footer>
      ) : (
        <footer className="reveal-section">
          <div className={`reveal-card ${isCorrect ? 'reveal-correct' : 'reveal-incorrect'}`}>
            <div className="reveal-badge-row">
              <span className="verdict-icon">{isCorrect ? '✅' : '❌'}</span>
              <strong className="verdict-text">
                {isCorrect ? 'Spot on! Correct!' : 'Fooled! Incorrect!'}
              </strong>
              <span className="actual-source-tag">
                Actually by: <strong>{currentItem.source === 'ai' ? '🤖 AI' : '👨‍💻 Human'}</strong>
              </span>
            </div>

            <p className="explanation-text">{currentItem.explanation}</p>

            <button type="button" onClick={handleNext} className="next-btn" autoFocus>
              {currentIndex + 1 < deck.length ? 'Next Snippet ❯' : 'See Results 🏆'}
            </button>
          </div>
        </footer>
      )}

      <style>{`
        .aor-container {
          max-width: 640px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 12px 16px 32px;
          box-sizing: border-box;
          min-height: calc(100vh - 120px);
        }

        .aor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid #1e293b;
        }

        .header-meta-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .game-logo-icon {
          font-size: 28px;
        }

        .game-title {
          font-size: 20px;
          font-weight: 850;
          color: #ffffff;
          margin: 0;
          line-height: 1.2;
        }

        .progress-badge {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
        }

        .header-meta-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .score-badge {
          background: #1e293b;
          border: 1px solid #334155;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .score-val {
          font-size: 16px;
          font-weight: 850;
          color: #38bdf8;
        }

        .score-lbl {
          font-size: 10px;
          color: #94a3b8;
          font-weight: 700;
        }

        .streak-badge {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: var(--radius-full);
          animation: pulse 1.2s infinite;
        }

        /* Snippet main */
        .snippet-main {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .snippet-context-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .category-pill {
          font-size: 10px;
          font-weight: 800;
          background: #1e293b;
          color: #cbd5e1;
          padding: 2px 7px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }

        .context-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
        }

        .code-card {
          background: #090d16;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }

        .window-dots {
          display: flex;
          gap: 6px;
          padding: 10px 14px;
          background: #0f172a;
          border-bottom: 1px solid #1e293b;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .dot.red { background: #ef4444; }
        .dot.yellow { background: #eab308; }
        .dot.green { background: #22c55e; }

        .code-display {
          margin: 0;
          padding: 18px;
          font-family: var(--font-mono, monospace);
          font-size: 13.5px;
          line-height: 1.5;
          color: #e2e8f0;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* Voting */
        .voting-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .vote-prompt {
          font-size: 14px;
          font-weight: 750;
          color: #94a3b8;
          text-align: center;
          margin: 0;
        }

        .voting-buttons-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .vote-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: var(--radius-md);
          padding: 16px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .vote-btn:hover {
          transform: translateY(-2px);
        }

        .vote-ai:hover {
          background: color-mix(in srgb, #06b6d4 15%, #1e293b);
          border-color: #06b6d4;
        }

        .vote-human:hover {
          background: color-mix(in srgb, #f59e0b 15%, #1e293b);
          border-color: #f59e0b;
        }

        .btn-icon {
          font-size: 32px;
        }

        .btn-labels {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .btn-title {
          font-size: 15px;
          font-weight: 850;
          color: #ffffff;
        }

        .btn-sub {
          font-size: 11px;
          color: #94a3b8;
        }

        /* Reveal Section */
        .reveal-section {
          animation: popReveal 0.25s ease-out;
        }

        @keyframes popReveal {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .reveal-card {
          border-radius: var(--radius-md);
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #0f172a;
          border: 1px solid #334155;
        }

        .reveal-correct {
          border-color: #10b981;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
        }

        .reveal-incorrect {
          border-color: #ef4444;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.15);
        }

        .reveal-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .verdict-icon {
          font-size: 20px;
        }

        .verdict-text {
          font-size: 15px;
          color: #ffffff;
        }

        .actual-source-tag {
          margin-left: auto;
          font-size: 12px;
          color: #cbd5e1;
          background: #1e293b;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .explanation-text {
          font-size: 13px;
          line-height: 1.5;
          color: #94a3b8;
          margin: 0;
        }

        .next-btn {
          align-self: flex-end;
          background: #38bdf8;
          color: #0c4a6e;
          border: none;
          font-size: 13px;
          font-weight: 800;
          padding: 8px 18px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 0.15s;
        }
        .next-btn:hover {
          background: #0284c7;
          color: #ffffff;
        }

        /* End Game Card */
        .aor-game-over-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-xl);
          padding: 36px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .game-over-icon {
          font-size: 48px;
        }

        .game-over-title {
          font-size: 26px;
          font-weight: 850;
          color: #ffffff;
          margin: 0;
        }

        .game-over-subtitle {
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
        }

        .stats-row {
          display: flex;
          gap: 16px;
          margin: 12px 0;
        }

        .stat-box {
          background: #1e293b;
          border: 1px solid #334155;
          padding: 12px 24px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-val {
          font-size: 22px;
          font-weight: 850;
          color: #ffffff;
        }

        .stat-lbl {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 700;
        }

        .restart-btn {
          background: #06b6d4;
          color: #083344;
          border: none;
          font-size: 14px;
          font-weight: 800;
          padding: 10px 24px;
          border-radius: var(--radius-md);
          cursor: pointer;
        }
        .restart-btn:hover {
          background: #0891b2;
          color: #ffffff;
        }

        @media (max-width: 500px) {
          .voting-buttons-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

