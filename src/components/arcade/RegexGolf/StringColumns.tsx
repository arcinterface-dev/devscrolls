import React from 'react';

interface StringColumnsProps {
  matches: string[];
  matchResults: boolean[];
  rejects: string[];
  rejectResults: boolean[];
}

export const StringColumns: React.FC<StringColumnsProps> = ({
  matches,
  matchResults,
  rejects,
  rejectResults,
}) => {
  const correctMatchesCount = matchResults.filter(Boolean).length;
  // For rejects, success means it did NOT match (false)
  const correctRejectsCount = rejectResults.filter((r) => !r).length;

  return (
    <div className="columns-grid">
      {/* Column 1: Match Targets (Green) */}
      <div className="strings-card card-match">
        <div className="card-header">
          <div className="header-left">
            <span className="dot dot-match"></span>
            <strong>MUST MATCH (TARGETS)</strong>
          </div>
          <span className={`count-tag ${correctMatchesCount === matches.length ? 'count-complete' : ''}`}>
            {correctMatchesCount}/{matches.length}
          </span>
        </div>

        <div className="strings-list">
          {matches.map((str, idx) => {
            const isMatched = matchResults[idx];
            return (
              <div key={str + idx} className={`str-row ${isMatched ? 'row-success' : 'row-pending'}`}>
                <span className="str-icon">{isMatched ? '✓' : '✕'}</span>
                <code className="str-text">{str}</code>
              </div>
            );
          })}
        </div>
      </div>

      {/* Column 2: Reject Traps (Red) */}
      <div className="strings-card card-reject">
        <div className="card-header">
          <div className="header-left">
            <span className="dot dot-reject"></span>
            <strong>MUST REJECT (TRAPS)</strong>
          </div>
          <span className={`count-tag ${correctRejectsCount === rejects.length ? 'count-complete' : ''}`}>
            {correctRejectsCount}/{rejects.length}
          </span>
        </div>

        <div className="strings-list">
          {rejects.map((str, idx) => {
            const isAccidentallyMatched = rejectResults[idx];
            return (
              <div
                key={str + idx}
                className={`str-row ${isAccidentallyMatched ? 'row-danger' : 'row-safe'}`}
              >
                <span className="str-icon">
                  {isAccidentallyMatched ? '⚠️' : '✓'}
                </span>
                <code className="str-text">{str}</code>
                {isAccidentallyMatched && (
                  <span className="trap-alert">TRAPPED</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .columns-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          width: 100%;
        }

        .strings-card {
          background: #0b1329;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .card-match {
          border-top: 3px solid #10b981;
        }

        .card-reject {
          border-top: 3px solid #ef4444;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: #0f172a;
          border-bottom: 1px solid #1e293b;
          font-size: 11px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          letter-spacing: 0.05em;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dot-match { background: #10b981; }
        .dot-reject { background: #ef4444; }

        .count-tag {
          font-family: var(--font-mono, monospace);
          font-weight: 700;
          font-size: 12px;
          color: #64748b;
        }

        .count-complete {
          color: #10b981;
        }

        .strings-list {
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 280px;
          overflow-y: auto;
        }

        .str-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono, monospace);
          font-size: 13px;
          transition: all 0.15s ease;
        }

        .row-success {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #a7f3d0;
        }

        .row-pending {
          background: #1e293b;
          border: 1px solid #334155;
          color: #94a3b8;
        }

        .row-safe {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #cbd5e1;
        }

        .row-danger {
          background: rgba(239, 68, 68, 0.22);
          border: 1px solid #ef4444;
          color: #fca5a5;
          animation: pulseRed 0.8s infinite;
        }

        @keyframes pulseRed {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }

        .str-icon {
          font-weight: 800;
          font-size: 12px;
          width: 14px;
          flex-shrink: 0;
          text-align: center;
        }

        .str-text {
          flex: 1;
          word-break: break-all;
        }

        .trap-alert {
          font-size: 9px;
          font-weight: 800;
          background: #ef4444;
          color: #ffffff;
          padding: 1px 4px;
          border-radius: 2px;
        }

        @media (max-width: 600px) {
          .columns-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
