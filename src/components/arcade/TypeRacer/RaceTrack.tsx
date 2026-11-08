import React from 'react';
import { RACER_COLORS } from './constants';

export interface RacerProgress {
  playerId: string;
  displayName: string;
  percent: number; // 0 to 100
  wpm: number;
  finished: boolean;
  isMe?: boolean;
}

interface RaceTrackProps {
  racers: RacerProgress[];
}

export const RaceTrack: React.FC<RaceTrackProps> = ({ racers }) => {
  return (
    <div className="race-track-wrapper">
      <div className="track-header">
        <span className="track-title">LIVE MULTIPLAYER RACE TRACK</span>
        <span className="track-finish-line-tag">🏁 FINISH LINE</span>
      </div>

      <div className="lanes-list">
        {racers.map((racer, index) => {
          const color = RACER_COLORS[index % RACER_COLORS.length];
          const clampedPercent = Math.max(0, Math.min(100, racer.percent));

          return (
            <div key={racer.playerId} className={`lane-row ${racer.isMe ? 'lane-me' : ''}`}>
              <div className="racer-tag">
                <span className="racer-dot" style={{ backgroundColor: color }}></span>
                <span className="racer-name">
                  {racer.displayName} {racer.isMe && '(You)'}
                </span>
              </div>

              <div className="track-lane">
                <div
                  className="car-slider"
                  style={{
                    left: `${clampedPercent}%`,
                    borderColor: color,
                  }}
                >
                  <span className="car-icon">{racer.finished ? '🏁' : '🏎️'}</span>
                </div>
                <div
                  className="lane-fill"
                  style={{
                    width: `${clampedPercent}%`,
                    backgroundColor: color,
                  }}
                />
              </div>

              <div className="racer-wpm-box">
                <strong style={{ color }}>{racer.wpm}</strong>
                <small>WPM</small>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .race-track-wrapper {
          background: #0b1329;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          box-sizing: border-box;
        }

        .track-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: #94a3b8;
          font-weight: 800;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 6px;
        }

        .track-finish-line-tag {
          color: #10b981;
        }

        .lanes-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .lane-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lane-me {
          font-weight: 800;
        }

        .racer-tag {
          width: 130px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .racer-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .racer-name {
          font-size: 12px;
          color: #f1f5f9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .track-lane {
          flex: 1;
          height: 18px;
          background: #1e293b;
          border-radius: var(--radius-full);
          position: relative;
          overflow: visible;
        }

        .lane-fill {
          height: 100%;
          border-radius: var(--radius-full);
          opacity: 0.35;
          transition: width 0.35s ease-out;
        }

        .car-slider {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: left 0.35s ease-out;
          z-index: 5;
        }

        .car-icon {
          font-size: 16px;
          line-height: 1;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        }

        .racer-wpm-box {
          width: 60px;
          display: flex;
          align-items: baseline;
          justify-content: flex-end;
          gap: 4px;
          flex-shrink: 0;
        }

        .racer-wpm-box strong {
          font-family: var(--font-mono, monospace);
          font-size: 14px;
        }

        .racer-wpm-box small {
          font-size: 10px;
          color: #64748b;
        }
      `}</style>
    </div>
  );
};
