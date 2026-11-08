import React from 'react';
import type { SimEvent } from './SimulationEngine';

interface EventLogProps {
  events: SimEvent[];
}

export const EventLog: React.FC<EventLogProps> = ({ events }) => {
  return (
    <div className="event-log-container">
      <div className="event-log-header">
        <div className="log-title-group">
          <span className="log-pulse"></span>
          <span className="log-title">SYSTEM EVENT LOG & INCIDENTS</span>
        </div>
        <span className="log-count">{events.length} events logged</span>
      </div>

      <div className="event-log-stream">
        {events.map((ev) => {
          return (
            <div key={ev.id} className={`log-line level-${ev.level}`}>
              <span className="log-time">[{ev.time}]</span>
              <span className={`log-badge badge-${ev.level}`}>
                {ev.level.toUpperCase()}
              </span>
              <span className="log-text">{ev.text}</span>
            </div>
          );
        })}
      </div>

      <style>{`
        .event-log-container {
          background: #090e1d;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .event-log-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: #0f172a;
          border-bottom: 1px solid #1e293b;
          font-size: 11px;
        }

        .log-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .log-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 6px #38bdf8;
        }

        .log-title {
          font-weight: 800;
          letter-spacing: 0.05em;
          color: #94a3b8;
        }

        .log-count {
          color: #64748b;
          font-family: var(--font-mono, monospace);
        }

        .event-log-stream {
          padding: 8px 12px;
          max-height: 120px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          line-height: 1.4;
        }

        .log-line {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .log-time {
          color: #64748b;
          font-size: 11px;
          flex-shrink: 0;
        }

        .log-badge {
          font-size: 9px;
          font-weight: 800;
          padding: 1px 4px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .badge-info {
          background: #1e293b;
          color: #94a3b8;
        }

        .badge-warn {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .badge-error {
          background: rgba(239, 68, 68, 0.25);
          color: #ef4444;
        }

        .badge-success {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .log-text {
          color: #cbd5e1;
        }

        .level-error .log-text {
          color: #fca5a5;
        }

        .level-warn .log-text {
          color: #fde047;
        }
      `}</style>
    </div>
  );
};
