import React, { useEffect, useRef, useCallback } from 'react';
import type { MoveDirection } from './GameEngine';
import { Tile } from './Tile';

interface GameBoardProps {
  grid: number[][];
  mergedCells: Set<string>;
  spawnedCell: string | null;
  onMove: (direction: MoveDirection) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  mergedCells,
  spawnedCell,
  onMove,
}) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      let dir: MoveDirection | null = null;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dir = 'up';
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dir = 'down';
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dir = 'left';
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dir = 'right';

      if (dir) {
        e.preventDefault();
        onMove(dir);
      }
    },
    [onMove]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;

    const start = touchStartRef.current;
    const end = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    const SWIPE_THRESHOLD = 28;

    if (Math.max(absX, absY) > SWIPE_THRESHOLD) {
      if (absX > absY) {
        onMove(dx > 0 ? 'right' : 'left');
      } else {
        onMove(dy > 0 ? 'down' : 'up');
      }
    }

    touchStartRef.current = null;
  };

  return (
    <div
      ref={boardRef}
      className="board-outer-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={(e) => {
        // Prevent accidental browser elastic scrolling during gameplay swipe
        if (e.cancelable) e.preventDefault();
      }}
    >
      <div className="grid-container">
        {grid.map((row, r) =>
          row.map((val, c) => {
            const key = `${r}-${c}`;
            return (
              <Tile
                key={key}
                value={val}
                isMerged={mergedCells.has(key)}
                isSpawned={spawnedCell === key}
              />
            );
          })
        )}
      </div>

      <style>{`
        .board-outer-container {
          width: 100%;
          max-width: 440px;
          aspect-ratio: 1 / 1;
          background: #0f172a;
          border: 2px solid #1e293b;
          border-radius: var(--radius-xl);
          padding: 12px;
          box-sizing: border-box;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
          user-select: none;
          touch-action: none;
          display: flex;
        }

        .grid-container {
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(4, 1fr);
          gap: 10px;
        }

        @media (max-width: 480px) {
          .board-outer-container {
            padding: 8px;
          }
          .grid-container {
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
};
