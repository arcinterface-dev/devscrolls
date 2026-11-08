import React, { useState, useEffect, useRef } from 'react';
import { QUIZ_QUESTIONS, type QuizQuestion } from './questions';
import { storage } from '../shared/storage';

const OPTION_COLORS = [
  { bg: '#ef4444', icon: '▲', name: 'red' },
  { bg: '#3b82f6', icon: '◆', name: 'blue' },
  { bg: '#eab308', icon: '●', name: 'yellow' },
  { bg: '#22c55e', icon: '■', name: 'green' },
];

export const QuizShow: React.FC = () => {
  const [deck, setDeck] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const timerRef = useRef<any>(null);

  const startNewGame = () => {
    const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 10);
    setDeck(shuffled);
    setCurrentIndex(0);
    setSelectedOption(null);
    setTimeLeft(15);
    setScore(0);
    setStreak(0);
    setIsAnswerRevealed(false);
    setIsGameOver(false);
  };

  useEffect(() => {
    startNewGame();
  }, []);

  // Question Timer
  useEffect(() => {
    if (isAnswerRevealed || isGameOver || deck.length === 0) return;

    setTimeLeft(15);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, isAnswerRevealed, isGameOver, deck]);

  const handleTimeOut = () => {
    setIsAnswerRevealed(true);
    setStreak(0);
  };

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null || isAnswerRevealed) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(idx);
    setIsAnswerRevealed(true);

    const question = deck[currentIndex];
    const isCorrect = idx === question.correctIndex;

    if (isCorrect) {
      // Dynamic score: 500 base + (timeLeft * 35) + (streak * 50)
      const points = 500 + timeLeft * 35 + streak * 50;
      setScore((s) => s + points);
      setStreak((st) => {
        const next = st + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
    } else {
      setIsGameOver(true);
    }
  };

  const currentQ = deck[currentIndex];

  if (!currentQ && !isGameOver) {
    return <div className="loading-state">Loading questions...</div>;
  }

  if (isGameOver) {
    const accuracy = Math.round((score / (deck.length * 1000)) * 100);

    return (
      <div className="quiz-container">
        <div className="quiz-gameover-card">
          <span className="trophy-emoji">🏆</span>
          <h2 className="podium-title">Quiz Complete!</h2>
          <p className="podium-subtitle">Final Score: <strong>{score} points</strong></p>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-num">{score}</span>
              <span className="stat-desc">Total Points</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">🔥 {maxStreak}</span>
              <span className="stat-desc">Max Streak</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{deck.length}</span>
              <span className="stat-desc">Questions</span>
            </div>
          </div>

          <button type="button" onClick={startNewGame} className="play-again-btn">
            Play Again ❯
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = selectedOption === currentQ.correctIndex;

  return (
    <div className="quiz-container">
      {/* Header bar */}
      <header className="quiz-header">
        <div className="header-brand">
          <span className="quiz-logo-badge">⚡</span>
          <div>
            <h1 className="quiz-title">Tech Quiz Show</h1>
            <span className="quiz-progress-text">Question {currentIndex + 1} of {deck.length}</span>
          </div>
        </div>

        <div className="header-counters">
          <div className={`timer-bubble ${timeLeft <= 5 ? 'urgent' : ''}`}>
            ⏱️ {timeLeft}s
          </div>

          <div className="score-bubble">
            <span className="score-val">{score}</span>
            <span className="score-lbl">pts</span>
          </div>

          {streak > 1 && (
            <div className="streak-tag">
              🔥 {streak}x
            </div>
          )}
        </div>
      </header>

      {/* Question Card */}
      <main className="question-card">
        <span className="category-tag">{currentQ.category}</span>
        <h2 className="question-text">{currentQ.question}</h2>
      </main>

      {/* Answer Options Grid */}
      <footer className="answers-grid">
        {currentQ.options.map((opt, idx) => {
          const colorMeta = OPTION_COLORS[idx];
          const isSelected = selectedOption === idx;
          const isTheRightOne = idx === currentQ.correctIndex;

          let cardClass = 'answer-card';
          if (isAnswerRevealed) {
            if (isTheRightOne) cardClass += ' right-answer';
            else if (isSelected && !isTheRightOne) cardClass += ' wrong-answer';
            else cardClass += ' faded-answer';
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswerRevealed}
              onClick={() => handleSelectOption(idx)}
              className={cardClass}
              style={{ '--btn-bg': colorMeta.bg } as React.CSSProperties}
            >
              <span className="shape-icon">{colorMeta.icon}</span>
              <span className="option-text">{opt}</span>
            </button>
          );
        })}
      </footer>

      {/* Answer Explanation & Next Trigger */}
      {isAnswerRevealed && (
        <div className="feedback-drawer">
          <div className="feedback-content">
            <div className="feedback-header">
              <span className="verdict-icon">
                {selectedOption === null ? '⏱️ Time out!' : isCorrect ? '🎉 Correct!' : '❌ Incorrect!'}
              </span>
              <span className="correct-answer-reminder">
                Correct: <strong>{currentQ.options[currentQ.correctIndex]}</strong>
              </span>
            </div>
            <p className="explanation-text">{currentQ.explanation}</p>
          </div>

          <button type="button" onClick={handleNextQuestion} className="next-q-btn" autoFocus>
            {currentIndex + 1 < deck.length ? 'Next Question ❯' : 'See Podium 🏆'}
          </button>
        </div>
      )}

      <style>{`
        .quiz-container {
          max-width: 720px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 12px 16px 36px;
          min-height: calc(100vh - 120px);
          box-sizing: border-box;
        }

        .quiz-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid #1e293b;
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .quiz-logo-badge {
          font-size: 26px;
          background: #8b5cf6;
          border-radius: var(--radius-sm);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quiz-title {
          font-size: 20px;
          font-weight: 850;
          color: #ffffff;
          margin: 0;
          line-height: 1.2;
        }

        .quiz-progress-text {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 700;
        }

        .header-counters {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .timer-bubble {
          font-family: var(--font-mono, monospace);
          font-size: 14px;
          font-weight: 850;
          background: #1e293b;
          border: 1px solid #334155;
          color: #38bdf8;
          padding: 4px 10px;
          border-radius: var(--radius-full);
        }

        .timer-bubble.urgent {
          color: #ef4444;
          border-color: #ef4444;
          animation: pulse 0.7s infinite;
        }

        .score-bubble {
          background: #1e293b;
          border: 1px solid #334155;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .score-val {
          font-size: 15px;
          font-weight: 850;
          color: #f59e0b;
        }

        .score-lbl {
          font-size: 10px;
          color: #94a3b8;
          font-weight: 700;
        }

        .streak-tag {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: var(--radius-full);
        }

        /* Question */
        .question-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-lg);
          padding: 32px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .category-tag {
          font-size: 11px;
          font-weight: 800;
          color: #a855f7;
          background: rgba(168, 85, 247, 0.12);
          border: 1px solid rgba(168, 85, 247, 0.3);
          padding: 3px 9px;
          border-radius: var(--radius-full);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .question-text {
          font-size: 22px;
          font-weight: 850;
          color: #ffffff;
          line-height: 1.35;
          margin: 0;
        }

        /* Options */
        .answers-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .answer-card {
          min-height: 84px;
          background: var(--btn-bg);
          border: none;
          border-radius: var(--radius-md);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          color: #ffffff;
          font-family: inherit;
          text-align: left;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          transition: transform 0.1s, filter 0.15s, opacity 0.2s;
        }

        .answer-card:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        .answer-card:active:not(:disabled) {
          transform: translateY(1px);
        }

        .shape-icon {
          font-size: 22px;
          opacity: 0.9;
        }

        .option-text {
          font-size: 15px;
          font-weight: 800;
          line-height: 1.3;
        }

        /* Post-answer feedback states */
        .answer-card.faded-answer {
          opacity: 0.25;
          filter: grayscale(0.5);
        }

        .answer-card.right-answer {
          box-shadow: 0 0 0 4px #ffffff, 0 8px 24px rgba(0, 0, 0, 0.5);
          transform: scale(1.02);
          z-index: 2;
        }

        .answer-card.wrong-answer {
          opacity: 0.4;
          text-decoration: line-through;
        }

        /* Feedback Drawer */
        .feedback-drawer {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: var(--radius-md);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          animation: popUp 0.2s ease-out;
        }

        @keyframes popUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .feedback-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .feedback-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .verdict-icon {
          font-size: 16px;
          font-weight: 850;
          color: #ffffff;
        }

        .correct-answer-reminder {
          font-size: 12px;
          color: #cbd5e1;
        }

        .explanation-text {
          font-size: 12.5px;
          color: #94a3b8;
          margin: 0;
          line-height: 1.4;
        }

        .next-q-btn {
          background: #8b5cf6;
          color: #ffffff;
          border: none;
          font-size: 14px;
          font-weight: 800;
          padding: 10px 20px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .next-q-btn:hover {
          background: #7c3aed;
        }

        /* Game Over */
        .quiz-gameover-card {
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

        .trophy-emoji {
          font-size: 48px;
        }

        .podium-title {
          font-size: 26px;
          font-weight: 850;
          color: #ffffff;
          margin: 0;
        }

        .podium-subtitle {
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
        }

        .stats-grid {
          display: flex;
          gap: 16px;
          margin: 12px 0;
        }

        .stat-card {
          background: #1e293b;
          border: 1px solid #334155;
          padding: 12px 20px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-num {
          font-size: 20px;
          font-weight: 850;
          color: #ffffff;
        }

        .stat-desc {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 700;
        }

        .play-again-btn {
          background: #8b5cf6;
          color: #ffffff;
          border: none;
          font-size: 14px;
          font-weight: 800;
          padding: 10px 24px;
          border-radius: var(--radius-md);
          cursor: pointer;
        }
        .play-again-btn:hover {
          background: #7c3aed;
        }

        @media (max-width: 540px) {
          .answers-grid {
            grid-template-columns: 1fr;
          }
          .feedback-drawer {
            flex-direction: column;
            align-items: flex-start;
          }
          .next-q-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

