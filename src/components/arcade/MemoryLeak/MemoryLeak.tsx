import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationEngine, type SimState } from './SimulationEngine';
import { ServerNode } from './ServerNode';
import { EventLog } from './EventLog';
import { GameOverScreen } from '../shared/GameOverScreen';
import { storage } from '../shared/storage';
import { TICK_INTERVAL_MS } from './constants';

type ScreenState = 'menu' | 'playing' | 'gameover';

export const MemoryLeak: React.FC = () => {
  const [screenState, setScreenState] = useState<ScreenState>('menu');
  const engineRef = useRef<SimulationEngine | null>(null);
  const [simState, setSimState] = useState<SimState | null>(null);
  const timerRef = useRef<any>(null);

  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setHighScore(storage.getHighScore('memory-leak'));
  }, []);

  const handleStartGame = () => {
    const engine = new SimulationEngine(Date.now());
    engineRef.current = engine;
    setSimState({ ...engine.getState() });
    setScreenState('playing');

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (!engineRef.current) return;
      const updated = engineRef.current.tick();
      setSimState({ ...updated });

      if (updated.isGameOver) {
        clearInterval(timerRef.current);
        handleGameOver(updated);
      }
    }, TICK_INTERVAL_MS);
  };

  const handleGameOver = (finalState: SimState) => {
    const { isNewHighScore: newRecord, streak: newStreak } = storage.recordGameFinished(
      'memory-leak',
      finalState.uptime,
      {
        requests: finalState.requestsServed,
        killed: finalState.processesKilled,
        peakRps: finalState.peakRps,
      }
    );

    setIsNewHighScore(newRecord);
    setStreak(newStreak);
    setHighScore(storage.getHighScore('memory-leak'));
    setScreenState('gameover');
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleKillProcess = useCallback((serverId: number, pid: number) => {
    if (!engineRef.current) return;
    engineRef.current.applyAction({ type: 'KILL_PROCESS', serverId, pid });
    setSimState({ ...engineRef.current.getState() });
  }, []);

  const handleFlushCache = useCallback((serverId: number) => {
    if (!engineRef.current) return;
    engineRef.current.applyAction({ type: 'FLUSH_CACHE', serverId });
    setSimState({ ...engineRef.current.getState() });
  }, []);

  const handleRebootNode = useCallback((serverId: number) => {
    if (!engineRef.current) return;
    engineRef.current.applyAction({ type: 'REBOOT_NODE', serverId });
    setSimState({ ...engineRef.current.getState() });
  }, []);

  const handleScaleUp = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.applyAction({ type: 'SCALE_UP' });
    setSimState({ ...engineRef.current.getState() });
  }, []);

  const formatUptime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const getCustomShareText = (): string => {
    if (!simState) return '';
    return `🔥 Memory Leak: Chaos Engineering Simulator\n` +
      `⏱️ Survived: ${formatUptime(simState.uptime)} | Requests: ${simState.requestsServed.toLocaleString()}\n` +
      `☠️ Zombies/Leaks Killed: ${simState.processesKilled} | Peak Traffic: ${simState.peakRps} req/s\n` +
      `${isNewHighScore ? '🏆 New Personal Survival Record!\n' : ''}` +
      `Can your cluster survive the chaos? https://devscrolls.dev/arcade/memory-leak/`;
  };

  return (
    <div className="leak-root-container">
      {/* State 1: Menu */}
      {screenState === 'menu' && (
        <div className="leak-menu-card">
          <div className="leak-badge">
            <span>🔥 CHAOS SIMULATOR</span>
          </div>
          <h1 className="leak-title">Memory Leak</h1>
          <p className="leak-subtitle">
            Keep your Kubernetes cluster alive under cascading outages, runaway memory leaks, and incoming traffic spikes. How many seconds can you survive?
          </p>

          <div className="leak-rules-grid">
            <div className="rule-item">
              <span className="rule-icon">☠️</span>
              <div className="rule-text">
                <strong>Kill Leaking Processes</strong>
                <small>Click leaking (+X%/tick) or zombie processes before RAM hits 100%.</small>
              </div>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🧹</span>
              <div className="rule-text">
                <strong>Flush Node Cache</strong>
                <small>Dumps 25% RAM instantly at the cost of a quick CPU spike.</small>
              </div>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🔄</span>
              <div className="rule-text">
                <strong>Reboot Critical Nodes</strong>
                <small>Clears all corrupt workers, but node stays offline for 4 seconds.</small>
              </div>
            </div>
            <div className="rule-item">
              <span className="rule-icon">🚀</span>
              <div className="rule-text">
                <strong>Auto-Scale Spot Burst</strong>
                <small>Deploy temporary 4th node to relieve traffic load.</small>
              </div>
            </div>
          </div>

          {highScore > 0 && (
            <div className="leak-best-banner">
              <span>🏆 Longest Uptime Record:</span>
              <strong>{formatUptime(highScore)}</strong>
            </div>
          )}

          <button type="button" onClick={handleStartGame} className="leak-launch-btn">
            <span>Launch Cluster & Begin Chaos</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>
        </div>
      )}

      {/* State 2: Active Simulation */}
      {screenState === 'playing' && simState && (
        <div className="leak-dashboard">
          {/* Top Ops HUD */}
          <div className="ops-hud-bar">
            <div className="hud-metric-pill">
              <span className="pill-label">UPTIME</span>
              <strong className="pill-val uptime">{formatUptime(simState.uptime)}</strong>
            </div>
            <div className="hud-metric-pill">
              <span className="pill-label">INGRESS TRAFFIC</span>
              <strong className="pill-val">{simState.currentRps} req/s</strong>
            </div>
            <div className="hud-metric-pill">
              <span className="pill-label">REQUESTS SERVED</span>
              <strong className="pill-val">{simState.requestsServed.toLocaleString()}</strong>
            </div>
            <div className="hud-metric-pill">
              <span className="pill-label">SIGKILLS EXECUTED</span>
              <strong className="pill-val kills">{simState.processesKilled}</strong>
            </div>

            <button
              type="button"
              disabled={simState.scaleUpCooldown > 0 || simState.servers.length >= 4}
              onClick={handleScaleUp}
              className={`scale-up-action-btn ${simState.scaleUpCooldown > 0 ? 'cooling' : ''}`}
              title="Add 4th spot instance for 30s"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <span>
                {simState.scaleUpCooldown > 0
                  ? `Scale Cooldown (${simState.scaleUpCooldown}s)`
                  : '+ Scale Spot Node'}
              </span>
            </button>
          </div>

          {/* Cluster Grid */}
          <div className="servers-grid">
            {simState.servers.map((server) => (
              <ServerNode
                key={server.id}
                server={server}
                onKillProcess={handleKillProcess}
                onFlushCache={handleFlushCache}
                onRebootNode={handleRebootNode}
              />
            ))}
          </div>

          {/* Incident Event Log */}
          <EventLog events={simState.events} />
        </div>
      )}

      {/* State 3: Game Over */}
      {screenState === 'gameover' && simState && (
        <GameOverScreen
          gameId="memory-leak"
          gameTitle="Memory Leak: Chaos Simulator"
          score={simState.uptime}
          unit="seconds uptime"
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          streak={streak}
          onPlayAgain={handleStartGame}
          onShareCustomText={getCustomShareText}
        />
      )}

      <style>{`
        .leak-root-container {
          width: 100%;
          min-height: 100%;
          background: #060b18;
          color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
          overflow-y: auto;
        }

        .leak-menu-card {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-lg);
          padding: 32px;
          max-width: 620px;
          width: 100%;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 18px;
        }

        .leak-badge {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 4px 12px;
          border-radius: var(--radius-full);
        }

        .leak-title {
          font-size: 32px;
          font-weight: 900;
          margin: 0;
          letter-spacing: -0.02em;
          color: #ffffff;
        }

        .leak-subtitle {
          font-size: 14.5px;
          color: #94a3b8;
          line-height: 1.5;
          margin: 0;
        }

        .leak-rules-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          width: 100%;
          text-align: left;
        }

        .rule-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #0b1329;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          padding: 10px 12px;
        }

        .rule-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .rule-text strong {
          display: block;
          font-size: 12.5px;
          color: #f1f5f9;
        }

        .rule-text small {
          font-size: 11px;
          color: #64748b;
          line-height: 1.3;
          display: block;
          margin-top: 2px;
        }

        .leak-best-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #94a3b8;
          background: #0b1329;
          border: 1px solid #1e293b;
          padding: 8px 16px;
          border-radius: var(--radius-full);
        }

        .leak-best-banner strong {
          color: #38bdf8;
        }

        .leak-launch-btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
          color: #ffffff;
          border: none;
          padding: 14px 20px;
          border-radius: var(--radius-md);
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
          transition: transform 0.2s, filter 0.2s;
        }

        .leak-launch-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
        }

        /* Active Dashboard */
        .leak-dashboard {
          max-width: 1200px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .ops-hud-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: var(--radius-md);
          padding: 10px 16px;
        }

        .hud-metric-pill {
          display: flex;
          flex-direction: column;
        }

        .pill-label {
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #64748b;
        }

        .pill-val {
          font-family: var(--font-mono, monospace);
          font-size: 16px;
          font-weight: 800;
          color: #f8fafc;
        }

        .pill-val.uptime {
          color: #38bdf8;
        }

        .pill-val.kills {
          color: #ef4444;
        }

        .scale-up-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          background: #8b5cf6;
          color: #ffffff;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .scale-up-action-btn:hover:not(:disabled) {
          filter: brightness(1.15);
          transform: translateY(-1px);
        }

        .scale-up-action-btn.cooling,
        .scale-up-action-btn:disabled {
          background: #1e293b;
          color: #64748b;
          cursor: not-allowed;
        }

        .servers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 14px;
        }

        @media (max-width: 640px) {
          .leak-rules-grid {
            grid-template-columns: 1fr;
          }
          .ops-hud-bar {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};
