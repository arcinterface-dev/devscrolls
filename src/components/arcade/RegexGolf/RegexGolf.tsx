import React, { useState, useEffect, useRef } from 'react';
import { generateChallenge, type ChallengeData } from './TestSetGenerator';
import { testStringsSafely } from './RegexTester';
import { RegexInput } from './RegexInput';
import { StringColumns } from './StringColumns';
import { storage } from '../shared/storage';

type Difficulty = 'easy' | 'medium' | 'hard';

export const RegexGolf: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const timerRef = useRef<any>(null);

  // Initialize round
  const startRound = (diff: Difficulty) => {
    const data = generateChallenge(diff);
    setChallenge(data);
    setPattern('');
    setFlags('');
    setElapsedSeconds(0);
    setIsWon(false);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  useEffect(() => {
    setHighScore(storage.getHighScore('regex-golf'));
    startRound(difficulty);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty]);

  const toggleFlag = (flag: string) => {
    setFlags((prev) => (prev.includes(flag) ? prev.replace(flag, '') : prev + flag));
  };

  // Run tests in real-time
  const matchResult = challenge
    ? testStringsSafely(pattern, flags, challenge.matches)
    : { results: [], isSlow: false };

  const rejectResult = challenge
    ? testStringsSafely(pattern, flags, challenge.rejects)
    : { results: [], isSlow: false };

  // Check victory: All matches true AND all rejects false
  useEffect(() => {
    if (!challenge || !pattern || isWon) return;

    const allMatchesPassed = matchResult.results.length > 0 && matchResult.results.every(Boolean);
    const zeroRejectsTrapped = rejectResult.results.length > 0 && rejectResult.results.every((r) => !r);

    if (allMatchesPassed && zeroRejectsTrapped) {
      if (timerRef.current) clearInterval(timerRef.current);

      const calculatedScore = Math.max(
        15,
        100 - pattern.length * 3 + Math.max(0, 30 - elapsedSeconds)
      );

      setScore(calculatedScore);
      setIsWon(true);

      storage.recordGameFinished('regex-golf', calculatedScore, {
        archetype: challenge.archetype.id,
        length: pattern.length,
        time: elapsedSeconds,
      });
      storage.setHighScore('regex-golf', calculatedScore);
      setHighScore(storage.getHighScore('regex-golf'));
    }
  }, [matchResult, rejectResult, challenge, pattern, isWon, elapsedSeconds]);

  const getCustomShareText = (): string => {
    if (!challenge) return '';
    return `.* Regex Golf | ${challenge.archetype.name}\n` +
      `⚡ Solved in ${pattern.length} chars (Par: ${challenge.parLength}) | Score: ${score}\n` +
      `🟩🟩🟩🟩🟩🟩 🟥🟥🟥🟥🟥🟥\n` +
      `Play the daily pattern match: https://devscrolls.dev/arcade/regex-golf/`;
  };

  return (
    <div className="golf-root-container">
      {/* HUD Header */}
      <div className="golf-hud">
        <div className="hud-title-section">
          <div className="hud-archetype-tag">
            <span className="diff-badge">{difficulty.toUpperCase()}</span>
            <strong className="archetype-name">{challenge?.archetype.name}</strong>
          </div>
          <p className="archetype-desc">{challenge?.archetype.description}</p>
        </div>

        <div className="hud-controls-section">
          <div className="diff-picker">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`diff-btn ${difficulty === d ? 'active' : ''}`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="hud-stats">
            <div className="h-stat">
              <span className="h-stat-label">TIME</span>
              <span className="h-stat-val">{elapsedSeconds}s</span>
            </div>
            {highScore > 0 && (
              <div className="h-stat">
                <span className="h-stat-label">BEST</span>
                <span className="h-stat-val">{highScore} pts</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Regex Input Bar */}
      <RegexInput
        pattern={pattern}
        flags={flags}
        isValid={!matchResult.error && !rejectResult.error}
        error={matchResult.error || rejectResult.error}
        isSlow={matchResult.isSlow || rejectResult.isSlow}
        parLength={challenge?.parLength || 6}
        onPatternChange={setPattern}
        onToggleFlag={toggleFlag}
      />

      {/* Dual String Columns */}
      {challenge && (
        <StringColumns
          matches={challenge.matches}
          matchResults={matchResult.results}
          rejects={challenge.rejects}
          rejectResults={rejectResult.results}
        />
      )}

      {/* Win Modal */}
      {isWon && challenge && (
        <div className="golf-win-overlay">
          <div className="golf-win-card">
            <span className="golf-win-icon">⛳</span>
            <h2 className="golf-win-title">Hole in One! Pattern Solved!</h2>
            <p className="golf-win-desc">
              Your regex <code>/{pattern}/{flags}</code> successfully isolated all targets in {elapsedSeconds}s.
            </p>

            <div className="golf-score-box">
              <span className="score-label">FINAL SCORE</span>
              <strong className="score-num">{score}</strong>
              <small>
                Length: {pattern.length} chars (Par: {challenge.parLength})
              </small>
            </div>

            <div className="golf-win-actions">
              <button
                type="button"
                onClick={() => startRound(difficulty)}
                className="golf-btn btn-next"
              >
                <span>Play Next Challenge →</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(getCustomShareText());
                  alert('Regex Golf result copied to clipboard!');
                }}
                className="golf-btn btn-share"
              >
                Share Score
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .golf-root-container {
          max-width: 920px;
          width: 100%;
          min-height: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 16px;
          box-sizing: border-box;
        }

        .golf-hud {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          background: #0b1329;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          padding: 12px 16px;
        }

        .hud-title-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hud-archetype-tag {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .diff-badge {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.05em;
          background: #8b5cf6;
          color: #ffffff;
          padding: 2px 7px;
          border-radius: var(--radius-sm);
        }

        .archetype-name {
          font-size: 16px;
          color: #f8fafc;
        }

        .archetype-desc {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }

        .hud-controls-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .diff-picker {
          display: flex;
          gap: 4px;
          background: #0f172a;
          padding: 3px;
          border-radius: var(--radius-sm);
          border: 1px solid #1e293b;
        }

        .diff-btn {
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
          background: transparent;
          border: none;
          color: #64748b;
          padding: 4px 10px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .diff-btn:hover {
          color: #f8fafc;
        }

        .diff-btn.active {
          background: #1e293b;
          color: #f8fafc;
        }

        .hud-stats {
          display: flex;
          gap: 14px;
        }

        .h-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .h-stat-label {
          font-size: 9px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.05em;
        }

        .h-stat-val {
          font-family: var(--font-mono, monospace);
          font-size: 14px;
          font-weight: 700;
          color: #38bdf8;
        }

        /* Win Modal */
        .golf-win-overlay {
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

        .golf-win-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-lg);
          padding: 28px;
          max-width: 440px;
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }

        .golf-win-icon {
          font-size: 38px;
          line-height: 1;
        }

        .golf-win-title {
          font-size: 22px;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
        }

        .golf-win-desc {
          font-size: 13.5px;
          color: #94a3b8;
          line-height: 1.5;
          margin: 0;
        }

        .golf-win-desc code {
          color: #38bdf8;
          background: #1e293b;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .golf-score-box {
          background: #0b1329;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          padding: 14px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          width: 100%;
          box-sizing: border-box;
        }

        .score-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #64748b;
        }

        .score-num {
          font-size: 42px;
          font-weight: 900;
          color: #10b981;
          font-family: var(--font-mono, monospace);
          line-height: 1;
        }

        .score-box small {
          font-size: 11px;
          color: #94a3b8;
        }

        .golf-win-actions {
          display: flex;
          gap: 10px;
          width: 100%;
        }

        .golf-btn {
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
          background: #8b5cf6;
          color: #ffffff;
        }

        .btn-next:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .btn-share {
          background: #1e293b;
          border: 1px solid #334155;
          color: #f8fafc;
        }

        .btn-share:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
};
