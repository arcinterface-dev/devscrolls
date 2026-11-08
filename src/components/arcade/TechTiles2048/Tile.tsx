import React from 'react';
import { TILE_THEMES, DEFAULT_TILE_META } from './constants';

interface TileProps {
  value: number;
  isMerged?: boolean;
  isSpawned?: boolean;
}

export const Tile: React.FC<TileProps> = ({ value, isMerged = false, isSpawned = false }) => {
  if (value === 0) {
    return <div className="tile-cell empty-cell"></div>;
  }

  const meta = TILE_THEMES[value] || {
    value,
    label: 'Post-Quantum',
    bg: '#ef4444',
    color: '#ffffff',
    glow: '0 0 20px #ef4444',
    emoji: '🔥',
  };

  const isHighValue = value >= 512;
  const isQuantum = value === 2048;

  return (
    <div
      className={`tile-cell active-tile ${isMerged ? 'tile-merged' : ''} ${isSpawned ? 'tile-spawned' : ''} ${isQuantum ? 'tile-quantum' : ''}`}
      style={{
        backgroundColor: meta.bg,
        color: meta.color,
        boxShadow: meta.glow || 'none',
      }}
    >
      <span className={`tile-num ${value >= 1024 ? 'num-large' : value >= 128 ? 'num-medium' : ''}`}>
        {value}
      </span>
      <span className="tile-era-label">{meta.label}</span>

      <style>{`
        .tile-cell {
          width: 100%;
          height: 100%;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          user-select: none;
          position: relative;
        }

        .empty-cell {
          background: #1e293b;
        }

        .active-tile {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          transition: transform 0.1s ease-out;
        }

        .tile-merged {
          animation: mergePop 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes mergePop {
          0% { transform: scale(0.85); }
          50% { transform: scale(1.16); }
          100% { transform: scale(1); }
        }

        .tile-spawned {
          animation: spawnIn 0.15s ease-out;
        }

        @keyframes spawnIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .tile-quantum {
          animation: rainbowPulse 2.5s infinite alternate;
        }

        @keyframes rainbowPulse {
          0% { box-shadow: 0 0 16px rgba(236, 72, 153, 0.7); }
          50% { box-shadow: 0 0 24px rgba(139, 92, 246, 0.8); }
          100% { box-shadow: 0 0 32px rgba(59, 130, 246, 0.9); }
        }

        .tile-num {
          font-family: var(--font-mono, monospace);
          font-size: 26px;
          font-weight: 900;
          line-height: 1;
        }

        .num-medium {
          font-size: 22px;
        }

        .num-large {
          font-size: 18px;
        }

        .tile-era-label {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: 4px;
          opacity: 0.9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 90%;
        }

        @media (max-width: 480px) {
          .tile-num {
            font-size: 20px;
          }
          .num-medium {
            font-size: 17px;
          }
          .num-large {
            font-size: 14px;
          }
          .tile-era-label {
            font-size: 7.5px;
          }
        }
      `}</style>
    </div>
  );
};
