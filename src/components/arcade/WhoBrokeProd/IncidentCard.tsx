import React, { useState } from 'react';
import type { IncidentScenario } from './incidents';

interface IncidentCardProps {
  isRogue: boolean;
  incident: IncidentScenario | null;
  onGuessIncident?: (guess: string) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  isRogue,
  incident,
  onGuessIncident,
}) => {
  const [guessInput, setGuessInput] = useState('');
  const [showGuessModal, setShowGuessModal] = useState(false);

  if (isRogue) {
    return (
      <div className="card-wrap card-rogue">
        <div className="card-tag">SECRET ROLE: UNDERCOVER</div>
        <h2 className="rogue-title">🕵️ YOU ARE THE ROGUE DEPLOYER</h2>
        <p className="rogue-desc">
          You caused the outage, but you don't even know what broke! Listen carefully to other engineers' questions and answers. Blend in.
        </p>

        <div className="rogue-mission-box">
          <strong>Your Objectives:</strong>
          <ul>
            <li>Give confident, believable technical answers without knowing the root cause.</li>
            <li>Don't get voted out by the engineering team.</li>
            <li>If you figure out the incident, you can guess it to instantly win!</li>
          </ul>
        </div>

        {onGuessIncident && (
          <button
            type="button"
            onClick={() => setShowGuessModal(true)}
            className="rogue-guess-btn"
          >
            🎯 I Know What Broke! (Steal Win)
          </button>
        )}

        {showGuessModal && (
          <div className="guess-modal-overlay">
            <div className="guess-modal-card">
              <h3>Guess the Incident</h3>
              <p>Type a keyword or description of what caused the outage:</p>
              <input
                type="text"
                placeholder="e.g. SSL expired, Redis OOM, connection pool..."
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                className="guess-input"
                autoFocus
              />
              <div className="guess-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowGuessModal(false)}
                  className="modal-btn btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!guessInput.trim()}
                  onClick={() => {
                    onGuessIncident?.(guessInput);
                    setShowGuessModal(false);
                  }}
                  className="modal-btn btn-submit"
                >
                  Submit Guess
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{cardStyles}</style>
      </div>
    );
  }

  if (!incident) return null;

  return (
    <div className="card-wrap card-engineer">
      <div className="card-tag">INCIDENT POSTMORTEM TICKET #4721</div>
      <h2 className="engineer-title">🚨 {incident.title}</h2>

      <div className="incident-details-grid">
        <div className="detail-item">
          <span className="detail-label">AFFECTED SYSTEM:</span>
          <strong className="detail-val">{incident.system}</strong>
        </div>
        <div className="detail-item">
          <span className="detail-label">SEVERITY:</span>
          <span className="severity-badge">{incident.severity}</span>
        </div>
        <div className="detail-item full-row">
          <span className="detail-label">ROOT CAUSE:</span>
          <p className="root-cause-text">{incident.rootCause}</p>
        </div>
      </div>

      <div className="engineer-hint-footer">
        <span>💡 Ask questions that verify your teammates know this scenario, without revealing it to the Rogue Deployer!</span>
      </div>

      <style>{cardStyles}</style>
    </div>
  );
};

const cardStyles = `
  .card-wrap {
    background: #0f172a;
    border-radius: var(--radius-lg);
    padding: 20px;
    box-sizing: border-box;
    width: 100%;
    position: relative;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }

  .card-rogue {
    border: 2px solid #f97316;
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.12), #0f172a);
  }

  .card-engineer {
    border: 2px solid #ef4444;
  }

  .card-tag {
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #94a3b8;
    margin-bottom: 6px;
  }

  .rogue-title {
    font-size: 20px;
    font-weight: 900;
    color: #f97316;
    margin: 0 0 8px 0;
  }

  .engineer-title {
    font-size: 20px;
    font-weight: 900;
    color: #f8fafc;
    margin: 0 0 14px 0;
  }

  .rogue-desc {
    font-size: 13.5px;
    color: #cbd5e1;
    line-height: 1.5;
    margin: 0 0 12px 0;
  }

  .rogue-mission-box {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: var(--radius-md);
    padding: 12px 16px;
    font-size: 12.5px;
    color: #94a3b8;
    margin-bottom: 12px;
  }

  .rogue-mission-box strong {
    color: #f8fafc;
    display: block;
    margin-bottom: 4px;
  }

  .rogue-mission-box ul {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .rogue-guess-btn {
    width: 100%;
    padding: 10px;
    background: #f97316;
    color: #ffffff;
    border: none;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .rogue-guess-btn:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  .incident-details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: var(--radius-md);
    padding: 14px;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .full-row {
    grid-column: 1 / -1;
  }

  .detail-label {
    font-size: 10px;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 0.05em;
  }

  .detail-val {
    font-size: 13.5px;
    color: #f8fafc;
    font-family: var(--font-mono, monospace);
  }

  .severity-badge {
    font-size: 12px;
    font-weight: 800;
    color: #ef4444;
  }

  .root-cause-text {
    margin: 0;
    font-size: 13px;
    color: #38bdf8;
    line-height: 1.4;
  }

  .engineer-hint-footer {
    margin-top: 10px;
    font-size: 11.5px;
    color: #94a3b8;
    line-height: 1.4;
  }

  /* Guess Modal */
  .guess-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 100;
  }

  .guess-modal-card {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: var(--radius-lg);
    padding: 24px;
    max-width: 400px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .guess-input {
    background: #1e293b;
    border: 1px solid #334155;
    color: #ffffff;
    padding: 10px;
    border-radius: var(--radius-sm);
    font-size: 14px;
    outline: none;
  }

  .guess-modal-actions {
    display: flex;
    gap: 8px;
    margin-top: 6px;
  }

  .modal-btn {
    flex: 1;
    padding: 10px;
    border-radius: var(--radius-sm);
    font-weight: 700;
    cursor: pointer;
    border: none;
  }

  .btn-cancel {
    background: #1e293b;
    color: #94a3b8;
  }

  .btn-submit {
    background: #f97316;
    color: #ffffff;
  }
`;
