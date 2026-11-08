import React from 'react';

interface TugOfWarProps {
  p1Name: string;
  p2Name: string;
  p1Score: number;
  p2Score: number;
  roundResults: ('p1' | 'p2')[];
}

export const TugOfWar: React.FC<TugOfWarProps> = ({
  p1Name,
  p2Name,
  p1Score,
  p2Score,
  roundResults,
}) => {
  return (
    <div className="tug-wrapper">
      <div className="player-column p1-col">
        <span className="p-tag">PLAYER 1</span>
        <strong className="p-name">{p1Name}</strong>
        <span className="p-score">{p1Score} WINS</span>
      </div>

      {/* 5-round Match Point Meter */}
      <div className="round-pills-bar">
        {[0, 1, 2, 3, 4].map((idx) => {
          const res = roundResults[idx];
          return (
            <div
              key={idx}
              className={`round-pip ${res === 'p1' ? 'pip-p1' : res === 'p2' ? 'pip-p2' : ''}`}
            >
              {idx + 1}
            </div>
          );
        })}
      </div>

      <div className="player-column p2-col">
        <span className="p-tag">PLAYER 2</span>
        <strong className="p-name">{p2Name}</strong>
        <span className="p-score">{p2Score} WINS</span>
      </div>

      <style>{`
        .tug-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          padding: 12px 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .player-column {
          display: flex;
          flex-direction: column;
        }

        .p1-col {
          align-items: flex-start;
        }

        .p2-col {
          align-items: flex-end;
        }

        .p-tag {
          font-size: 9.5px;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.06em;
        }

        .p-name {
          font-size: 15px;
          color: #f8fafc;
        }

        .p-score {
          font-family: var(--font-mono, monospace);
          font-size: 13px;
          font-weight: 800;
          color: #38bdf8;
        }

        .round-pills-bar {
          display: flex;
          gap: 6px;
        }

        .round-pip {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #1e293b;
          border: 1px solid #334155;
          color: #64748b;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pip-p1 {
          background: #3b82f6;
          border-color: #3b82f6;
          color: #ffffff;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
        }

        .pip-p2 {
          background: #ef4444;
          border-color: #ef4444;
          color: #ffffff;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
        }
      `}</style>
    </div>
  );
};
