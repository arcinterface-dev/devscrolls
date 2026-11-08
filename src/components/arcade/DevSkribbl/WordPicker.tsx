import React, { useState, useEffect } from 'react';

interface WordPickerProps {
  words: string[];
  onSelectWord: (word: string) => void;
}

export const WordPicker: React.FC<WordPickerProps> = ({ words, onSelectWord }) => {
  const [secondsLeft, setSecondsLeft] = useState(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Timeout reached: Auto-pick random word from choices
          const randomChoice = words[Math.floor(Math.random() * words.length)] || words[0];
          onSelectWord(randomChoice);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [words, onSelectWord]);

  return (
    <div className="word-picker-overlay">
      <div className="word-picker-card">
        <span className="picker-icon">🎨</span>
        <h2 className="picker-title">Pick a Word to Draw</h2>
        <p className="picker-subtitle">Choose one tech concept to sketch for your team:</p>

        {/* 15s Countdown Badge */}
        <div className="picker-timer-badge">
          <span className="timer-icon">⏱️</span>
          <span>Auto-picking random word in <strong>{secondsLeft}s</strong></span>
        </div>

        {/* Word Options Grid */}
        <div className="words-options-grid">
          {words.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onSelectWord(w)}
              className="word-select-btn"
            >
              <span className="word-text">{w}</span>
              <span className="word-len">({w.replace(/\s+/g, '').length} chars{w.includes(' ') ? ' • 2 words' : ''})</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .word-picker-overlay {
          position: absolute;
          inset: 0;
          background: rgba(11, 19, 41, 0.92);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 50;
          animation: popIn 0.2s ease-out;
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }

        .word-picker-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-xl);
          padding: 28px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6);
        }

        .picker-icon {
          font-size: 38px;
          line-height: 1;
        }

        .picker-title {
          font-size: 22px;
          font-weight: 850;
          margin: 0;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .picker-subtitle {
          font-size: 13.5px;
          color: #94a3b8;
          margin: 0;
        }

        .picker-timer-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          color: #f59e0b;
        }
        .picker-timer-badge strong {
          color: #fbbf24;
          font-family: var(--font-mono, monospace);
        }

        .words-options-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          margin-top: 4px;
        }

        .word-select-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: var(--radius-md);
          color: #ffffff;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
        }
        .word-select-btn:hover {
          background: var(--accent-default);
          border-color: var(--accent-default);
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(217, 119, 6, 0.3);
        }

        .word-text {
          font-size: 16px;
          font-weight: 750;
        }

        .word-len {
          font-size: 12px;
          color: #94a3b8;
        }
        .word-select-btn:hover .word-len {
          color: rgba(255, 255, 255, 0.85);
        }
      `}</style>
    </div>
  );
};
