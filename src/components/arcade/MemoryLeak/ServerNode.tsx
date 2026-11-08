import React, { useState } from 'react';
import type { ServerState } from './SimulationEngine';
import { GaugeCanvas } from './GaugeCanvas';

interface ServerNodeProps {
  server: ServerState;
  onKillProcess: (serverId: number, pid: number) => void;
  onFlushCache: (serverId: number) => void;
  onRebootNode: (serverId: number) => void;
}

export const ServerNode: React.FC<ServerNodeProps> = ({
  server,
  onKillProcess,
  onFlushCache,
  onRebootNode,
}) => {
  const [rebootHolding, setRebootHolding] = useState(false);

  const isCritical = server.ram >= 85 || server.cpu >= 85;
  const isMeltdown = server.ram >= 95 || server.cpu >= 95;

  return (
    <div
      className={`server-card ${!server.isOnline ? 'offline' : ''} ${isMeltdown ? 'meltdown' : isCritical ? 'critical' : ''}`}
      style={{
        '--node-temp': `${server.temp}%`,
      } as React.CSSProperties}
    >
      {/* Node Header */}
      <div className="node-header">
        <div className="node-id-group">
          <span className={`status-indicator ${server.isOnline ? 'online' : 'rebooting'}`}></span>
          <span className="node-name">{server.name}</span>
          {server.isTemporary && <span className="spot-tag">SPOT</span>}
        </div>
        <div className="node-meta">
          <span className="temp-badge">🔥 {server.temp}°C</span>
          <span className="disk-badge">💾 {server.disk}%</span>
        </div>
      </div>

      {/* Reboot Overlay */}
      {!server.isOnline && (
        <div className="reboot-overlay">
          <div className="reboot-spinner"></div>
          <strong>REBOOTING NODE</strong>
          <small>{server.rebootTimer > 0 ? `${server.rebootTimer.toFixed(1)}s remaining` : 'Initializing kernel...'}</small>
        </div>
      )}

      {/* Gauges */}
      <div className="gauges-group">
        <GaugeCanvas label="CPU LOAD" value={server.cpu} />
        <GaugeCanvas label="RAM USAGE" value={server.ram} />
      </div>

      {/* Process Table */}
      <div className="processes-section">
        <div className="processes-header">
          <span>ACTIVE PROCESSES ({server.processes.length})</span>
          <small>Click to kill (SIGKILL)</small>
        </div>

        <div className="processes-list">
          {server.processes.map((proc) => {
            return (
              <button
                key={proc.pid}
                type="button"
                onClick={() => onKillProcess(server.id, proc.pid)}
                className={`proc-row ${proc.isLeaking ? 'leaking' : proc.isZombie ? 'zombie' : ''}`}
                title={`Click to terminate PID ${proc.pid}`}
              >
                <div className="proc-main-info">
                  <span className="proc-pid">{proc.pid}</span>
                  <span className="proc-name">{proc.name}</span>
                </div>

                <div className="proc-status-badge">
                  {proc.isLeaking && <span className="leak-tag">LEAK +{proc.leakRate}%</span>}
                  {proc.isZombie && <span className="zombie-tag">ZOMBIE</span>}
                  <span className="proc-ram">{proc.ramUsage}%</span>
                  <span className="kill-icon">✕</span>
                </div>
              </button>
            );
          })}

          {server.processes.length === 0 && server.isOnline && (
            <div className="no-processes-state">No workers active. Spawning...</div>
          )}
        </div>
      </div>

      {/* Node Controls */}
      <div className="node-footer-controls">
        <button
          type="button"
          disabled={!server.isOnline || server.ram < 20}
          onClick={() => onFlushCache(server.id)}
          className="node-ctrl-btn flush-btn"
          title="Dump 25% RAM (-RAM, +CPU penalty)"
        >
          🧹 Flush Cache
        </button>

        <button
          type="button"
          disabled={!server.isOnline}
          onClick={() => onRebootNode(server.id)}
          className="node-ctrl-btn reboot-btn"
          title="Reboot node (offline for 4s)"
        >
          🔄 Reboot Node
        </button>
      </div>

      <style>{`
        .server-card {
          background: #0b1329;
          border: 1px solid #1e293b;
          border-radius: var(--radius-lg);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .server-card.critical {
          border-color: #f59e0b;
          box-shadow: 0 0 16px rgba(245, 158, 11, 0.2);
        }

        .server-card.meltdown {
          border-color: #ef4444;
          box-shadow: 0 0 24px rgba(239, 68, 68, 0.45);
          animation: pulseBorder 1.2s infinite;
        }

        @keyframes pulseBorder {
          0%, 100% { border-color: #ef4444; }
          50% { border-color: #7f1d1d; }
        }

        .node-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 8px;
        }

        .node-id-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-indicator.online {
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
        }

        .status-indicator.rebooting {
          background: #f59e0b;
          box-shadow: 0 0 8px #f59e0b;
          animation: blink 0.8s infinite;
        }

        .node-name {
          font-family: var(--font-mono, monospace);
          font-size: 13px;
          font-weight: 700;
          color: #f8fafc;
        }

        .spot-tag {
          font-size: 9px;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 3px;
          background: #8b5cf6;
          color: #ffffff;
        }

        .node-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
        }

        .gauges-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .reboot-overlay {
          position: absolute;
          inset: 0;
          background: rgba(11, 19, 41, 0.92);
          backdrop-filter: blur(4px);
          border-radius: var(--radius-lg);
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #f59e0b;
        }

        .reboot-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #334155;
          border-top-color: #f59e0b;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .processes-section {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .processes-header {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #64748b;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .processes-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 140px;
          overflow-y: auto;
        }

        .proc-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 5px 8px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: var(--radius-sm);
          color: #e2e8f0;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .proc-row:hover {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.15);
        }

        .proc-row.leaking {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.22);
          animation: pulseRed 1s infinite;
        }

        @keyframes pulseRed {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .proc-row.zombie {
          border-color: #f59e0b;
          color: #cbd5e1;
          opacity: 0.85;
        }

        .proc-main-info {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .proc-pid {
          color: #64748b;
          font-size: 10px;
        }

        .proc-name {
          font-weight: 600;
        }

        .proc-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .leak-tag {
          font-size: 9px;
          font-weight: 800;
          color: #ffffff;
          background: #ef4444;
          padding: 1px 4px;
          border-radius: 2px;
        }

        .zombie-tag {
          font-size: 9px;
          font-weight: 800;
          color: #000000;
          background: #f59e0b;
          padding: 1px 4px;
          border-radius: 2px;
        }

        .proc-ram {
          font-weight: 700;
          color: #38bdf8;
        }

        .kill-icon {
          color: #ef4444;
          font-weight: 800;
          opacity: 0.4;
          transition: opacity 0.15s;
        }

        .proc-row:hover .kill-icon {
          opacity: 1;
        }

        .no-processes-state {
          padding: 10px;
          text-align: center;
          font-size: 11px;
          color: #64748b;
        }

        .node-footer-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .node-ctrl-btn {
          font-size: 11px;
          font-weight: 700;
          padding: 7px 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          border: 1px solid #334155;
          background: #1e293b;
          color: #f8fafc;
          transition: all 0.15s ease;
        }

        .node-ctrl-btn:hover:not(:disabled) {
          border-color: #38bdf8;
          background: #334155;
        }

        .node-ctrl-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .reboot-btn:hover:not(:disabled) {
          border-color: #f59e0b;
        }
      `}</style>
    </div>
  );
};
