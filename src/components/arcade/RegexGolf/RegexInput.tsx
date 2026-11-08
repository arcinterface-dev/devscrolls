import React from 'react';

interface RegexInputProps {
  pattern: string;
  flags: string;
  isValid: boolean;
  error?: string;
  isSlow?: boolean;
  parLength: number;
  onPatternChange: (pattern: string) => void;
  onToggleFlag: (flag: string) => void;
}

export const RegexInput: React.FC<RegexInputProps> = ({
  pattern,
  flags,
  isValid,
  error,
  isSlow,
  parLength,
  onPatternChange,
  onToggleFlag,
}) => {
  const currentLength = pattern.length;
  const isUnderPar = currentLength > 0 && currentLength <= parLength;

  return (
    <div className="regex-input-container">
      <div className="regex-input-bar">
        <span className="regex-slash">/</span>
        <input
          type="text"
          value={pattern}
          placeholder="Type your regex pattern here... (e.g. ^https?://)"
          onChange={(e) => onPatternChange(e.target.value)}
          className={`regex-field ${error ? 'field-error' : isValid && pattern ? 'field-valid' : ''}`}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="none"
        />
        <span className="regex-slash">/</span>

        {/* Flags buttons */}
        <div className="flags-group">
          <button
            type="button"
            onClick={() => onToggleFlag('i')}
            className={`flag-btn ${flags.includes('i') ? 'active' : ''}`}
            title="Case-insensitive flag (i)"
          >
            i
          </button>
          <button
            type="button"
            onClick={() => onToggleFlag('m')}
            className={`flag-btn ${flags.includes('m') ? 'active' : ''}`}
            title="Multiline flag (m)"
          >
            m
          </button>
        </div>
      </div>

      {/* Meta indicators */}
      <div className="regex-meta-bar">
        <div className="meta-left">
          {error ? (
            <span className="regex-error-msg">⚠️ {error}</span>
          ) : isSlow ? (
            <span className="regex-slow-msg">⚡ Slow regex execution (&gt;50ms)</span>
          ) : (
            <span className="regex-valid-msg">
              {pattern ? '✓ Valid Pattern' : 'Write shortest pattern to match greens and reject reds'}
            </span>
          )}
        </div>

        <div className="meta-right">
          <span className="length-badge">
            Length: <strong>{currentLength}</strong> chars
          </span>
          <span className={`par-badge ${isUnderPar ? 'par-under' : ''}`}>
            Par: <strong>{parLength}</strong>
          </span>
        </div>
      </div>

      <style>{`
        .regex-input-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }

        .regex-input-bar {
          display: flex;
          align-items: center;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          padding: 4px 10px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .regex-input-bar:focus-within {
          border-color: var(--accent-default);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-default) 20%, transparent);
        }

        .regex-slash {
          font-family: var(--font-mono, monospace);
          font-size: 22px;
          font-weight: 700;
          color: #64748b;
          user-select: none;
        }

        .regex-field {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: var(--font-mono, monospace);
          font-size: 17px;
          color: #f8fafc;
          padding: 8px 10px;
          letter-spacing: 0.04em;
        }

        .field-error {
          color: #f87171;
        }

        .field-valid {
          color: #38bdf8;
        }

        .flags-group {
          display: flex;
          gap: 4px;
        }

        .flag-btn {
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          font-weight: 700;
          background: #1e293b;
          border: 1px solid #334155;
          color: #94a3b8;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s;
        }

        .flag-btn:hover {
          color: #f8fafc;
          border-color: #64748b;
        }

        .flag-btn.active {
          background: var(--accent-default);
          border-color: var(--accent-default);
          color: #ffffff;
        }

        .regex-meta-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          padding: 0 4px;
        }

        .regex-error-msg {
          color: #ef4444;
          font-weight: 600;
        }

        .regex-slow-msg {
          color: #f59e0b;
          font-weight: 600;
        }

        .regex-valid-msg {
          color: #64748b;
        }

        .meta-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .length-badge {
          color: #94a3b8;
        }

        .length-badge strong {
          color: #f8fafc;
        }

        .par-badge {
          color: #64748b;
        }

        .par-under {
          color: #10b981;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};
