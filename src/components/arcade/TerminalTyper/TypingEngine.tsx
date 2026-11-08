import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WpmTracker } from './WpmTracker';

interface TypingEngineProps {
  snippet: string;
  language: string;
  mode: string;
  onFinish: (results: {
    wpm: number;
    accuracy: number;
    elapsedSeconds: number;
    errorMap: Record<string, number>;
  }) => void;
  onAbort: () => void;
}

export const TypingEngine: React.FC<TypingEngineProps> = ({
  snippet,
  language,
  mode,
  onFinish,
  onAbort,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);

  const trackerRef = useRef<WpmTracker>(new WpmTracker());
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<any>(null);

  // Focus invisible input on mount and keep focused on click
  useEffect(() => {
    trackerRef.current.start();
    if (inputRef.current) {
      inputRef.current.focus();
    }

    intervalRef.current = setInterval(() => {
      const metrics = trackerRef.current.getMetrics();
      setLiveWpm(metrics.wpm);
      setLiveAccuracy(metrics.accuracy);
    }, 400);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Ignore meta/modifier keys
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
        return;
      }

      // Escape to abort
      if (e.key === 'Escape') {
        onAbort();
        return;
      }

      // Handle Tab (common in code snippets)
      if (e.key === 'Tab') {
        e.preventDefault();
      }

      const expectedChar = snippet[currentIndex];
      let typedChar = e.key;

      if (e.key === 'Enter') {
        typedChar = '\n';
      }

      // Check keypress against expected
      const isCorrect = trackerRef.current.recordKey(expectedChar, typedChar);

      if (isCorrect) {
        setHasError(false);
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);

        // Check if finished
        if (nextIndex >= snippet.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          const finalMetrics = trackerRef.current.getMetrics();
          onFinish(finalMetrics);
        }
      } else {
        setHasError(true);
      }
    },
    [currentIndex, snippet, onFinish, onAbort]
  );

  const progressPercent = Math.min(100, Math.round((currentIndex / snippet.length) * 100));

  return (
    <div className="engine-wrapper" onClick={handleContainerClick} ref={containerRef}>
      {/* Top HUD Bar */}
      <div className="engine-hud">
        <div className="hud-badge-group">
          <span className="hud-lang-badge">{language.toUpperCase()}</span>
          <span className="hud-mode-badge">{mode}</span>
        </div>

        <div className="hud-metrics">
          <div className="hud-stat">
            <span className="hud-label">WPM</span>
            <span className="hud-value wpm-val">{liveWpm}</span>
          </div>
          <div className="hud-stat">
            <span className="hud-label">ACCURACY</span>
            <span className="hud-value acc-val">{liveAccuracy}%</span>
          </div>
          <div className="hud-stat">
            <span className="hud-label">PROGRESS</span>
            <span className="hud-value">{progressPercent}%</span>
          </div>
        </div>

        <button type="button" onClick={onAbort} className="engine-abort-btn" title="Exit to menu">
          Esc to exit
        </button>
      </div>

      {/* Progress Bar */}
      <div className="engine-progress-bar">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>

      {/* Hidden input to capture physical mobile & desktop keyboard input */}
      <input
        ref={inputRef}
        type="text"
        className="hidden-typing-input"
        autoFocus
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Re-focus after quick timeout if player clicked inside
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      />

      {/* Code Display Terminal */}
      <div className={`engine-terminal ${hasError ? 'terminal-shake' : ''}`}>
        <div className="terminal-header-bar">
          <div className="window-dots">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
          </div>
          <span className="terminal-file-title">main.{language === 'typescript' ? 'ts' : language === 'python' ? 'py' : language === 'rust' ? 'rs' : language === 'go' ? 'go' : language === 'sql' ? 'sql' : 'sh'}</span>
          <span className="terminal-hint">Click & type expected characters</span>
        </div>

        <div className="code-render-area">
          <pre className="code-pre">
            {snippet.split('').map((char, index) => {
              let charClass = 'char-pending';
              const isCurrent = index === currentIndex;

              if (index < currentIndex) {
                charClass = 'char-correct';
              } else if (isCurrent) {
                charClass = hasError ? 'char-error' : 'char-current';
              }

              // Visual representation of space and newline
              const displayChar = char === '\n' ? '↵\n' : char;

              return (
                <span key={index} className={`code-char ${charClass} ${char === ' ' ? 'char-space' : ''}`}>
                  {isCurrent && <span className={`cursor-indicator ${hasError ? 'cursor-error' : ''}`}></span>}
                  {displayChar}
                </span>
              );
            })}
          </pre>
        </div>
      </div>

      <style>{`
        .engine-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 860px;
          width: 100%;
          margin: 0 auto;
          cursor: text;
          user-select: none;
        }

        .engine-hud {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 14px;
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }

        .hud-badge-group {
          display: flex;
          gap: 8px;
        }

        .hud-lang-badge {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          background: var(--accent-default);
          color: #ffffff;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }

        .hud-mode-badge {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          background: var(--surface-sunken);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          text-transform: capitalize;
        }

        .hud-metrics {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .hud-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hud-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }

        .hud-value {
          font-family: var(--font-mono, monospace);
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .wpm-val {
          color: #3b82f6;
        }

        .acc-val {
          color: #10b981;
        }

        .engine-abort-btn {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: 1px solid var(--border-subtle);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }

        .engine-abort-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-strong);
        }

        .engine-progress-bar {
          height: 3px;
          background: var(--surface-sunken);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #10b981);
          transition: width 0.15s ease-out;
        }

        .hidden-typing-input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
          width: 0;
          height: 0;
        }

        .engine-terminal {
          background: #0f172a; /* Slate 900 dark console aesthetic */
          border: 1px solid #1e293b;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
          position: relative;
        }

        .terminal-shake {
          animation: shake 0.15s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .terminal-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #1e293b;
          border-bottom: 1px solid #334155;
        }

        .window-dots {
          display: flex;
          gap: 6px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .dot-red { background: #ef4444; }
        .dot-yellow { background: #f59e0b; }
        .dot-green { background: #10b981; }

        .terminal-file-title {
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
        }

        .terminal-hint {
          font-size: 11px;
          color: #64748b;
        }

        .code-render-area {
          padding: 24px;
          overflow-x: auto;
          line-height: 1.8;
          min-height: 160px;
        }

        .code-pre {
          margin: 0;
          font-family: var(--font-mono, 'JetBrains Mono', monospace);
          font-size: 17px;
          letter-spacing: 0.02em;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .code-char {
          position: relative;
          transition: color 0.08s ease, background-color 0.08s ease;
        }

        .char-pending {
          color: #475569; /* Unreached characters are dim */
        }

        .char-correct {
          color: #38bdf8; /* Correct characters are bright cyan */
        }

        .char-current {
          color: #f8fafc;
          background: rgba(56, 189, 248, 0.2);
          border-radius: 2px;
        }

        .char-error {
          color: #f87171;
          background: rgba(239, 68, 68, 0.35);
          border-radius: 2px;
        }

        .cursor-indicator {
          position: absolute;
          left: 0;
          bottom: 0;
          width: 2px;
          height: 100%;
          background: #38bdf8;
          animation: blink 0.9s infinite;
        }

        .cursor-error {
          background: #ef4444;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
