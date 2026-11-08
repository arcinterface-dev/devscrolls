import React from 'react';

export type CardType = 'red' | 'blue' | 'neutral' | 'assassin';

export interface CardState {
  id: number;
  word: string;
  type: CardType;
  isRevealed: boolean;
}

interface CardTileProps {
  card: CardState;
  isSpymaster: boolean;
  canClick: boolean;
  onClick: () => void;
}

export const CardTile: React.FC<CardTileProps> = ({
  card,
  isSpymaster,
  canClick,
  onClick,
}) => {
  let revealedClass = '';
  if (card.isRevealed) {
    revealedClass = `card-${card.type}`;
  }

  let spymasterTintClass = '';
  if (isSpymaster && !card.isRevealed) {
    spymasterTintClass = `spy-${card.type}`;
  }

  return (
    <button
      type="button"
      disabled={!canClick || card.isRevealed}
      onClick={onClick}
      className={`card-tile ${revealedClass} ${spymasterTintClass} ${card.isRevealed ? 'is-revealed' : ''}`}
    >
      <span className="card-word">{card.word}</span>

      {card.isRevealed && card.type === 'assassin' && (
        <span className="assassin-skull">💀</span>
      )}

      {isSpymaster && !card.isRevealed && (
        <span className={`spymaster-indicator dot-${card.type}`}></span>
      )}

      <style>{`
        .card-tile {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 8px 6px;
          min-height: 54px;
          cursor: pointer;
          position: relative;
          user-select: none;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s, background-color 0.3s;
        }

        .card-tile:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
        }

        .card-word {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          word-break: break-word;
        }

        /* Revealed States */
        .card-red {
          background: #ef4444 !important;
          border-color: #dc2626;
        }
        .card-red .card-word {
          color: #ffffff;
        }

        .card-blue {
          background: #3b82f6 !important;
          border-color: #2563eb;
        }
        .card-blue .card-word {
          color: #ffffff;
        }

        .card-neutral {
          background: #475569 !important;
          border-color: #334155;
          opacity: 0.7;
        }
        .card-neutral .card-word {
          color: #cbd5e1;
        }

        .card-assassin {
          background: #020617 !important;
          border: 2px solid #ef4444;
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.6);
        }
        .card-assassin .card-word {
          color: #ef4444;
        }

        .assassin-skull {
          position: absolute;
          top: 4px;
          right: 6px;
          font-size: 12px;
        }

        /* Spymaster Key Card Hints */
        .spy-red {
          background: #fee2e2;
          border-color: #f87171;
        }
        .spy-blue {
          background: #dbeafe;
          border-color: #60a5fa;
        }
        .spy-assassin {
          background: #1e293b;
          border-color: #ef4444;
        }
        .spy-assassin .card-word {
          color: #fca5a5;
        }

        .spymaster-indicator {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .dot-red { background: #ef4444; }
        .dot-blue { background: #3b82f6; }
        .dot-neutral { background: #94a3b8; }
        .dot-assassin { background: #000000; box-shadow: 0 0 4px #ef4444; }

        @media (max-width: 600px) {
          .card-word {
            font-size: 10px;
          }
          .card-tile {
            min-height: 44px;
            padding: 4px;
          }
        }
      `}</style>
    </button>
  );
};
