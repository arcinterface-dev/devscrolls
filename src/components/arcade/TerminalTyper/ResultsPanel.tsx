import React, { useState } from 'react';
import { GameOverScreen } from '../shared/GameOverScreen';

interface ResultsPanelProps {
  wpm: number;
  accuracy: number;
  elapsedSeconds: number;
  errorMap: Record<string, number>;
  highScore: number;
  isNewHighScore: boolean;
  streak: number;
  language: string;
  mode: string;
  onPlayAgain: () => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  wpm,
  accuracy,
  elapsedSeconds,
  errorMap,
  highScore,
  isNewHighScore,
  streak,
  language,
  mode,
  onPlayAgain,
}) => {
  const sortedErrors = Object.entries(errorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const getCustomShareText = (): string => {
    // Generate green / yellow / red emoji matrix based on accuracy
    const greenBlocks = Math.round(accuracy / 12.5);
    const redBlocks = Math.max(0, 8 - greenBlocks);
    const matrix = '🟩'.repeat(greenBlocks) + '🟥'.repeat(redBlocks);

    return `⌨️ Terminal Typer | ${language.toUpperCase()}\n` +
      `⚡ WPM: ${wpm} | Accuracy: ${accuracy}%\n` +
      `${matrix}\n` +
      `${isNewHighScore ? '🏆 New Personal Record!\n' : ''}` +
      `${streak > 0 ? `🔥 Streak: ${streak} days\n` : ''}` +
      `Test your code WPM: https://devscrolls.dev/arcade/terminal-typer/`;
  };

  return (
    <div className="results-wrapper">
      <GameOverScreen
        gameId="terminal-typer"
        gameTitle={`Terminal Typer (${language.toUpperCase()})`}
        score={wpm}
        unit="WPM"
        highScore={highScore}
        isNewHighScore={isNewHighScore}
        streak={streak}
        onPlayAgain={onPlayAgain}
        onShareCustomText={getCustomShareText}
      />

      {/* Accuracy & Mistake Breakdown overlay detail */}
      <div className="results-extras-drawer">
        <div className="extra-stat-chip">
          <span>Accuracy:</span>
          <strong>{accuracy}%</strong>
        </div>
        <div className="extra-stat-chip">
          <span>Time:</span>
          <strong>{elapsedSeconds}s</strong>
        </div>

        {sortedErrors.length > 0 && (
          <div className="error-heatmap-box">
            <span className="heatmap-label">Key Misses Heatmap:</span>
            <div className="heatmap-tags">
              {sortedErrors.map(([key, count]) => (
                <span key={key} className="key-miss-tag">
                  <code>{key}</code>: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .results-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .results-extras-drawer {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 110;
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          padding: 6px 16px;
          box-shadow: var(--shadow-md);
        }

        .extra-stat-chip {
          display: flex;
          gap: 4px;
          font-size: 12px;
          color: var(--text-muted);
        }

        .extra-stat-chip strong {
          color: var(--text-primary);
        }

        .error-heatmap-box {
          display: flex;
          align-items: center;
          gap: 8px;
          border-left: 1px solid var(--border-subtle);
          padding-left: 12px;
        }

        .heatmap-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
        }

        .heatmap-tags {
          display: flex;
          gap: 6px;
        }

        .key-miss-tag {
          font-size: 11px;
          background: color-mix(in srgb, #ef4444 12%, var(--surface-sunken));
          color: #ef4444;
          padding: 1px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .key-miss-tag code {
          font-weight: 800;
        }

        @media (max-width: 640px) {
          .results-extras-drawer {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
