import React, { useState, useEffect } from 'react';
import { generateSnippet, type LanguageId, type TyperMode } from './SnippetGenerator';
import { TypingEngine } from './TypingEngine';
import { ResultsPanel } from './ResultsPanel';
import { storage } from '../shared/storage';

type GameState = 'menu' | 'countdown' | 'typing' | 'results';

interface LanguageOption {
  id: LanguageId;
  name: string;
  icon: string;
  color: string;
}

const LANGUAGES: LanguageOption[] = [
  { id: 'typescript', name: 'TypeScript', icon: 'TS', color: '#3178c6' },
  { id: 'python', name: 'Python', icon: 'PY', color: '#3776ab' },
  { id: 'go', name: 'Go', icon: 'GO', color: '#00add8' },
  { id: 'rust', name: 'Rust', icon: 'RS', color: '#dea584' },
  { id: 'sql', name: 'SQL', icon: 'DB', color: '#336791' },
  { id: 'bash', name: 'Bash', icon: '$_', color: '#4eaa25' },
];

const MODES: { id: TyperMode; label: string; desc: string }[] = [
  { id: 'standard', label: 'Standard Syntax', desc: 'Real idiomatic code snippets (3 lines)' },
  { id: 'symbols', label: 'Symbol Sprint', desc: 'Heavy brackets, arrows & logical operators' },
  { id: 'regex', label: 'Regex Rush', desc: 'Dense pattern matching character clusters' },
];

