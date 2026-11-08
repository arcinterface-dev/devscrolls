import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TECH_TARGET_WORDS, VALID_GUESSES } from './wordlist';
import { storage } from '../shared/storage';

type LetterState = 'correct' | 'present' | 'absent' | 'empty';

interface CellInfo {
  letter: string;
  state: LetterState;
}

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

export const Devdle: React.FC = () => {
  const [targetWord, setTargetWord] = useState<string>('REACT');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [message, setMessage] = useState<string>('');
  const [shakeRow, setShakeRow] = useState<boolean>(false);
  const [stats, setStats] = useState({ played: 0, wins: 0, currentStreak: 0, maxStreak: 0 });

  // Pick target word based on date seed or random
  const initWord = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = (hash << 5) - hash + today.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % TECH_TARGET_WORDS.length;
    return TECH_TARGET_WORDS[index];
  }, []);

  // Initialize
  useEffect(() => {
    const word = initWord();
    setTargetWord(word);

    // Load stats
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('devscrolls_devdle_stats');
        if (raw) setStats(JSON.parse(raw));
      } catch (e) {}
    }
  }, [initWord]);

  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2500);
  };

  // Evaluate a guess
  const evaluateGuess = useCallback((guess: string, target: string): LetterState[] => {
    const res: LetterState[] = Array(WORD_LENGTH).fill('absent');
    const targetArr = target.split('');
    const guessArr = guess.split('');

    // First pass: mark correct positions
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessArr[i] === targetArr[i]) {
        res[i] = 'correct';
        targetArr[i] = '#';
        guessArr[i] = '$';
      }
    }

    // Second pass: mark present letters
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessArr[i] !== '$') {
        const foundIndex = targetArr.indexOf(guessArr[i]);
        if (foundIndex !== -1) {
          res[i] = 'present';
          targetArr[foundIndex] = '#';
        }
      }
    }

    return res;
  }, []);

  // Keyboard letter states
  const keyStates = useMemo(() => {
    const map: Record<string, LetterState> = {};
    guesses.forEach((guess) => {
      const evalStates = evaluateGuess(guess, targetWord);
      guess.split('').forEach((letter, i) => {
        const current = map[letter];
        const next = evalStates[i];
        if (next === 'correct') {
          map[letter] = 'correct';
        } else if (next === 'present' && current !== 'correct') {
          map[letter] = 'present';
        } else if (next === 'absent' && !current) {
          map[letter] = 'absent';
        }
      });
    });
    return map;
  }, [guesses, targetWord, evaluateGuess]);

  // Handle submit guess
  const submitGuess = () => {
    if (gameStatus !== 'playing') return;

    if (currentGuess.length !== WORD_LENGTH) {
      setShakeRow(true);
      showToast('Need 5 letters!');
      setTimeout(() => setShakeRow(false), 500);
      return;
    }

    const upper = currentGuess.toUpperCase();
    if (!VALID_GUESSES.has(upper) && !TECH_TARGET_WORDS.includes(upper)) {
      setShakeRow(true);
      showToast('Not in developer dictionary!');
      setTimeout(() => setShakeRow(false), 500);
      return;
    }

    const nextGuesses = [...guesses, upper];
    setGuesses(nextGuesses);
    setCurrentGuess('');

    if (upper === targetWord) {
      setGameStatus('won');
      showToast('🎉 Brilliant! You cracked it!');
      updateStats(true);
    } else if (nextGuesses.length >= MAX_ATTEMPTS) {
      setGameStatus('lost');
      showToast(`Word was ${targetWord}`);
      updateStats(false);
    }
  };

  const updateStats = (won: boolean) => {
    setStats((prev) => {
      const played = prev.played + 1;
      const wins = prev.wins + (won ? 1 : 0);
      const currentStreak = won ? prev.currentStreak + 1 : 0;
      const maxStreak = Math.max(prev.maxStreak, currentStreak);
      const next = { played, wins, currentStreak, maxStreak };
      try {
        localStorage.setItem('devscrolls_devdle_stats', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Handle key input
  const handleKey = useCallback(
    (key: string) => {
      if (gameStatus !== 'playing') return;

      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACKSPACE' || key === '⌫') {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[A-Za-z]$/.test(key)) {
        if (currentGuess.length < WORD_LENGTH) {
          setCurrentGuess((prev) => prev + key.toUpperCase());
        }
      }
    },
    [gameStatus, currentGuess, submitGuess]
  );

  // Listen to physical keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') handleKey('ENTER');
      else if (e.key === 'Backspace') handleKey('BACKSPACE');
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey]);

  // Restart with a random word
  const handlePlayRandom = () => {
    const randomWord = TECH_TARGET_WORDS[Math.floor(Math.random() * TECH_TARGET_WORDS.length)];
    setTargetWord(randomWord);
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('playing');
    setMessage('');
  };

  return (
    <div className="devdle-container">
      {/* Top Bar */}
      <header className="devdle-header">
        <div className="header-left">
          <span className="devdle-icon">🟩</span>
          <h1 className="devdle-title">Devdle</h1>
          <span className="devdle-badge">Tech Wordle</span>
        </div>

        <div className="header-right">
          <div className="stats-pill">
            <span className="streak-num">🔥 {stats.currentStreak}</span>
            <span className="streak-label">streak</span>
          </div>
          <button type="button" onClick={handlePlayRandom} className="play-again-btn" title="Play another random tech word">
            🎲 New Word
          </button>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {message && <div className="devdle-toast">{message}</div>}

      {/* 6x5 Board Grid */}
      <main className="board-container">
        <div className="devdle-grid">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIndex) => {
            const isCurrentRow = rowIndex === guesses.length;
            const guess = guesses[rowIndex] || (isCurrentRow ? currentGuess : '');
            const evalStates = guesses[rowIndex] ? evaluateGuess(guesses[rowIndex], targetWord) : [];

            return (
              <div
                key={rowIndex}
                className={`devdle-row ${isCurrentRow && shakeRow ? 'shake-row' : ''}`}
              >
                {Array.from({ length: WORD_LENGTH }).map((__, colIndex) => {
                  const letter = guess[colIndex] || '';
                  const state = evalStates[colIndex] || (letter ? 'filled' : 'empty');

                  return (
                    <div
                      key={colIndex}
                      className={`devdle-cell ${state} ${isCurrentRow && letter ? 'pop-cell' : ''}`}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </main>

      {/* End Game Modal / Banner */}
      {gameStatus !== 'playing' && (
        <div className="game-end-banner">
          <div className="banner-content">
            <span className="end-emoji">{gameStatus === 'won' ? '🎉' : '💀'}</span>
            <div>
              <strong>{gameStatus === 'won' ? 'Solved!' : 'Out of Tries!'}</strong>
              <p>The tech word was <span className="highlight-target">{targetWord}</span></p>
            </div>
            <button type="button" onClick={handlePlayRandom} className="play-next-btn">
              Play Another ❯
            </button>
          </div>
        </div>
      )}

      {/* Virtual Keyboard */}
      <footer className="devdle-keyboard">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="keyboard-row">
            {row.map((k) => {
              const state = keyStates[k] || '';
              const isSpecial = k === 'ENTER' || k === '⌫';

              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKey(k)}
                  className={`key-btn ${isSpecial ? 'special-key' : ''} ${state}`}
                >
                  {k}
                </button>
              );
            })}
          </div>
        ))}
      </footer>

      <style>{`
        .devdle-container {
          max-width: 480px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 12px 24px;
          min-height: calc(100vh - 120px);
          box-sizing: border-box;
          position: relative;
        }

        .devdle-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0 16px;
          border-bottom: 1px solid #1e293b;
          margin-bottom: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .devdle-icon {
          font-size: 24px;
        }

        .devdle-title {
          font-size: 22px;
          font-weight: 850;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .devdle-badge {
          font-size: 11px;
          font-weight: 700;
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
          padding: 2px 7px;
          border-radius: var(--radius-full);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .stats-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #1e293b;
          border: 1px solid #334155;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 12px;
          color: #cbd5e1;
        }

        .streak-num {
          font-weight: 800;
          color: #f59e0b;
        }

        .play-again-btn {
          background: #22c55e;
          color: #042f2e;
          border: none;
          font-weight: 750;
          font-size: 12px;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: transform 0.1s, background 0.15s;
        }
        .play-again-btn:hover {
          background: #16a34a;
          color: #ffffff;
          transform: translateY(-1px);
        }

        .devdle-toast {
          position: fixed;
          top: 80px;
          background: #f8fafc;
          color: #0f172a;
          font-weight: 800;
          font-size: 13px;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          z-index: 100;
          animation: popToast 0.2s ease-out;
        }

        @keyframes popToast {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Board */
        .board-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .devdle-grid {
          display: grid;
          grid-template-rows: repeat(6, 1fr);
          gap: 6px;
        }

        .devdle-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }

        .shake-row {
          animation: shake 0.4s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }

        .devdle-cell {
          width: 52px;
          height: 52px;
          border: 2px solid #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono, monospace);
          font-size: 24px;
          font-weight: 850;
          text-transform: uppercase;
          color: #ffffff;
          border-radius: 6px;
          background: #0f172a;
          user-select: none;
          transition: transform 0.15s;
        }

        .devdle-cell.filled {
          border-color: #64748b;
          animation: popLetter 0.1s ease-out;
        }

        .devdle-cell.correct {
          background: #22c55e;
          border-color: #22c55e;
          color: #ffffff;
        }

        .devdle-cell.present {
          background: #eab308;
          border-color: #eab308;
          color: #ffffff;
        }

        .devdle-cell.absent {
          background: #1e293b;
          border-color: #1e293b;
          color: #64748b;
        }

        @keyframes popLetter {
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        /* Banner */
        .game-end-banner {
          width: 100%;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: var(--radius-md);
          padding: 12px 16px;
          margin-bottom: 16px;
          animation: fadeIn 0.3s ease-out;
        }

        .banner-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .end-emoji {
          font-size: 28px;
        }

        .highlight-target {
          color: #22c55e;
          font-weight: 850;
          letter-spacing: 0.05em;
        }

        .play-next-btn {
          background: #22c55e;
          color: #042f2e;
          font-weight: 800;
          font-size: 13px;
          border: none;
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }
        .play-next-btn:hover {
          background: #16a34a;
          color: #ffffff;
        }

        /* Keyboard */
        .devdle-keyboard {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .keyboard-row {
          display: flex;
          justify-content: center;
          gap: 5px;
        }

        .key-btn {
          height: 48px;
          min-width: 32px;
          flex: 1;
          background: #1e293b;
          border: 1px solid #334155;
          color: #f1f5f9;
          font-family: inherit;
          font-size: 14px;
          font-weight: 750;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          user-select: none;
          transition: background 0.1s, transform 0.05s;
        }

        .key-btn:active {
          transform: translateY(2px);
        }

        .key-btn.special-key {
          flex: 1.5;
          font-size: 12px;
        }

        .key-btn.correct {
          background: #22c55e;
          border-color: #22c55e;
          color: #ffffff;
        }

        .key-btn.present {
          background: #eab308;
          border-color: #eab308;
          color: #ffffff;
        }

        .key-btn.absent {
          background: #090d16;
          border-color: #1e293b;
          color: #475569;
        }

        @media (max-width: 480px) {
          .devdle-cell {
            width: 44px;
            height: 44px;
            font-size: 20px;
          }
          .key-btn {
            height: 42px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

