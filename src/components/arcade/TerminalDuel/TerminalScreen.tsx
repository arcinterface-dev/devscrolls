import React from 'react';

interface TerminalScreenProps {
  statusText: string;
  isTriggered: boolean;
}

const STATIC_LOGS = [
  '[SYS] kernel: [0.000000] Linux version 6.8.0-devscrolls (gcc-13)',
  '[INFO] systemd[1]: Starting Network Manager Daemon...',
  '[OK] Found device /dev/disk/by-uuid/9f4b-12a8.',
  '[INFO] nginx[2401]: configuration file /etc/nginx/nginx.conf test is successful',
  '[WARN] db-primary: replication lag observed at 140ms on replica-02',
  '[INFO] redis: 4096 clients connected, memory usage 412M / 1024M',
  '[SYS] auth-service: received token verification heartbeat',
  '[OK] k8s-node-03: pod ingress controller healthcheck passed 200 OK',
  '[WARN] prometheus: cpu load spike on worker-09 > 78%',
  '[INFO] envoy: upstream cluster connection pool established (HTTP/2)',
];

export const TerminalScreen: React.FC<TerminalScreenProps> = ({ statusText, isTriggered }) => {
  return (
    <div className={`duel-terminal-screen ${isTriggered ? 'screen-flash' : ''}`}>
      {/* Background Scrolling Logs */}
      <div className="logs-scroller">
        {[...STATIC_LOGS, ...STATIC_LOGS].map((log, i) => (
          <div key={i} className="log-row">
            {log}
          </div>
        ))}
      </div>

      {/* Foreground Banner */}
      <div className="terminal-status-overlay">
        <span className={`status-pill ${isTriggered ? 'pill-danger' : 'pill-standby'}`}>
          {statusText}
        </span>
      </div>

      <style>{`
        .duel-terminal-screen {
          width: 100%;
          height: 180px;
          background: #020617;
          border: 1px solid #1e293b;
          border-radius: var(--radius-lg);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.8);
        }

        .screen-flash {
          animation: redFlash 0.3s ease-out;
        }

        @keyframes redFlash {
          0% { background: #7f1d1d; }
          100% { background: #020617; }
        }

        .logs-scroller {
          position: absolute;
          inset: 0;
          padding: 10px;
          opacity: 0.18;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          color: #38bdf8;
          line-height: 1.6;
          user-select: none;
          pointer-events: none;
        }

        .terminal-status-overlay {
          z-index: 5;
          text-align: center;
        }

        .status-pill {
          font-family: var(--font-mono, monospace);
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 8px 18px;
          border-radius: var(--radius-full);
          display: inline-block;
        }

        .pill-standby {
          background: rgba(14, 165, 233, 0.15);
          border: 1px solid rgba(14, 165, 233, 0.4);
          color: #38bdf8;
        }

        .pill-danger {
          background: rgba(239, 68, 68, 0.25);
          border: 1px solid #ef4444;
          color: #f87171;
          animation: pulseRed 0.6s infinite;
        }

        @keyframes pulseRed {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};