export const TerminalTyper: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [selectedLang, setSelectedLang] = useState<LanguageId>('typescript');
  const [selectedMode, setSelectedMode] = useState<TyperMode>('standard');
  const [countdown, setCountdown] = useState(3);
  const [snippet, setSnippet] = useState('');

  // Results state
  const [lastResults, setLastResults] = useState<{
    wpm: number;
    accuracy: number;
    elapsedSeconds: number;
    errorMap: Record<string, number>;
    highScore: number;
    isNewHighScore: boolean;
    streak: number;
  }>({
    wpm: 0,
    accuracy: 100,
    elapsedSeconds: 0,
    errorMap: {},
    highScore: 0,
    isNewHighScore: false,
    streak: 0,
  });

  const [langBest, setLangBest] = useState(0);

  useEffect(() => {
    setLangBest(storage.getHighScore(`terminal-typer-${selectedLang}`));
  }, [selectedLang]);

  const handleStartGame = () => {
    const freshSnippet = generateSnippet(selectedLang, selectedMode);
    setSnippet(freshSnippet);
    setGameState('countdown');
    setCountdown(3);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setGameState('typing');
      }
    }, 800);
  };

  const handleTypingFinish = (results: {
    wpm: number;
    accuracy: number;
    elapsedSeconds: number;
    errorMap: Record<string, number>;
  }) => {
    // Record general high score & language-specific high score
    const { isNewHighScore, streak } = storage.recordGameFinished(
      'terminal-typer',
      results.wpm,
      { language: selectedLang, mode: selectedMode, accuracy: results.accuracy }
    );
    storage.setHighScore(`terminal-typer-${selectedLang}`, results.wpm);

    const overallBest = storage.getHighScore('terminal-typer');

    setLastResults({
      ...results,
      highScore: overallBest,
      isNewHighScore,
      streak,
    });

    setGameState('results');
  };

  return (
    <div className="typer-root-container">
      {/* State 1: Menu */}
      {gameState === 'menu' && (
        <div className="typer-menu-wrap">
          <div className="typer-hero-badge">
            <span>⌨️ SPEED TEST</span>
          </div>
          <h1 className="typer-menu-title">Terminal Typer</h1>
          <p className="typer-menu-subtitle">
            How fast can you type real production code? Test your syntax muscle memory without autocomplete.
          </p>

          {/* Language Selection */}
          <div className="typer-section">
            <span className="typer-section-title">Select Language</span>
            <div className="lang-selector-grid">
              {LANGUAGES.map((lang) => {
                const isSelected = lang.id === selectedLang;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setSelectedLang(lang.id)}
                    className={`lang-card ${isSelected ? 'selected' : ''}`}
                    style={{ '--lang-color': lang.color } as React.CSSProperties}
                  >
                    <span className="lang-icon">{lang.icon}</span>
                    <span className="lang-name">{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Selection */}
          <div className="typer-section">
            <span className="typer-section-title">Select Mode</span>
            <div className="mode-selector-grid">
              {MODES.map((m) => {
                const isSelected = m.id === selectedMode;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMode(m.id)}
                    className={`mode-card ${isSelected ? 'selected' : ''}`}
                  >
                    <strong>{m.label}</strong>
                    <small>{m.desc}</small>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Best Record Indicator */}
          {langBest > 0 && (
            <div className="typer-best-banner">
              <span>🏆 {selectedLang.toUpperCase()} Personal Best:</span>
              <strong>{langBest} WPM</strong>
            </div>
          )}

          {/* Launch Button */}
          <button type="button" onClick={handleStartGame} className="typer-launch-btn">
            <span>Start Typing Test</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>
        </div>
      )}

      {/* State 2: Countdown */}
      {gameState === 'countdown' && (
        <div className="typer-countdown-overlay">
          <div className="countdown-number">{countdown}</div>
          <span className="countdown-label">Get hands on keyboard!</span>
        </div>
      )}

      {/* State 3: Active Typing */}
      {gameState === 'typing' && (
        <TypingEngine
          snippet={snippet}
          language={selectedLang}
          mode={selectedMode}
          onFinish={handleTypingFinish}
          onAbort={() => setGameState('menu')}
        />
      )}

      {/* State 4: Results */}
      {gameState === 'results' && (
        <ResultsPanel
          wpm={lastResults.wpm}
          accuracy={lastResults.accuracy}
          elapsedSeconds={lastResults.elapsedSeconds}
          errorMap={lastResults.errorMap}
          highScore={lastResults.highScore}
          isNewHighScore={lastResults.isNewHighScore}
          streak={lastResults.streak}
          language={selectedLang}
          mode={selectedMode}
          onPlayAgain={handleStartGame}
        />
      )}

      <style>{`
        .typer-root-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100%;
          width: 100%;
          padding: var(--space-6) var(--space-4);
          box-sizing: border-box;
        }

        .typer-menu-wrap {
          max-width: 620px;
          width: 100%;
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: var(--space-8);
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--space-5);
        }

        .typer-hero-badge {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--accent-default);
          background: color-mix(in srgb, var(--accent-default) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent-default) 25%, transparent);
          padding: 4px 10px;
          border-radius: var(--radius-full);
        }

        .typer-menu-title {
          font-size: 32px;
          font-weight: 900;
          margin: 0;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .typer-menu-subtitle {
          font-size: 14.5px;
          color: var(--text-muted);
          line-height: 1.5;
          margin: 0;
          max-width: 500px;
        }

        .typer-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: left;
        }

        .typer-section-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }

        .lang-selector-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .lang-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lang-card:hover {
          background: var(--surface-base);
          border-color: var(--lang-color, var(--accent-default));
          transform: translateY(-1px);
        }

        .lang-card.selected {
          border-color: var(--lang-color, var(--accent-default));
          background: color-mix(in srgb, var(--lang-color) 12%, var(--surface-raised));
          box-shadow: 0 0 0 1px var(--lang-color);
        }

        .lang-icon {
          font-family: var(--font-mono, monospace);
          font-weight: 900;
          font-size: 12px;
          color: #ffffff;
          background: var(--lang-color, #475569);
          padding: 3px 6px;
          border-radius: 4px;
        }

        .lang-name {
          font-size: 13.5px;
          font-weight: 700;
        }

        .mode-selector-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .mode-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          padding: 10px 12px;
          background: var(--surface-sunken);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-card:hover {
          background: var(--surface-base);
          border-color: var(--accent-default);
        }

        .mode-card.selected {
          border-color: var(--accent-default);
          background: color-mix(in srgb, var(--accent-default) 10%, var(--surface-raised));
        }

        .mode-card strong {
          font-size: 12.5px;
          font-weight: 700;
        }

        .mode-card small {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.3;
          margin-top: 4px;
        }

        .typer-best-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
          background: var(--surface-sunken);
          padding: 8px 16px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
        }

        .typer-best-banner strong {
          color: var(--accent-default);
        }

        .typer-launch-btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: var(--accent-default);
          color: #ffffff;
          border: none;
          padding: 14px 24px;
          border-radius: var(--radius-md);
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 16px color-mix(in srgb, var(--accent-default) 35%, transparent);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .typer-launch-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px color-mix(in srgb, var(--accent-default) 45%, transparent);
        }

        /* Countdown */
        .typer-countdown-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .countdown-number {
          font-size: 120px;
          font-weight: 900;
          line-height: 1;
          color: var(--accent-default);
          font-family: var(--font-mono, monospace);
          animation: popScale 0.8s infinite;
        }

        @keyframes popScale {
          0% { transform: scale(0.6); opacity: 0; }
          40% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }

        .countdown-label {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-muted);
        }

        @media (max-width: 600px) {
          .lang-selector-grid,
          .mode-selector-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
