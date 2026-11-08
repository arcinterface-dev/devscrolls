import React, { useEffect, useCallback } from 'react';
import type { AlertPrompt } from './alerts';

interface AlertFlashProps {
  alert: AlertPrompt;
  isTriggered: boolean;
  onReact: (key: string) => void;
}

export const AlertFlash: React.FC<AlertFlashProps> = ({
  alert,
  isTriggered,
  onReact,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      onReact(e.key);
    },
    [onReact]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isTriggered) return null;

  return (
    <div className="alert-flash-container">
      <div className="alert-flash-box">
        <span className="flash-icon">{alert.icon}</span>
        <h1 className="flash-title">{alert.text}</h1>
        <div className="flash-key-prompt">
          <span>PRESS KEY:</span>
          <strong className="flash-key-tag">[{alert.keyLabel}]</strong>
        </div>

        {/* Mobile touch button */}
        <button
          type="button"
          onClick={() => onReact(alert.expectedKey)}
          className="mobile-trigger-btn"
        >
          TAP TO REACT!
        </button>
      </div>

      <style>{`
        .alert-flash-container {
          position: absolute;
          inset: 0;
          background: rgba(239, 68, 68, 0.95);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 50;
          animation: popScale 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes popScale {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .alert-flash-box {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #ffffff;
        }

        .flash-icon {
          font-size: 56px;
          line-height: 1;
        }

        .flash-title {
          font-size: clamp(28px, 6vw, 48px);
          font-weight: 900;
          margin: 0;
          letter-spacing: -0.02em;
          text-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }

        .flash-key-prompt {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 700;
        }

        .flash-key-tag {
          font-family: var(--font-mono, monospace);
          font-size: 32px;
          font-weight: 900;
          background: #020617;
          color: #38bdf8;
          padding: 4px 18px;
          border-radius: var(--radius-md);
          border: 2px solid #38bdf8;
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.6);
        }

        .mobile-trigger-btn {
          margin-top: 10px;
          padding: 16px 36px;
          background: #020617;
          border: 2px solid #ffffff;
          color: #ffffff;
          border-radius: var(--radius-md);
          font-size: 18px;
          font-weight: 900;
          cursor: pointer;
          touch-action: manipulation;
        }

        @media (min-width: 768px) {
          .mobile-trigger-btn {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
